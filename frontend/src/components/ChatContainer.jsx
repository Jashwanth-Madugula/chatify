import React, { useState } from "react"
import assets from "../assets/assets"

const ChatContainer = ({ selectedUser }) => {

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "me",
      text: "Hey 👋",
      time: "10:30 AM"
    },
    {
      id: 2,
      sender: "other",
      text: "Hello! How are you?",
      time: "10:31 AM"
    }
  ])

  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    setMessages([...messages, newMessage])
    setInput("")
  }

  // If no user selected
  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-lg">
        Select a user to start chatting
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1b2e]">

      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-[#282142]">
        <img
          src={selectedUser?.profilepic || assets.avatar_icon}
          alt={selectedUser?.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="text-white font-medium">{selectedUser?.fullName}</p>
          <p className="text-xs text-gray-400">
            {selectedUser?.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl text-sm
              ${msg.sender === "me"
                ? "bg-blue-500 text-white rounded-br-none"
                : "bg-gray-700 text-white rounded-bl-none"
              }`}
            >
              <p>{msg.text}</p>
              <span className="text-[10px] opacity-70 block text-right mt-1">
                {msg.time}
              </span>
            </div>
          </div>
        ))}

      </div>

      {/* Input */}
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
  )
}

export default ChatContainer