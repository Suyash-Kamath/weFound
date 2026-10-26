import { Router } from "express";
import { z } from "zod";
import { authRequired, optionalAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { Item } from "../models/Item.js";
import { Sticker } from "../models/Sticker.js";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { Notification } from "../models/Notification.js";
import {
  deliverMessage,
  getRoleForConversation,
  getUnreadCounts,
  markConversationReadForOwner,
  serializeConversation,
  serializeMessage,
  serializeNotification,
} from "../realtime/chatService.js";

const router = Router();

const startChatLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });
const postMessageLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: "You are sending messages too fast." });

const startChatSchema = z.object({
  shortCode: z.string().min(1).max(32),
  finderSessionId: z.string().min(8).max(100),
  finderName: z.string().trim().min(1).max(60).optional(),
});

const postMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  finderSessionId: z.string().min(8).max(100).optional(),
});

const getFinderSessionId = (req) => {
  if (typeof req.query.finderSessionId === "string") return req.query.finderSessionId;
  if (typeof req.headers["x-finder-session"] === "string") return req.headers["x-finder-session"];
  return undefined;
};

const activeConversationFilter = (stickerId, finderSessionId) => ({
  stickerId,
  finderSessionId,
  status: "active",
});

router.post("/start", startChatLimiter, asyncHandler(async (req, res) => {
  const parsed = startChatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const sticker = await Sticker.findOne({ shortCode: parsed.data.shortCode }).lean();
  if (!sticker || sticker.status !== "active" || !sticker.itemId) return res.status(404).json({ error: "Active sticker not found" });

  const item = await Item.findById(sticker.itemId).lean();
  if (!item) return res.status(404).json({ error: "Item not found" });
  if (!item.contactOptions?.showInAppChat) {
    return res.status(403).json({ error: "The owner has turned off in-app chat for this item." });
  }

  const owner = await User.findById(item.userId).lean();
  if (!owner) return res.status(404).json({ error: "Owner not found" });

  const filter = activeConversationFilter(sticker._id, parsed.data.finderSessionId);
  let conversation = await Conversation.findOne(filter);

  if (!conversation) {
    try {
      conversation = await Conversation.create({
        itemId: item._id,
        stickerId: sticker._id,
        ownerId: owner._id,
        finderSessionId: parsed.data.finderSessionId,
        finderName: parsed.data.finderName || "Finder",
        status: "active",
      });
    } catch (error) {
      // A double tap can create the same chat twice; the unique index stops
      // the second one, so just use the chat the first request made.
      if (error?.code !== 11000) throw error;
      conversation = await Conversation.findOne(filter);
      if (!conversation) throw error;
    }
  }

  const messages = await ChatMessage.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(200).lean();

  return res.json({
    conversation: serializeConversation(conversation),
    owner: { id: owner._id.toString(), name: owner.name },
    item: { id: item._id.toString(), name: item.name, category: item.category },
    messages: messages.map(serializeMessage),
  });
}));

router.get("/conversations/me", authRequired, asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ ownerId: req.user.id }).sort({ updatedAt: -1 }).lean();
  const itemsById = new Map();

  const itemIds = conversations.map((conversation) => conversation.itemId);
  if (itemIds.length) {
    const items = await Item.find({ _id: { $in: itemIds } }).lean();
    for (const item of items) itemsById.set(item._id.toString(), item);
  }

  const unreadCounts = await getUnreadCounts(conversations.map((conversation) => conversation._id));
  const payload = conversations.map((conversation) => {
    const item = itemsById.get(conversation.itemId.toString());
    return {
      ...serializeConversation(conversation, unreadCounts.get(conversation._id.toString()) || 0),
      item: item ? { id: item._id.toString(), name: item.name, category: item.category } : null,
    };
  });

  return res.json({ conversations: payload });
}));

router.get("/conversations/:id/messages", optionalAuth, asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const role = getRoleForConversation(conversation, {
    userId: req.user?.id,
    finderSessionId: getFinderSessionId(req),
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
}));

router.post("/conversations/:id/messages", postMessageLimiter, optionalAuth, asyncHandler(async (req, res) => {
  const parsed = postMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const role = getRoleForConversation(conversation, {
    userId: req.user?.id,
    finderSessionId: parsed.data.finderSessionId,
  });

  if (!role) return res.status(403).json({ error: "Forbidden" });

  const message = await deliverMessage({
    io: req.app.get("io"),
    conversation,
    role,
    content: parsed.data.content,
    senderUserId: req.user?.id,
  });

  return res.json({ message });
}));

router.get("/notifications/me", authRequired, asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100).lean();
  const unreadCount = await Notification.countDocuments({ userId: req.user.id, readAt: null });
  return res.json({ notifications: notifications.map(serializeNotification), unreadCount });
}));

router.post("/notifications/:id/read", authRequired, asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true }
  ).lean();

  if (!notification) return res.json({ success: true });
  return res.json({ notification: serializeNotification(notification) });
}));

router.post("/notifications/read-all", authRequired, asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, readAt: null }, { $set: { readAt: new Date() } });
  return res.json({ success: true });
}));

export default router;
