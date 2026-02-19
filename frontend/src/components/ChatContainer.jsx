import React, { useState, useEffect, useContext } from "react";
import assets from "../assets/assets";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";

const ChatContainer = ({ selectedUser }) => {
  const { authUser, socket, onlineUsers } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // ==============================
  // FETCH MESSAGES WHEN USER SELECTED
  // ==============================
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/messages/${selectedUser._id}`);
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
  // SOCKET REALTIME MESSAGE LISTENER
  // ==============================
  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("newMessage");
  }, [socket]);

  // ==============================
  // SEND MESSAGE
  // ==============================
  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      const { data } = await api.post("/messages/send", {
        receiverId: selectedUser._id,
        text: input,
      });

      if (data.success) {
        setMessages((prev) => [...prev, data.newMessage]);
        setInput("");
      }
    } catch (err) {
      console.log("Message send failed");
    }
  };

  // ==============================
  // NO USER SELECTED UI
  // ==============================
  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-lg h-full">
        Select a user to start chatting
      </div>
    );
  }

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="flex flex-col h-full bg-[#1e1b2e]">

      {/* HEADER */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-[#282142]">
        <img
          src={selectedUser?.profilePicture || assets.avatar_icon}
          alt={selectedUser?.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="text-white font-medium">{selectedUser?.fullName}</p>
          <p className="text-xs text-gray-400">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === authUser?._id;

          return (
            <div
              key={msg._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl text-sm
                ${
                  isMe
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-700 text-white rounded-bl-none"
                }`}
              >
                {msg.text && <p>{msg.text}</p>}
                {msg.image && (
                  <img
                    src={msg.image}
                    alt=""
                    className="mt-2 rounded-lg max-w-full"
                  />
                )}

                <span className="text-[10px] opacity-70 block text-right mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MESSAGE INPUT */}
      <div className="p-3 border-t border-gray-700 bg-[#282142] flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-[#1e1b2e] text-white px-4 py-2 rounded-full outline-none border border-gray-600 focus:border-blue-500"
        />

        <button
          onClick={handleSend}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatContainer;
