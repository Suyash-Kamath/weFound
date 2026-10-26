import { Conversation } from "../models/Conversation.js";
import { verifyToken } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { conversationRoom, deliverMessage, getRoleForConversation, userRoom } from "./chatService.js";

function getUserIdFromSocket(socket) {
  const token = socket.handshake.auth?.token;
  if (!token || typeof token !== "string") return null;
  try {
    return verifyToken(token).id;
  } catch (_error) {
    return null;
  }
}

async function resolveConversationRole(socket, conversationId, finderSessionIdOverride) {
  if (typeof conversationId !== "string") return { error: "conversationId is required" };
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return { error: "Conversation not found" };

  const role = getRoleForConversation(conversation, {
    userId: socket.data.userId,
    finderSessionId: finderSessionIdOverride || socket.data.finderSessionId,
  });

  if (!role) return { error: "Forbidden" };
  return { conversation, role };
}

// Every handler goes through this: a thrown error (bad id, bad payload, DB
// hiccup) answers the client instead of crashing the server.
function safeHandler(handler) {
  return async (payload, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    try {
      await handler(payload && typeof payload === "object" ? payload : {}, reply);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Chat socket handler failed:", error);
      reply({ ok: false, error: "Something went wrong" });
    }
  };
}

const messageLimiter = createRateLimiter({ windowMs: 10 * 1000, max: 15 });

export function attachChatSocket(io) {
  io.on("connection", (socket) => {
    socket.data.userId = getUserIdFromSocket(socket);
    const handshakeSession = socket.handshake.auth?.finderSessionId;
    socket.data.finderSessionId = typeof handshakeSession === "string" ? handshakeSession : null;
    // conversationId -> "owner" | "finder", filled in by a successful chat:join
    socket.data.conversationRoles = new Map();

    // The only user room a socket may join is the one proven by its login token.
    if (socket.data.userId) {
      socket.join(userRoom(socket.data.userId));
    }

    socket.on("chat:join", safeHandler(async ({ conversationId, finderSessionId }, ack) => {
      const resolved = await resolveConversationRole(socket, conversationId, finderSessionId);
      if (resolved.error) {
        ack({ ok: false, error: resolved.error });
        return;
      }

      socket.join(conversationRoom(conversationId));
      socket.data.conversationRoles.set(conversationId, resolved.role);
      ack({ ok: true, role: resolved.role });
    }));

    socket.on("leave-chat", (conversationId) => {
      if (typeof conversationId !== "string") return;
      socket.leave(conversationRoom(conversationId));
      socket.data.conversationRoles.delete(conversationId);
    });

    socket.on("chat:send", safeHandler(async ({ conversationId, content, finderSessionId }, ack) => {
      if (typeof content !== "string" || !content.trim() || content.length > 4000) {
        ack({ ok: false, error: "Message must be between 1 and 4000 characters" });
        return;
      }
      if (!messageLimiter(socket.id)) {
        ack({ ok: false, error: "You are sending messages too fast." });
        return;
      }

      const resolved = await resolveConversationRole(socket, conversationId, finderSessionId);
      if (resolved.error) {
        ack({ ok: false, error: resolved.error });
        return;
      }

      const message = await deliverMessage({
        io,
        conversation: resolved.conversation,
        role: resolved.role,
        content: content.trim(),
        senderUserId: socket.data.userId,
      });

      ack({ ok: true, message });
    }));

    socket.on("chat:typing", safeHandler(({ conversationId, isTyping }, ack) => {
      if (typeof conversationId !== "string" || typeof isTyping !== "boolean") {
        ack({ ok: false, error: "conversationId and isTyping are required" });
        return;
      }

      // Only sockets that passed chat:join are in the room, so this is the auth check.
      const room = conversationRoom(conversationId);
      const senderType = socket.data.conversationRoles.get(conversationId);
      if (!socket.rooms.has(room) || !senderType) {
        ack({ ok: false, error: "Join the conversation first" });
        return;
      }

      socket.to(room).emit("chat:typing", { conversationId, senderType, isTyping });
      ack({ ok: true });
    }));
  });
}
