import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { io, Socket } from "socket.io-client";
import { Bell, Send } from "lucide-react";
import { API_URL, api, getToken } from "@/lib/api";
import { getFinderSessionId } from "@/lib/finderSession";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";

interface ChatConversation {
  id: string;
  finderName: string;
  unreadCount: number;
  item?: { id: string; name: string; category: string } | null;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: "owner" | "finder" | "system";
  content: string;
  createdAt: string;
}

interface ChatNotification {
  id: string;
  conversationId: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

const formatTimestamp = (value: string) => format(new Date(value), "dd MMM 'AT' hh:mm a").toUpperCase();
const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

export default function InAppChat() {
  const { conversationId: conversationIdFromParams } = useParams<{ conversationId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUser = useAuthStore((state) => state.user);

  const [finderSessionId] = useState(() => searchParams.get("finderSessionId") || getFinderSessionId());
  const [templateMessage] = useState(() => searchParams.get("template") || "");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationIdFromParams || null);
  const [draft, setDraft] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const previousConversationRef = useRef<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const unreadNotifications = useMemo(() => notifications.filter((notification) => !notification.readAt).length, [notifications]);
  const isOwner = isAuthenticated;
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);

  const loadOwnerData = useCallback(async () => {
    if (!isOwner) return;
    const [conversationResponse, notificationResponse] = await Promise.all([
      api.get("/chat/conversations/me"),
      api.get("/chat/notifications/me"),
    ]);

    setConversations(conversationResponse.conversations || []);
    setNotifications(notificationResponse.notifications || []);

    if (!activeConversationId && conversationResponse.conversations?.length) {
      const firstId = conversationResponse.conversations[0].id;
      setActiveConversationId(firstId);
      navigate(`/chat/${firstId}`, { replace: true });
    }
  }, [activeConversationId, isOwner, navigate]);

  const loadMessages = useCallback(async (conversationId: string) => {
    const suffix = isOwner ? "" : `?finderSessionId=${encodeURIComponent(finderSessionId)}`;
    const response = await api.get(`/chat/conversations/${conversationId}/messages${suffix}`);
    setMessages(response.messages || []);
  }, [finderSessionId, isOwner]);

