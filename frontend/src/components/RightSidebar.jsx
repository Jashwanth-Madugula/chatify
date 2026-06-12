import React, { useContext, useState, useEffect } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../context/AuthContext";
import { formatLastSeen } from "../lib/utils";

const RightSidebar = ({ selectedUser }) => {
  const { onlineUsers, socket } = useContext(AuthContext);
  const [lastSeenOverride, setLastSeenOverride] = useState(null);

  useEffect(() => {
    setLastSeenOverride(null);
  }, [selectedUser]);

  useEffect(() => {
    if (!socket) return;

    const handleUserOffline = ({ userId, lastSeen }) => {
      if (selectedUser && selectedUser._id === userId) {
        setLastSeenOverride(lastSeen);
      }
    };

    socket.on("userOffline", handleUserOffline);
    return () => {
      socket.off("userOffline", handleUserOffline);
    };
  }, [socket, selectedUser]);

  if (!selectedUser) {
    return (
      <aside className="border-l border-gray-600/50 p-4 flex items-center justify-center text-gray-400">
        Select a user to view profile
      </aside>
    );
  }

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <aside className="border-l border-border-main p-6 w-72 bg-chat-bg text-text-main flex flex-col items-center h-full overflow-y-auto">
      
      {/* Profile Image */}
      <div className="flex flex-col items-center w-full">
        {selectedUser.isGroup && !selectedUser.avatar ? (
          <div className="w-24 h-24 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30 text-3xl shadow">
            {selectedUser.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <img
            src={selectedUser.profilePicture || selectedUser.avatar || assets.avatar_icon}
            alt={selectedUser.fullName || selectedUser.name}
            className="w-24 h-24 rounded-full object-cover border border-border-main shadow"
          />
        )}

        <h2 className="mt-3 text-lg font-semibold text-center leading-tight">
          {selectedUser.fullName || selectedUser.name}
        </h2>

        <p className="text-sm text-text-main/60 text-center mt-1">
          {selectedUser.isGroup ? (
            <span>Group Chat</span>
          ) : isOnline ? (
            "Online"
          ) : (
            formatLastSeen(lastSeenOverride || selectedUser?.lastSeen)
          )}
        </p>
      </div>

      {/* Bio Section */}
      <div className="mt-6 w-full">
        <h3 className="text-sm text-text-main/55 mb-1.5 font-medium">
          {selectedUser.isGroup ? "Description" : "Bio"}
        </h3>
        <p className="bg-input-bg p-3.5 rounded-xl text-sm text-text-main/90 border border-border-main/40">
          {selectedUser.bio || selectedUser.description || (selectedUser.isGroup ? "No description available" : "No bio available")}
        </p>
      </div>
    </aside>
  );
};

export default RightSidebar;
