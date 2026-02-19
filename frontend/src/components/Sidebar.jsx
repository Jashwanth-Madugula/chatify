import React, { useEffect, useState, useContext } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const navigate = useNavigate();
  const { logout, onlineUsers } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  // =============================
  // FETCH USERS FROM BACKEND
  // =============================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/messages/users");
        if (data.success) {
          setUsers(data.users);
        }
      } catch (err) {
        console.log("Error fetching users");
      }
    };

    fetchUsers();
  }, []);

  // =============================
  // SEARCH FILTER
  // =============================
  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll
      ${selectedUser ? "md:block" : "hidden md:block"}`}
    >
      {/* HEADER */}
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img src={assets.logo} alt="logo" className="max-w-40" />

          {/* MENU */}
          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="menu"
              className="max-h-5 cursor-pointer"
            />

            <div
              className="absolute top-full right-0 z-20 w-32 p-5 rounded-md 
              bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block"
            >
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm"
              >
                Edit Profile
              </p>

              <hr className="my-2 border-t border-gray-500" />

              <p
                onClick={logout}
                className="cursor-pointer text-sm text-red-400"
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mt-5 relative">
          <input
            type="text"
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#282142]/60 text-sm text-white 
            placeholder-gray-400 rounded-full py-2 pl-10 pr-4 
            outline-none border border-gray-600 focus:border-blue-500"
          />

          <img
            src={assets.search_icon}
            alt="search"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 opacity-70"
          />
        </div>
      </div>

      {/* USERS LIST */}
      <div>
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);

          return (
            <div
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`relative flex items-center gap-2 p-2 rounded cursor-pointer
              ${selectedUser?._id === user._id
                ? "bg-[#282142]/60"
                : "hover:bg-[#282142]/30"}`}
            >
              <div className="relative">
                <img
                  src={user.profilePicture || assets.avatar_icon}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />

                {/* ONLINE DOT */}
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black"></span>
                )}
              </div>

              <div className="flex flex-col leading-5 text-white">
                <p>{user.fullName}</p>
                <span className="text-xs text-gray-400">
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
