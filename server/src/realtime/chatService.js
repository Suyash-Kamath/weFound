import { Conversation } from "../models/Conversation.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { Notification } from "../models/Notification.js";

export const conversationRoom = (conversationId) => `conversation:${conversationId.toString()}`;
export const userRoom = (userId) => `user:${userId.toString()}`;

// finderSessionId is deliberately left out: it is the finder's only credential,
// so it must never be sent to the owner (or anyone else).
export function serializeConversation(conversation, unreadCount = 0) {
  return {
    id: conversation._id.toString(),
    itemId: conversation.itemId.toString(),
    stickerId: conversation.stickerId.toString(),
    ownerId: conversation.ownerId.toString(),
    finderName: conversation.finderName,
    status: conversation.status,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    unreadCount,
  };
}

export function serializeMessage(message) {
  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    senderType: message.senderType,
    senderUserId: message.senderUserId ? message.senderUserId.toString() : null,
    content: message.content,
    messageType: message.messageType,
    readByOwner: Boolean(message.readByOwner),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

export function serializeNotification(notification) {
  return {
    id: notification._id.toString(),
    userId: notification.userId.toString(),
    conversationId: notification.conversationId.toString(),
    messageId: notification.messageId ? notification.messageId.toString() : null,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

// A matching finder session wins over the login token, so an owner who is
// logged in and chats as a finder on someone else's item is treated as the finder.
export function getRoleForConversation(conversation, { userId, finderSessionId }) {
  if (typeof finderSessionId === "string" && finderSessionId && conversation.finderSessionId === finderSessionId) return "finder";
  if (userId && conversation.ownerId.toString() === userId) return "owner";
  return null;
}

export function ownerIsInConversationRoom(io, conversation) {
  const roomSockets = io?.sockets?.adapter?.rooms?.get(conversationRoom(conversation._id));
  if (!roomSockets || !roomSockets.size) return false;
  const ownerId = conversation.ownerId.toString();
  for (const socketId of roomSockets) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket?.data?.userId === ownerId) return true;
  }
  return false;
}

async function createOwnerMessageNotification({ conversation, message, content }) {
  return Notification.create({
    userId: conversation.ownerId,
    conversationId: conversation._id,
    messageId: message._id,
    type: "new_message",
    title: "New finder message",
    body: content.slice(0, 180),
  });
}

// Saves a message and pushes it to everyone who should see it. Used by both
// the REST endpoint and the socket handler so they behave the same.
export async function deliverMessage({ io, conversation, role, content, senderUserId }) {
  const message = await ChatMessage.create({
    conversationId: conversation._id,
    senderType: role,
    senderUserId: role === "owner" ? senderUserId : null,
    content,
    messageType: "text",
    readByOwner: role === "owner",
  });

  await Conversation.updateOne({ _id: conversation._id }, { $set: { lastMessageAt: message.createdAt } });

  const messagePayload = serializeMessage(message);
  const shouldNotifyOwner = role === "finder" && !ownerIsInConversationRoom(io, conversation);
  const notification = shouldNotifyOwner ? await createOwnerMessageNotification({ conversation, message, content }) : null;

  if (io) {
    // One emit to both rooms: socket.io sends it once per socket even if a
    // socket is in both, and the owner's other tabs see it for their chat list.
    io.to(conversationRoom(conversation._id))
      .to(userRoom(conversation.ownerId))
      .emit("chat:message", { conversationId: conversation._id.toString(), message: messagePayload });
    if (notification) {
      io.to(userRoom(conversation.ownerId)).emit("chat:notification", { notification: serializeNotification(notification) });
    }
  }

  return messagePayload;
}

export async function markConversationReadForOwner(conversationId) {
  await ChatMessage.updateMany(
    { conversationId, senderType: "finder", readByOwner: false },
    { $set: { readByOwner: true } }
  );

  await Notification.updateMany(
    { conversationId, type: "new_message", readAt: null },
    { $set: { readAt: new Date() } }
  );
}

// Unread finder messages per conversation, in a single query.
export async function getUnreadCounts(conversationIds) {
  if (!conversationIds.length) return new Map();
  const rows = await ChatMessage.aggregate([
    { $match: { conversationId: { $in: conversationIds }, senderType: "finder", readByOwner: false } },
    { $group: { _id: "$conversationId", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}
