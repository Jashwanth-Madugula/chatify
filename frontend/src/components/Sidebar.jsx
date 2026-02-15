import React from 'react'
import assets,{userDummyData} from '../assets/assets'
import { useNavigate } from "react-router-dom"

const Sidebar = ({ selectedUser, setSelectedUser }) => {

  const navigate = useNavigate()

  return (
    <div
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll
      ${selectedUser ? 'md:block' : 'hidden md:block'}`}
    >
      <div className="pb-5">
        <div className='flex justify-between items-center'>
          <img src={assets.logo} alt="logo" className='max-w-40' />

          <div className='relative py-2 group'>
            <img
              src={assets.menu_icon}
              alt="menu"
              className='max-h-5 cursor-pointer'
            />

            <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142]
              border border-gray-600 text-gray-100 hidden group-hover:block'
            >
              <p
                onClick={() => navigate('/profile')}
                className='cursor-pointer text-sm'
              >
                Edit Profile
              </p>

              <hr className='my-2 border-t border-gray-500' />

              <p className='cursor-pointer text-sm'>
                Logout
              </p>
            </div>
          </div>
        </div>

        <div className='mt-5 relative'>
          <input
            type="text"
            placeholder="Search user..."
            className='w-full bg-[#282142]/60 text-sm text-white 
            placeholder-gray-400 rounded-full py-2 pl-10 pr-4 
            outline-none border border-gray-600 focus:border-blue-500'
          />

          <img
            src={assets.search_icon}
            alt="search"
            className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 opacity-70'
          />
        </div>
      </div>

      <div>
        {userDummyData.map((user, index) => (
          <div onClick={()=>setSelectedUser(user)} key={index} 
          className={`relative flex items-center gap-2 p-2 rounded cursor-pointer max-sm:text-sm ${selectedUser?.id === user.id ? 'bg-[#282142]/60' : 'hover:bg-[#282142]/30'}`}>
            <img src={user?.profilepic || assets.avatar_icon} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            <div className='flex flex-col leading-5 text-white'>
              <p>{user.fullName}</p>
            </div>
          </div>
          

        ))}
      </div>

    </div>
  )
}

export default Sidebar
