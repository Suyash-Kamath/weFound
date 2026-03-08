import jwt from "jsonwebtoken";
import { Conversation } from "../models/Conversation.js";
import {
  createOwnerMessageNotification,
  getRoleForConversation,
  sendConversationMessage,
  serializeMessage,
  serializeNotification,
} from "./chatService.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

function getUserIdFromSocket(socket) {
  const token = socket.handshake.auth?.token;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.id;
  } catch (_error) {
    return null;
  }
}

function ownerIsInConversationRoom(io, conversation) {
  const roomName = `conversation:${conversation._id.toString()}`;
  const roomSockets = io.sockets.adapter.rooms.get(roomName);
  if (!roomSockets || !roomSockets.size) return false;
  for (const socketId of roomSockets) {
    const roomSocket = io.sockets.sockets.get(socketId);
    if (roomSocket?.data?.userId === conversation.ownerId.toString()) return true;
  }
  return false;
}

async function resolveConversationRole(socket, conversationId, finderSessionIdOverride) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return { error: "Conversation not found" };

  const role = getRoleForConversation(conversation, {
    userId: socket.data.userId,
    finderSessionId: finderSessionIdOverride || socket.data.finderSessionId,
  });

  if (!role) return { error: "Forbidden" };
  return { conversation, role };
}

export function attachChatSocket(io) {
  io.on("connection", (socket) => {
    socket.data.userId = getUserIdFromSocket(socket);
    socket.data.finderSessionId = socket.handshake.auth?.finderSessionId || null;

    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
    }

    socket.on("setup", (userId) => {
      if (userId) socket.join(`user:${userId}`);
      socket.emit("connected");
    });

    socket.on("chat:join", async (payload = {}, ack = () => {}) => {
      const { conversationId, finderSessionId } = payload;
      if (!conversationId) {
        ack({ ok: false, error: "conversationId is required" });
        return;
      }

      const resolved = await resolveConversationRole(socket, conversationId, finderSessionId);
      if (resolved.error) {
        ack({ ok: false, error: resolved.error });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      socket.to(`conversation:${conversationId}`).emit("remote-user-joined", socket.id);
      ack({ ok: true, role: resolved.role });
    });

    socket.on("join-chat", (conversationId) => {
      if (!conversationId) return;
      socket.join(`conversation:${conversationId}`);
      socket.to(`conversation:${conversationId}`).emit("remote-user-joined", socket.id);
    });

    socket.on("leave-chat", (conversationId) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("remote-user-left", socket.id);
      socket.leave(`conversation:${conversationId}`);
    });

    const handleSendMessage = async (payload = {}, ack = () => {}) => {
      const { conversationId, content, finderSessionId } = payload;
      if (!conversationId || typeof content !== "string" || !content.trim()) {
        ack({ ok: false, error: "conversationId and content are required" });
        return;
      }

      const resolved = await resolveConversationRole(socket, conversationId, finderSessionId);
      if (resolved.error) {
        ack({ ok: false, error: resolved.error });
        return;
      }

      const { message } = await sendConversationMessage({
        conversation: resolved.conversation,
        role: resolved.role,
        content: content.trim(),
        senderUserId: socket.data.userId,
      });
      const shouldNotifyOwner = resolved.role === "finder" && !ownerIsInConversationRoom(io, resolved.conversation);
      const notification = shouldNotifyOwner
        ? await createOwnerMessageNotification({
            conversation: resolved.conversation,
            message,
            content: content.trim(),
          })
        : null;

      const messagePayload = serializeMessage(message);
      io.to(`conversation:${conversationId}`).emit("chat:message", {
        conversationId,
        message: messagePayload,
      });
      socket.to(`conversation:${conversationId}`).emit("message-recieved", messagePayload);
      if (resolved.role === "finder") {
        io.to(`user:${resolved.conversation.ownerId.toString()}`).emit("message-recieved", messagePayload);
      }

      if (notification) {
        io.to(`user:${resolved.conversation.ownerId.toString()}`).emit("chat:notification", {
          notification: serializeNotification(notification),
        });
      }

      ack({ ok: true, message: messagePayload });
    };

    socket.on("chat:send", handleSendMessage);

    socket.on("new-message", async (payload = {}, ack = () => {}) => {
      await handleSendMessage(payload, ack);
    });

    socket.on("chat:typing", async (payload = {}, ack = () => {}) => {
      const { conversationId, isTyping, finderSessionId } = payload;
      if (!conversationId || typeof isTyping !== "boolean") {
        ack({ ok: false, error: "conversationId and isTyping are required" });
        return;
      }

      const resolved = await resolveConversationRole(socket, conversationId, finderSessionId);
      if (resolved.error) {
        ack({ ok: false, error: resolved.error });
        return;
      }

      socket.to(`conversation:${conversationId}`).emit("chat:typing", {
        conversationId,
        senderType: resolved.role,
        isTyping,
      });
      socket.to(`conversation:${conversationId}`).emit(isTyping ? "typing" : "stop-typing", conversationId);

      ack({ ok: true });
    });

    socket.on("typing", (conversationId) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("typing", conversationId);
    });

    socket.on("stop-typing", (conversationId) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("stop-typing", conversationId);
    });

  });
}
