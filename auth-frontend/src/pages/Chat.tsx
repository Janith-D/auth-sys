import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { useSocket } from "../context/SocketContext";
import { useScreenShare } from "../hooks/useScreenShare";
import axiosInstance from "../api/axiosInstance";
import type { User, Message, Conversation } from "../types/chat";

const Chat = () => {
  const navigate = useNavigate();
  const { user: me } = useAppSelector((state) => state.auth);
  const { socket, isConnected, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const { isSharing, remoteStream, frame, localStream, sharerId, sharerName, transport, startSharing, stopSharing } = useScreenShare(
    socket,
    me?.id || "",
    me?.name || "",
    selectedUser?.id || null
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axiosInstance.get("/chat/conversations");
        setConversations(res.data.data);
      } catch (err) {
        console.error("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
      if (selectedUser && (message.sender._id === selectedUser.id || message.receiver._id === selectedUser.id)) {
        // already appending
      }
      setConversations((prev) => {
        const otherUser = message.sender._id === me?.id ? message.receiver : message.sender;
        const existing = prev.find((c) => c.user.id === otherUser._id);
        if (existing) {
          return prev.map((c) =>
            c.user.id === otherUser._id
              ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt }
              : c
          );
        }
        return [{ user: otherUser, lastMessage: message.content, lastMessageAt: message.createdAt }, ...prev];
      });
    };

    const handleTyping = (data: { userId: string }) => {
      if (data.userId === selectedUser?.id) setTyping(true);
    };

    const handleStopTyping = (data: { userId: string }) => {
      if (data.userId === selectedUser?.id) setTyping(false);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stop-typing", handleStopTyping);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
    };
  }, [socket, selectedUser, me]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const selectUser = async (user: User) => {
    setSelectedUser(user);
    setShowNewChat(false);
    try {
      const res = await axiosInstance.get(`/chat/messages/${user.id}`);
      setMessages(res.data.data);
    } catch {
      setMessages([]);
    }
  };

  const sendMessage = () => {
    if (!content.trim() || !selectedUser || !socket) return;
    socket.emit("message:send", { receiverId: selectedUser.id, content });
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTypingEmit = () => {
    if (selectedUser && socket) {
      socket.emit("typing", { receiverId: selectedUser.id });
    }
  };

  const handleStopTypingEmit = () => {
    if (selectedUser && socket) {
      socket.emit("stop-typing", { receiverId: selectedUser.id });
    }
  };

  const startNewChat = async () => {
    try {
      const res = await axiosInstance.get("/chat/users");
      setAllUsers(res.data.data);
      setShowNewChat(true);
      setSelectedUser(null);
      setMessages([]);
    } catch {
      console.error("Failed to load users");
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h3>Messages</h3>
            <div className="chat-sidebar-actions">
              <button className="btn btn-primary chat-new-btn" onClick={startNewChat}>
                + New Chat
              </button>
              <button className="chat-close-btn-primary" onClick={() => navigate("/dashboard")} title="Close chat">
                ✕
              </button>
            </div>
          </div>

          {showNewChat && (
            <div className="chat-user-list">
              <div className="chat-user-list-header">
                <span>Select a user to chat</span>
                <button className="btn-close" onClick={() => setShowNewChat(false)}>x</button>
              </div>
              {allUsers.map((u) => (
                <div key={u.id || u._id} className="chat-user-item" onClick={() => selectUser(u)}>
                  <div className="chat-user-avatar">{u.name[0]}</div>
                  <div className="chat-user-info">
                    <span className="chat-user-name">{u.name}</span>
                    <span className="chat-user-role">{u.role}</span>
                  </div>
                  {onlineUsers.includes(u.id) && <span className="online-dot" />}
                </div>
              ))}
            </div>
          )}

          <div className="chat-conversations">
            {loading ? (
              <div className="chat-loading">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="chat-empty">No conversations yet</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.user.id}
                  className={`chat-conv-item ${selectedUser?.id === conv.user.id ? "active" : ""}`}
                  onClick={() => selectUser(conv.user)}
                >
                  <div className="chat-user-avatar">{conv.user.name[0]}</div>
                  <div className="chat-conv-info">
                    <span className="chat-user-name">{conv.user.name}</span>
                    <span className="chat-conv-preview">{conv.lastMessage || "No messages"}</span>
                  </div>
                  {onlineUsers.includes(conv.user.id) && <span className="online-dot" />}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chat-main">

          {(remoteStream || frame || isSharing) && (
            <div className="screen-share-container">
              <div className="screen-share-header">
                <span>
                  {remoteStream
                    ? `${sharerName || (selectedUser?.name || "Someone")} is sharing`
                    : frame
                    ? `${sharerName || (selectedUser?.name || "Someone")} is sharing`
                    : "You are sharing screen"}
                </span>
                <span style={{ fontSize: 11, opacity: 0.5 }}>
                  {transport === "webrtc" ? "⚡ WebRTC" : transport === "socketio" ? "📡 Socket.IO" : ""}
                </span>
                {(!remoteStream && !frame && isSharing) ? (
                  <button className="btn btn-sm btn-danger" onClick={stopSharing}>Stop</button>
                ) : null}
              </div>
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay playsInline
                  className="screen-share-video"
                />
              ) : frame ? (
                <img src={frame} alt="Screen share" className="screen-share-video" />
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay playsInline muted
                  className="screen-share-video"
                />
              )}
            </div>
          )}

          {!selectedUser ? (
            <div className="chat-placeholder">
              <div className="chat-placeholder-icon">💬</div>
              <h2>Select a conversation</h2>
              <p>Choose a user from the sidebar or start a new chat</p>
              {!isConnected && (
                <p style={{ color: "#fca5a5", marginTop: 12 }}>
                  Connecting to chat server...
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-user-avatar large">{selectedUser.name[0]}</div>
                  <div>
                    <span className="chat-user-name">{selectedUser.name}</span>
                    <span className="chat-user-role">{selectedUser.role}</span>
                  </div>
                </div>
                <div className="chat-header-actions">
                  <span className={`status-badge ${onlineUsers.includes(selectedUser.id) ? "online" : "offline"}`}>
                    {onlineUsers.includes(selectedUser.id) ? "Online" : "Offline"}
                  </span>
                  <button
                    className={`btn btn-sm ${isSharing ? "btn-danger" : "btn-primary"}`}
                    onClick={isSharing ? stopSharing : startSharing}
                    disabled={!onlineUsers.includes(selectedUser.id)}
                    title={!onlineUsers.includes(selectedUser.id) ? "User must be online" : isSharing ? "Stop sharing" : "Share your screen"}
                  >
                    {isSharing ? "Stop Share" : "Share Screen"}
                  </button>
                </div>
              </div>

              <div className="chat-messages">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`chat-msg ${msg.sender._id === me?.id ? "sent" : "received"}`}
                  >
                    <div className="chat-msg-content">{msg.content}</div>
                    <div className="chat-msg-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
                {typing && <div className="chat-typing">Typing...</div>}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-area">
                <input
                  type="text"
                  className="chat-input"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleTypingEmit}
                  onBlur={handleStopTypingEmit}
                  placeholder="Type a message..."
                />
                <button className="btn btn-primary chat-send-btn" onClick={sendMessage} disabled={!content.trim()}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
