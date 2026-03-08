import { Conversation } from "../models/Conversation.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { Notification } from "../models/Notification.js";

export function serializeConversation(conversation, unreadCount = 0) {
  return {
    id: conversation._id.toString(),
    itemId: conversation.itemId.toString(),
    stickerId: conversation.stickerId.toString(),
    ownerId: conversation.ownerId.toString(),
    finderSessionId: conversation.finderSessionId,
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

export function getRoleForConversation(conversation, { userId, finderSessionId }) {
  if (userId && conversation.ownerId.toString() === userId) return "owner";
  if (finderSessionId && conversation.finderSessionId === finderSessionId) return "finder";
  return null;
}

export async function sendConversationMessage({ conversation, role, content, senderUserId }) {
  const message = await ChatMessage.create({
    conversationId: conversation._id,
    senderType: role,
    senderUserId: role === "owner" ? senderUserId : null,
    content,
    messageType: "text",
    readByOwner: role === "owner",
  });

  await Conversation.findByIdAndUpdate(conversation._id, {
    $set: { lastMessageAt: message.createdAt },
  });

  return { message };
}

export async function createOwnerMessageNotification({ conversation, message, content }) {
  return Notification.create({
    userId: conversation.ownerId,
    conversationId: conversation._id,
    messageId: message._id,
    type: "new_message",
    title: "New finder message",
    body: content.slice(0, 180),
  });
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

export async function getUnreadCountForConversation(conversationId) {
  return ChatMessage.countDocuments({ conversationId, senderType: "finder", readByOwner: false });
}
