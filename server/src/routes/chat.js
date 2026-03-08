import { Router } from "express";
import { z } from "zod";
import { authRequired, optionalAuth } from "../middleware/auth.js";
import { Item } from "../models/Item.js";
import { Sticker } from "../models/Sticker.js";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { Notification } from "../models/Notification.js";
import {
  createOwnerMessageNotification,
  getRoleForConversation,
  getUnreadCountForConversation,
  markConversationReadForOwner,
  sendConversationMessage,
  serializeConversation,
  serializeMessage,
  serializeNotification,
} from "../realtime/chatService.js";

const router = Router();

const startChatSchema = z.object({
  shortCode: z.string().min(1),
  finderSessionId: z.string().min(8),
  finderName: z.string().min(1).max(60).optional(),
});

const postMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  finderSessionId: z.string().min(8).optional(),
});

const getFinderSessionId = (req) => {
  if (typeof req.query.finderSessionId === "string") return req.query.finderSessionId;
  if (typeof req.headers["x-finder-session"] === "string") return req.headers["x-finder-session"];
  return undefined;
};

const ownerIsInConversationRoom = (io, conversation) => {
  const roomName = `conversation:${conversation._id.toString()}`;
  const roomSockets = io?.sockets?.adapter?.rooms?.get(roomName);
  if (!roomSockets || !roomSockets.size) return false;
  for (const socketId of roomSockets) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket?.data?.userId === conversation.ownerId.toString()) return true;
  }
  return false;
};

router.post("/start", async (req, res) => {
  const parsed = startChatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const sticker = await Sticker.findOne({ shortCode: parsed.data.shortCode }).lean();
  if (!sticker || sticker.status !== "active") return res.status(404).json({ error: "Active sticker not found" });

  const item = await Item.findById(sticker.itemId).lean();
  if (!item) return res.status(404).json({ error: "Item not found" });

  const owner = await User.findById(item.userId).lean();
  if (!owner) return res.status(404).json({ error: "Owner not found" });

  let conversation = await Conversation.findOne({
    stickerId: sticker._id,
    finderSessionId: parsed.data.finderSessionId,
    status: "active",
  });

  if (!conversation) {
    conversation = await Conversation.create({
      itemId: item._id,
      stickerId: sticker._id,
      ownerId: owner._id,
      finderSessionId: parsed.data.finderSessionId,
      finderName: parsed.data.finderName || "Finder",
      status: "active",
    });
  }

  const messages = await ChatMessage.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(200).lean();

  return res.json({
    conversation: serializeConversation(conversation),
    owner: { id: owner._id.toString(), name: owner.name },
    item: { id: item._id.toString(), name: item.name, category: item.category },
    messages: messages.map(serializeMessage),
  });
});

router.get("/conversations/me", authRequired, async (req, res) => {
  const conversations = await Conversation.find({ ownerId: req.user.id }).sort({ updatedAt: -1 }).lean();
  const itemsById = new Map();

  const itemIds = conversations.map((conversation) => conversation.itemId);
  if (itemIds.length) {
    const items = await Item.find({ _id: { $in: itemIds } }).lean();
    for (const item of items) itemsById.set(item._id.toString(), item);
  }

  const payload = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await getUnreadCountForConversation(conversation._id);
      const item = itemsById.get(conversation.itemId.toString());
      return {
        ...serializeConversation(conversation, unreadCount),
        item: item ? { id: item._id.toString(), name: item.name, category: item.category } : null,
      };
    })
  );

  return res.json({ conversations: payload });
});

router.get("/conversations/:id/messages", optionalAuth, async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const finderSessionId = getFinderSessionId(req);
  const role = getRoleForConversation(conversation, {
    userId: req.user?.id,
    finderSessionId,
  });

  if (!role) return res.status(403).json({ error: "Forbidden" });

  const messages = await ChatMessage.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();

  if (role === "owner") {
    await markConversationReadForOwner(conversation._id);
  }

  return res.json({
    conversation: serializeConversation(conversation),
    role,
    messages: messages.map(serializeMessage),
  });
});

router.post("/conversations/:id/messages", optionalAuth, async (req, res) => {
  const parsed = postMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const role = getRoleForConversation(conversation, {
    userId: req.user?.id,
    finderSessionId: parsed.data.finderSessionId,
  });

  if (!role) return res.status(403).json({ error: "Forbidden" });

  const { message } = await sendConversationMessage({
    conversation,
    role,
    content: parsed.data.content.trim(),
    senderUserId: req.user?.id,
  });

  const io = req.app.get("io");
  const room = `conversation:${conversation._id.toString()}`;
  const messagePayload = serializeMessage(message);
  const shouldNotifyOwner = role === "finder" && !ownerIsInConversationRoom(io, conversation);
  const notification = shouldNotifyOwner
    ? await createOwnerMessageNotification({
        conversation,
        message,
        content: parsed.data.content.trim(),
      })
    : null;

  if (io) {
    io.to(room).emit("chat:message", { conversationId: conversation._id.toString(), message: messagePayload });
    io.to(room).emit("message-recieved", messagePayload);
    if (role === "finder") {
      io.to(`user:${conversation.ownerId.toString()}`).emit("message-recieved", messagePayload);
    }
    if (notification) {
      io.to(`user:${conversation.ownerId.toString()}`).emit("chat:notification", { notification: serializeNotification(notification) });
    }
  }

  return res.json({ message: messagePayload });
});

router.get("/notifications/me", authRequired, async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100).lean();
  const unreadCount = await Notification.countDocuments({ userId: req.user.id, readAt: null });
  return res.json({ notifications: notifications.map(serializeNotification), unreadCount });
});

router.post("/notifications/:id/read", authRequired, async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true }
  ).lean();

  if (!notification) return res.json({ success: true });
  return res.json({ notification: serializeNotification(notification) });
});

router.post("/notifications/read-all", authRequired, async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, readAt: null }, { $set: { readAt: new Date() } });
  return res.json({ success: true });
});

export default router;
