import React, { useState, useEffect, useContext, useRef } from "react";
import assets from "../assets/assets";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { formatLastSeen } from "../lib/utils";

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
  "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
  "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾",
  "🤖", "🎃", "👋", "👍", "👎", "👏", "🙌", "🙏", "❤️", "🔥", "✨", "⭐", "🎉", "💡", "💯"
];

const ChatContainer = ({ selectedUser }) => {
  const { authUser, socket, onlineUsers } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState("");
  const [lastSeenOverride, setLastSeenOverride] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Search & Filter
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Emoji Picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Message Actions
  const [editingMessage, setEditingMessage] = useState(null);
  const [editInput, setEditInput] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastSelectedUserIdRef = useRef(null);

  // ==============================
  // SCROLL TO BOTTOM
  // ==============================
  useEffect(() => {
    if (!selectedUser) return;
    const isNewChat = lastSelectedUserIdRef.current !== selectedUser._id;

    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isNewChat ? "auto" : "smooth"
      });
    }

    lastSelectedUserIdRef.current = selectedUser._id;
  }, [messages, selectedUser]);

  // ==============================
  // RESET ON USER CHANGE
  // ==============================
  useEffect(() => {
    setIsTyping(false);
    setIsRecipientTyping(false);
    setTypingUserName("");
    setLastSeenOverride(null);
    setSearchOpen(false);
    setSearchQuery("");
    setShowEmojiPicker(false);
    setEditingMessage(null);
    setReplyingTo(null);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [selectedUser]);

  // ==============================
  // SYNC OFFLINE STATUS
  // ==============================
  useEffect(() => {
    if (!socket) return;

    const handleUserOffline = ({ userId, lastSeen }) => {
      if (selectedUser && !selectedUser.isGroup && selectedUser._id === userId) {
        setLastSeenOverride(lastSeen);
      }
    };

    socket.on("userOffline", handleUserOffline);
    return () => socket.off("userOffline", handleUserOffline);
  }, [socket, selectedUser]);

  // ==============================
  // FETCH MESSAGES
  // ==============================
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const endpoint = selectedUser.isGroup
          ? `/groups/${selectedUser._id}/messages`
          : `/messages/${selectedUser._id}`;
        const { data } = await api.get(endpoint);
        if (data.success) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.log("Error fetching messages");
      }
    };

    fetchMessages();
  }, [selectedUser]);

  // ==============================
  // SOCKET MESSAGE & ACTIONS LISTENERS
  // ==============================
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (selectedUser) {
        const AI_USER_ID = "666666666666666666666666";
        if (selectedUser.isGroup) {
          if (msg.receiverId === selectedUser._id) {
            setMessages((prev) => {
              if (prev.some((m) => m._id === msg._id)) return prev;
              return [...prev, msg];
            });
          }
        } else {
          // Check if message belongs to this DM thread
          const isNormalDm = msg.senderId === selectedUser._id || msg.receiverId === selectedUser._id;
          const isAiDm = msg.senderId === AI_USER_ID && 
            ((msg.receiverId === selectedUser._id && msg.associatedUserId === authUser?._id) ||
             (msg.receiverId === authUser?._id && msg.associatedUserId === selectedUser._id) ||
             (selectedUser._id === AI_USER_ID && msg.receiverId === authUser?._id));

          if (isNormalDm || isAiDm) {
            setMessages((prev) => {
              if (prev.some((m) => m._id === msg._id)) return prev;
              return [...prev, msg];
            });
            if (msg.senderId === selectedUser._id && msg.senderId !== AI_USER_ID) {
              api.put(`/messages/mark/${msg._id}`);
            }
          }
        }
      }
    };

    const handleMessagesSeen = ({ senderId, receiverId }) => {
      if (selectedUser && !selectedUser.isGroup && selectedUser._id === receiverId) {
        setMessages((prev) =>
          prev.map((msg) => (msg.seen ? msg : { ...msg, seen: true }))
        );
      }
    };

    const handleUserTyping = ({ senderId, groupId }) => {
      if (selectedUser) {
        if (selectedUser.isGroup && selectedUser._id === groupId) {
          // Find member name
          const member = selectedUser.members?.find((m) => m._id === senderId);
          setTypingUserName(member ? member.fullName : "Someone");
          setIsRecipientTyping(true);
        } else if (!selectedUser.isGroup && selectedUser._id === senderId) {
          setTypingUserName("");
          setIsRecipientTyping(true);
        }
      }
    };

    const handleUserStopTyping = ({ senderId, groupId }) => {
      if (selectedUser) {
        if (selectedUser.isGroup && selectedUser._id === groupId) {
          setIsRecipientTyping(false);
        } else if (!selectedUser.isGroup && selectedUser._id === senderId) {
          setIsRecipientTyping(false);
        }
      }
    };

    const handleMessageEdited = (editedMsg) => {
      if (selectedUser && (editedMsg.receiverId === selectedUser._id || editedMsg.senderId === selectedUser._id)) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === editedMsg._id ? editedMsg : msg))
        );
      }
    };

    const handleMessageDeleted = (deletedMsg) => {
      if (selectedUser && (deletedMsg.receiverId === selectedUser._id || deletedMsg.senderId === selectedUser._id)) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === deletedMsg._id ? deletedMsg : msg))
        );
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [socket, selectedUser]);

  // ==============================
  // INPUT TYPING BROADCASTER
  // ==============================
  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (!socket || !selectedUser) return;

    const memberIds = selectedUser.isGroup
      ? selectedUser.members.map((m) => (typeof m === "object" ? m._id : m))
      : [];

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
        isGroup: selectedUser.isGroup,
        memberIds,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
        isGroup: selectedUser.isGroup,
        memberIds,
      });
      setIsTyping(false);
    }, 1500);
  };

  // ==============================
  // HANDLERS (SEND/EDIT/DELETE)
  // ==============================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
  };

  const handleSend = async () => {
    if (!input.trim() && !imagePreview) return;
    if (isSending) return;

    setIsSending(true);
    try {
      const endpoint = selectedUser.isGroup
        ? `/groups/${selectedUser._id}/send`
        : `/messages/send`;

      const payload = selectedUser.isGroup
        ? { text: input, image: imagePreview, replyTo: replyingTo?._id }
        : { receiverId: selectedUser._id, text: input, image: imagePreview, replyTo: replyingTo?._id };

      // Clear input fields immediately to prevent double submits and give instant feedback
      setInput("");
      setImagePreview(null);
      setReplyingTo(null);
      setShowEmojiPicker(false);

      const { data } = await api.post(endpoint, payload);

      if (data.success) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.newMessage._id)) return prev;
          return [...prev, data.newMessage];
        });
      }
    } catch (err) {
      toast.error("Message send failed.");
    } finally {
      setIsSending(false);
    }
  };

  const handleEdit = async (msgId) => {
    if (!editInput.trim()) return;
    try {
      const { data } = await api.put(`/messages/edit/${msgId}`, { text: editInput });
      if (data.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === msgId ? data.message : msg))
        );
        setEditingMessage(null);
        setEditInput("");
        toast.success("Message edited.");
      }
    } catch (err) {
      toast.error("Failed to edit message.");
    }
  };

  const handleDelete = async (msgId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      const { data } = await api.delete(`/messages/delete/${msgId}`);
      if (data.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === msgId ? data.message : msg))
        );
        toast.success("Message deleted.");
      }
    } catch (err) {
      toast.error("Failed to delete message.");
    }
  };

  // ==============================
  // RENDER SECTIONS
  // ==============================
  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-main/50 text-lg bg-chat-bg h-full">
        Select a chat or group to start messaging
      </div>
    );
  }

  const isOnline = onlineUsers.includes(selectedUser._id);

  // Search filter
  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery) return true;
    return msg.text && msg.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-chat-bg overflow-hidden relative">

      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-border-main bg-header-bg">
        <div className="flex items-center gap-3">
          {selectedUser.isGroup && !selectedUser.avatar ? (
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <img
              src={selectedUser?.profilePicture || selectedUser?.avatar || assets.avatar_icon}
              alt={selectedUser?.fullName || selectedUser?.name}
              className="w-10 h-10 rounded-full object-cover border border-border-main"
            />
          )}

          <div>
            <p className="text-text-main font-semibold leading-tight">
              {selectedUser?.fullName || selectedUser?.name}
            </p>
            <p className="text-xs text-text-main/60">
              {selectedUser.isGroup ? (
                <span>Group • {selectedUser.members?.length || 0} members</span>
              ) : isRecipientTyping ? (
                <span className="text-green-500 font-semibold animate-pulse">typing...</span>
              ) : (
                isOnline ? "Online" : formatLastSeen(lastSeenOverride || selectedUser?.lastSeen)
              )}
            </p>
          </div>
        </div>

        {/* SEARCH CONTROLS */}
        <div className="flex items-center gap-3">
          {searchOpen && (
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-input-bg text-text-main text-xs px-3 py-1.5 rounded-full border border-border-main outline-none focus:border-blue-500 transition-all duration-200 w-36 sm:w-48"
            />
          )}
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              setSearchQuery("");
            }}
            className="p-2 hover:bg-input-bg rounded-full text-text-main transition cursor-pointer"
            title="Search Messages"
          >
            🔍
          </button>
        </div>
      </div>

      {/* MESSAGES VIEW */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.map((msg) => {
          const isMe = msg.senderId === authUser?._id || (typeof msg.senderId === "object" && msg.senderId._id === authUser?._id);
          const isEdited = msg.isEdited;
          const isDeleted = msg.isDeleted;

          return (
            <div
              key={msg._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"} group/msg relative`}
            >
              
              <div
                className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl text-sm relative transition shadow-sm
                ${
                  isMe
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-input-bg text-text-main rounded-bl-none"
                }`}
              >
                
                {/* SENDER NAME FOR GROUP OR AI */}
                {((selectedUser.isGroup || msg.senderId === "666666666666666666666666" || (typeof msg.senderId === "object" && msg.senderId._id === "666666666666666666666666")) && !isMe && msg.senderId) && (
                  <span className="text-[10px] text-blue-400 font-bold block mb-1">
                    {msg.senderId === "666666666666666666666666" || (typeof msg.senderId === "object" && msg.senderId._id === "666666666666666666666666")
                      ? "TripleS AI"
                      : (typeof msg.senderId === "object" ? msg.senderId.fullName : "Member")}
                  </span>
                )}

                {/* QUOTED REPLY BUBBLE */}
                {msg.replyTo && (
                  <div className={`p-2 rounded-lg text-xs mb-2 border-l-2 bg-black/15
                    ${isMe ? "border-white/50 text-white/90" : "border-blue-500/50 text-text-main/80"}`}
                  >
                    <p className="font-bold mb-0.5">
                      {msg.replyTo.senderId?.fullName || "Member"}
                    </p>
                    <p className="truncate">
                      {msg.replyTo.isDeleted ? "This message was deleted" : msg.replyTo.text || "📷 Photo"}
                    </p>
                  </div>
                )}

                {/* INLINE EDIT MODE */}
                {editingMessage?._id === msg._id ? (
                  <div className="flex flex-col gap-2 min-w-[150px] py-1">
                    <input
                      type="text"
                      value={editInput}
                      onChange={(e) => setEditInput(e.target.value)}
                      className="bg-black/20 text-white px-2 py-1 rounded border border-white/20 outline-none text-xs"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingMessage(null)}
                        className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEdit(msg._id)}
                        className="text-[10px] bg-blue-600 hover:bg-blue-700 px-2 py-0.5 rounded cursor-pointer font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {msg.text && (
                      <p className={isDeleted ? "italic text-white/50" : ""}>
                        {msg.text}
                      </p>
                    )}
                    {msg.image && !isDeleted && (
                      <img
                        src={msg.image}
                        alt=""
                        className="mt-2 rounded-lg max-w-full border border-black/10"
                      />
                    )}
                  </>
                )}

                {/* TIME & SEEN / EDIT STATUS */}
                <div className="text-[9px] opacity-75 flex items-center justify-end gap-1.5 mt-1.5">
                  {isEdited && !isDeleted && <span>(edited)</span>}
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMe && !selectedUser.isGroup && (
                    <span className={msg.seen ? "text-blue-200 font-bold" : "text-gray-300"}>
                      {msg.seen ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>

                {/* ACTION MENUS ON HOVER */}
                {!isDeleted && !editingMessage && (
                  <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover/msg:flex items-center gap-1 bg-panel-bg border border-border-main text-text-main rounded-full px-2 py-1 shadow-lg z-10
                    ${isMe ? "-left-24" : "-right-24"}`}
                  >
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="text-xs hover:scale-125 transition cursor-pointer"
                      title="Reply"
                    >
                      ↩️
                    </button>
                    {isMe && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMessage(msg);
                            setEditInput(msg.text || "");
                          }}
                          className="text-xs hover:scale-125 transition cursor-pointer"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(msg._id)}
                          className="text-xs hover:scale-125 transition cursor-pointer"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                )}

              </div>
            </div>
          );
        })}

        {/* TYPING BOUNCER BUBBLE */}
        {isRecipientTyping && (
          <div className="flex justify-start flex-col gap-1">
            {selectedUser.isGroup && (
              <span className="text-[10px] text-blue-400 font-bold ml-4">
                {typingUserName}
              </span>
            )}
            <div className="bg-input-bg text-text-main max-w-xs px-4 py-3 rounded-2xl rounded-bl-none text-sm flex items-center gap-1.5 shadow-sm border border-border-main w-fit">
              <span className="w-1.5 h-1.5 bg-text-main/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 bg-text-main/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 bg-text-main/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* FLOATING EMOJI PICKER PANEL */}
      {showEmojiPicker && (
        <div className="absolute bottom-18 left-4 z-40 bg-panel-bg border border-border-main rounded-2xl p-4 w-[280px] shadow-2xl animate-fade-in text-text-main">
          <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-border-main/50">
            <span className="text-xs text-text-main/60 font-bold">Select Emoji</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-text-main/50 hover:text-text-main text-sm cursor-pointer"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
            {EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => setInput((prev) => prev + emoji)}
                className="text-lg hover:scale-125 transition cursor-pointer p-0.5 rounded hover:bg-white/5"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* REPLY QUOTE HEADER BAR */}
      {replyingTo && (
        <div className="px-4 py-2 bg-input-bg border-t border-border-main flex items-center justify-between text-xs text-text-main">
          <div className="flex flex-col truncate">
            <span className="font-bold text-blue-400">Replying to {replyingTo.senderId?.fullName || "Member"}</span>
            <span className="truncate text-gray-400">{replyingTo.text || "📷 Photo"}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-red-400 hover:text-red-300 font-bold text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* IMAGE UPLOAD PREVIEW */}
      {imagePreview && (
        <div className="p-3 bg-header-bg border-t border-border-main flex items-center gap-3">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-border-main shadow"
            />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* INPUT PANEL */}
      <div className="p-3 border-t border-border-main bg-header-bg flex items-center gap-2 relative">
        
        {/* EMOJI BUTTON */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-input-bg rounded-full text-text-main transition cursor-pointer text-lg flex items-center justify-center"
          title="Add Emoji"
        >
          😊
        </button>

        {/* IMAGE PICKER */}
        <label htmlFor="chat-image-upload" className="cursor-pointer p-2 hover:bg-input-bg rounded-full transition flex items-center justify-center">
          <input
            type="file"
            id="chat-image-upload"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />
          <img src={assets.gallery_icon} alt="gallery" className="w-5 h-5 opacity-70 dark:invert" />
        </label>

        {/* INPUT BOX */}
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-input-bg text-text-main px-4 py-2.5 rounded-full outline-none border border-border-main focus:border-blue-500 transition"
        />

        {/* SEND BUTTON */}
        <button
          onClick={handleSend}
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow transition cursor-pointer"
        >
          Send
        </button>
      </div>

    </div>
  );
};

export default ChatContainer;
