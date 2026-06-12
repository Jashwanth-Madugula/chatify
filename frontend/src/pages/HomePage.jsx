import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";

const HomePage = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="w-full h-full p-4 sm:p-6 overflow-hidden flex flex-col">
      <div
        className={`backdrop-blur-xl bg-panel-bg border border-border-main 
        rounded-2xl overflow-hidden h-full grid flex-1
        ${
          selectedUser
            ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]"
            : "md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
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
