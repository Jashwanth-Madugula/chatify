import React, { useContext } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../context/AuthContext";

const RightSidebar = ({ selectedUser }) => {
  const { onlineUsers } = useContext(AuthContext);

  if (!selectedUser) {
    return (
      <aside className="border-l border-gray-600/50 p-4 flex items-center justify-center text-gray-400">
        Select a user to view profile
      </aside>
    );
  }

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <aside className="border-l border-gray-600/50 p-6 w-72 bg-[#1e1b2e] text-white">
      
      {/* Profile Image */}
      <div className="flex flex-col items-center">
        <img
          src={selectedUser.profilePicture || assets.avatar_icon}
          alt={selectedUser.fullName}
          className="w-24 h-24 rounded-full object-cover border border-gray-600"
        />

        <h2 className="mt-3 text-lg font-semibold">
          {selectedUser.fullName}
        </h2>

        <p className="text-sm text-gray-400">
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>

      {/* Bio Section */}
      <div className="mt-6">
        <h3 className="text-sm text-gray-400 mb-1">Bio</h3>
        <p className="bg-[#282142] p-3 rounded-lg text-sm">
          {selectedUser.bio || "No bio available"}
        </p>
      </div>
    </aside>
  );
};

export default RightSidebar;