  const joinConversation = useCallback((conversationId: string) => {
    if (!socketRef.current) return;
    if (previousConversationRef.current && previousConversationRef.current !== conversationId) {
      socketRef.current.emit("leave-chat", previousConversationRef.current);
    }
    socketRef.current.emit("join-chat", conversationId);
    socketRef.current.emit("chat:join", {
      conversationId,
      finderSessionId: !isOwner ? finderSessionId : undefined,
    });
    previousConversationRef.current = conversationId;
  }, [finderSessionId, isOwner]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!socketRef.current || !activeConversationId) return;
    socketRef.current.emit(isTyping ? "typing" : "stop-typing", activeConversationId);
    socketRef.current.emit("chat:typing", {
      conversationId: activeConversationId,
      isTyping,
      finderSessionId: !isOwner ? finderSessionId : undefined,
    });
  }, [activeConversationId, finderSessionId, isOwner]);

  const sendMessage = useCallback(() => {
    if (!socketRef.current || !activeConversationId || !draft.trim()) return;
    socketRef.current.emit("chat:send", {
      conversationId: activeConversationId,
      content: draft.trim(),
      finderSessionId: !isOwner ? finderSessionId : undefined,
    });
    setDraft("");
    sendTyping(false);
  }, [activeConversationId, draft, finderSessionId, isOwner, sendTyping]);

  useEffect(() => {
    if (!isOwner && !conversationIdFromParams) return;

    const socket = io(API_URL, {
      transports: ["websocket"],
      auth: {
        token: getToken(),
        finderSessionId: !isOwner ? finderSessionId : undefined,
      },
    });

    socketRef.current = socket;

    socket.on("chat:message", ({ conversationId, message }) => {
      if (conversationId === activeConversationId) {
        setMessages((previous) => {
          if (previous.some((item) => item.id === message.id)) return previous;
          return [...previous, message];
        });
      }
      if (isOwner) {
        setConversations((previous) => previous.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          const nextUnread = message.senderType === "finder" ? (conversation.unreadCount || 0) + 1 : conversation.unreadCount;
          return { ...conversation, unreadCount: nextUnread };
        }));
      }
    });

    socket.on("message-recieved", (message) => {
      if (message.conversationId === activeConversationId) {
        setMessages((previous) => {
          if (previous.some((item) => item.id === message.id)) return previous;
          return [...previous, message];
        });
        return;
      }
      if (isOwner) {
        api.get("/chat/conversations/me").then((response) => {
          setConversations(response.conversations || []);
        }).catch(() => {});
      }
    });

    socket.on("chat:typing", ({ conversationId, senderType, isTyping }) => {
      if (conversationId !== activeConversationId) return;
      if ((isOwner && senderType === "finder") || (!isOwner && senderType === "owner")) {
        setPeerTyping(Boolean(isTyping));
      }
    });
    socket.on("typing", () => setPeerTyping(true));
    socket.on("stop-typing", () => setPeerTyping(false));

    socket.on("chat:notification", ({ notification }) => {
      const isSameOpenConversation = isOwner && activeConversationId === notification.conversationId;
      if (isSameOpenConversation) {
        api.post(`/chat/notifications/${notification.id}/read`).catch(() => {});
        return;
      }
      setNotifications((previous) => [notification, ...previous]);
      if (isOwner) {
        api.get("/chat/conversations/me").then((response) => {
          setConversations(response.conversations || []);
        }).catch(() => {});
      }
    });

    return () => {
      if (previousConversationRef.current) {
        socket.emit("leave-chat", previousConversationRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeConversationId, conversationIdFromParams, finderSessionId, isOwner]);

  useEffect(() => {
    if (isOwner) {
      loadOwnerData().catch(() => {});
    }
  }, [isOwner, loadOwnerData]);

  useEffect(() => {
    if (!isOwner || !notificationsOpen) return;
    api.post("/chat/notifications/read-all").then(() => {
      setNotifications((previous) => previous.map((notification) => ({ ...notification, readAt: notification.readAt || new Date().toISOString() })));
    }).catch(() => {});
  }, [isOwner, notificationsOpen]);

  useEffect(() => {
    if (!conversationIdFromParams) return;
    setActiveConversationId(conversationIdFromParams);
  }, [conversationIdFromParams]);

  useEffect(() => {
    if (isOwner || !templateMessage) return;
    setDraft((current) => current || templateMessage);
  }, [isOwner, templateMessage]);

  useEffect(() => {
    if (!activeConversationId) return;
    joinConversation(activeConversationId);
    loadMessages(activeConversationId).catch(() => {
      toast({ title: "Could not load messages", variant: "destructive" });
    });
    if (isOwner) {
      setConversations((previous) => previous.map((conversation) => (
        conversation.id === activeConversationId ? { ...conversation, unreadCount: 0 } : conversation
      )));
    }
  }, [activeConversationId, isOwner, joinConversation, loadMessages, toast]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, peerTyping]);

  const handleDraftChange = (value: string) => {
    setDraft(value);
    sendTyping(true);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => sendTyping(false), 1200);
  };

  const onConversationSelect = (conversation: ChatConversation) => {
    setActiveConversationId(conversation.id);
    if (isOwner) navigate(`/chat/${conversation.id}`);
  };

  if (!isOwner && !conversationIdFromParams) {
    return <div className="scan-page scan-page-center"><p>Open chat from a QR scan page.</p></div>;
  }

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", padding: "1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: isOwner ? "320px 1fr" : "1fr", gap: "1rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        {isOwner && (
          <div className="page-card" style={{ height: "calc(100vh - 3rem)", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>Chats</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setNotificationsOpen((current) => !current)}>
                <Bell size={16} /> {unreadNotifications > 0 ? unreadNotifications : ""}
              </button>
            </div>
            {notificationsOpen && (
              <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "0.75rem", marginBottom: "1rem", maxHeight: "220px", overflow: "auto" }}>
                {notifications.length === 0 ? <p style={{ margin: 0, color: "var(--text-muted)" }}>No notifications</p> : notifications.map((notification) => (
                  <div key={notification.id} style={{ marginBottom: "0.75rem", opacity: notification.readAt ? 0.65 : 1 }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{notification.title}</p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>{notification.body}</p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className="btn btn-ghost"
                  onClick={() => onConversationSelect(conversation)}
                  style={{
                    justifyContent: "space-between",
                    border: conversation.id === activeConversationId ? "1px solid var(--accent)" : "1px solid var(--border)",
                  }}
                >
                  <span style={{ textAlign: "left", display: "flex", alignItems: "center", gap: "0.55rem" }}>
                    <span
                      style={{
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "999px",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        background: "linear-gradient(135deg, #f97316, #ec4899)",
                        color: "white",
                        flex: "0 0 auto",
                      }}
                    >
                      {getInitials(conversation.finderName)}
                    </span>
                    <span>
                      <strong>{conversation.item?.name || "Item"}</strong>
                      <br />
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{conversation.finderName}</span>
                    </span>
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span style={{ background: "var(--accent)", color: "white", padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem" }}>
                      {conversation.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="page-card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 3rem)" }}>
          <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "2.1rem",
                  height: "2.1rem",
                  borderRadius: "999px",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                  color: "white",
                }}
              >
                {isOwner ? getInitials(activeConversation?.finderName || "Finder") : "OW"}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{isOwner ? "Finder Conversation" : "Chat with Owner"}</h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>{peerTyping ? "...typing" : "Online"}</p>
              </div>
            </div>
          </div>

          <div ref={messagesContainerRef} style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: "0.6rem", paddingRight: "0.25rem" }}>
            {messages.map((message) => {
              const mine = (isOwner && message.senderType === "owner") || (!isOwner && message.senderType === "finder");
              return (
                <div key={message.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "0.45rem" }}>
                    {!mine && (
                      <div
                        style={{
                          width: "1.7rem",
                          height: "1.7rem",
                          borderRadius: "999px",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 700,
                          fontSize: "0.62rem",
                          background: "linear-gradient(135deg, #22c55e, #06b6d4)",
                          color: "white",
                          flex: "0 0 auto",
                        }}
                      >
                        {isOwner ? getInitials(activeConversation?.finderName || "Finder") : "OW"}
                      </div>
                    )}
                    <div
                      style={{
                        background: mine ? "var(--accent)" : "var(--surface-muted)",
                        color: mine ? "white" : "inherit",
                        padding: "0.45rem 0.7rem",
                        borderRadius: "12px",
                        width: "fit-content",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      <span>{message.content}</span>
                    </div>
                  </div>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.72rem", color: "var(--text-muted)", textAlign: mine ? "right" : "left" }}>
                    {formatTimestamp(message.createdAt)}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
            <input
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Write a message"
              className="form-input"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={sendMessage}><Send size={16} /></button>
          </div>

          <p style={{ margin: "0.75rem 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Signed in as: {isOwner ? authUser?.name : "Finder"}
          </p>
        </div>
      </div>
    </div>
  );
}
