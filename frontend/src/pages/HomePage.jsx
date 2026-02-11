import React from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { useState } from 'react'
import bgImage from "../assets/bgImage.svg"


const HomePage = () => {

    const [selectedUser, setSelectedUser] = useState(false)

  return (
    <div className="border w-full h-screen sm:px-[8%] sm:py-[8%]">
      <div className={`backdrop-blur-xl bg-black/40 border border-gray-600/50 rounded-2xl
       overflow-hidden h-[100%] grid grid-cols-1 relative ${selectedUser ? 'md:grid-cols-[1fr_1.5fr_1fr]' : 'xl:grid-cols-[1fr_2fr_1fr] : md:grid-cols-2'}`}>
        <Sidebar />
        <ChatContainer />
        <RightSidebar />
      </div>
    </div>
  )
}

export default HomePage
