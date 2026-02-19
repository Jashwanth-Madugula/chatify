import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";

const HomePage = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="border w-full h-screen sm:px-[6%] sm:py-[4%]">
      <div
        className={`backdrop-blur-xl bg-black/40 border border-gray-600/50 
        rounded-2xl overflow-hidden h-full grid
        ${
          selectedUser
            ? "md:grid-cols-[1fr_1.5fr_1fr]"
            : "md:grid-cols-[1fr_2fr]"
        }`}
      >
        {/* LEFT SIDEBAR */}
        <Sidebar
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />

        {/* CHAT AREA */}
        <ChatContainer selectedUser={selectedUser} />

        {/* RIGHT SIDEBAR */}
        {selectedUser && (
          <RightSidebar selectedUser={selectedUser} />
        )}
      </div>
    </div>
  );
};

export default HomePage;
