import React, { useEffect, useState, useContext } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import { formatLastSeen } from "../lib/utils";
import toast from "react-hot-toast";

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const navigate = useNavigate();
  const { logout, onlineUsers, socket, authUser } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [unseenCounts, setUnseenCounts] = useState({});

  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "groups"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // =============================
  // FETCH INITIAL DATA
  // =============================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData } = await api.get("/messages/users");
        if (userData.success) {
          setUsers(userData.users);
          setUnseenCounts(userData.unseenMessages || {});
        }

        const { data: groupData } = await api.get("/groups");
        if (groupData.success) {
          setGroups(groupData.groups);
        }
      } catch (err) {
        console.log("Error fetching initial sidebar data");
      }
    };

    fetchData();
  }, []);

  // =============================
  // CLEAR UNSEEN COUNT ON SELECT
  // =============================
  useEffect(() => {
    if (selectedUser && !selectedUser.isGroup) {
      setUnseenCounts((prev) => {
        const next = { ...prev };
        delete next[selectedUser._id];
        return next;
      });
    }
  }, [selectedUser]);

  // =============================
  // SOCKET LISTENERS
  // =============================
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const AI_USER_ID = "666666666666666666666666";
      if (!msg.senderId) return;

      const isGroupMsg = groups.some((g) => g._id === msg.receiverId);

      if (isGroupMsg) {
        // Update group lastMessage in state
        setGroups((prevGroups) =>
          prevGroups.map((g) => {
            if (g._id === msg.receiverId) {
              return {
                ...g,
                lastMessage: {
                  text: msg.text,
                  image: msg.image,
                  createdAt: msg.createdAt,
                  senderName: msg.senderId?.fullName || "Member",
                },
              };
            }
            return g;
          })
        );
      } else {
        // It's a DM
        const contactId = msg.senderId === authUser?._id ? msg.receiverId : msg.senderId;
        const actualContactId = msg.senderId === AI_USER_ID && msg.associatedUserId 
          ? msg.associatedUserId 
          : contactId;

        // Update user lastMessage in state
        setUsers((prevUsers) =>
          prevUsers.map((u) => {
            if (u._id === actualContactId) {
              return {
                ...u,
                lastMessage: {
                  text: msg.text,
                  image: msg.image,
                  createdAt: msg.createdAt,
                  senderId: msg.senderId,
                },
              };
            }
            return u;
          })
        );

        // Increment unseen count if we received this message and aren't active in that chat
        if (msg.receiverId === authUser?._id) {
          if (!selectedUser || selectedUser._id !== actualContactId) {
            setUnseenCounts((prev) => ({
              ...prev,
              [actualContactId]: (prev[actualContactId] || 0) + 1,
            }));
          }
        }
      }
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, lastSeen } : u))
      );
    };

    const handleGroupCreated = (group) => {
      setGroups((prev) => {
        if (prev.some((g) => g._id === group._id)) return prev;
        return [...prev, group];
      });
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("userOffline", handleUserOffline);
    socket.on("groupCreated", handleGroupCreated);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userOffline", handleUserOffline);
      socket.off("groupCreated", handleGroupCreated);
    };
  }, [socket, selectedUser, groups, authUser]);

  // =============================
  // SEARCH FILTER
  // =============================
  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  // =============================
  // CREATE GROUP ACTION
  // =============================
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    try {
      const { data } = await api.post("/groups/create", {
        name: newGroupName,
        members: selectedMembers,
      });

      if (data.success) {
        setGroups((prev) => [...prev, data.group]);
        setSelectedUser({ ...data.group, isGroup: true });
        setNewGroupName("");
        setSelectedMembers([]);
        setIsModalOpen(false);
        toast.success("Group created successfully!");
      }
    } catch (err) {
      toast.error("Failed to create group");
    }
  };

  return (
    <div
      className={`bg-sidebar-bg border-r border-border-main/40 h-full p-5 rounded-r-xl flex flex-col ${
        selectedUser ? "md:block" : "block"
      }`}
    >
      {/* HEADER */}
      <div className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <img src={assets.logo} alt="logo" className="h-6 w-6 object-contain rounded" />
            <span className="text-md font-extrabold bg-gradient-to-r from-blue-500 to-[#ff5d5d] bg-clip-text text-transparent tracking-wide">
              TripleS Chat
            </span>
          </div>

          {/* MENU */}
          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="menu"
              className="max-h-5 cursor-pointer dark:invert"
            />

            <div
              className="absolute top-full right-0 z-20 w-32 p-4 rounded-xl 
              bg-panel-bg border border-border-main text-text-main hidden group-hover:block animate-fade-in shadow-xl"
            >
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm hover:text-blue-400 transition"
              >
                Edit Profile
              </p>

              <hr className="my-2 border-t border-border-main" />

              <p
                onClick={logout}
                className="cursor-pointer text-sm text-red-400 hover:text-red-300 transition"
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder={activeTab === "chats" ? "Search user..." : "Search group..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-input-bg text-sm text-text-main 
            placeholder-text-main/50 rounded-full py-2 pl-10 pr-4 
            outline-none border border-border-main/40 focus:border-blue-500 transition"
          />

          <img
            src={assets.search_icon}
            alt="search"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 opacity-70"
          />
        </div>

        {/* TABS */}
        <div className="flex gap-2 mt-4 border-b border-gray-600/30 pb-2.5">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-1.5 text-xs rounded-full cursor-pointer transition-all duration-200 ${
              activeTab === "chats"
                ? "bg-blue-500 text-white font-medium shadow-sm"
                : "bg-white/5 hover:bg-white/10 text-gray-400"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 py-1.5 text-xs rounded-full cursor-pointer transition-all duration-200 ${
              activeTab === "groups"
                ? "bg-blue-500 text-white font-medium shadow-sm"
                : "bg-white/5 hover:bg-white/10 text-gray-400"
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* DYNAMIC LIST */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {activeTab === "chats" ? (
          // ================= CHATS LIST =================
          filteredUsers.map((user) => {
            const isOnline = onlineUsers.includes(user._id);
            const isSelected = selectedUser?._id === user._id && !selectedUser.isGroup;

            return (
              <div
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition duration-150
                ${isSelected ? "bg-blue-500/10 dark:bg-blue-500/20 shadow-sm border border-blue-500/20" : "hover:bg-input-bg/30"}`}
              >
                <div className="relative">
                  <img
                    src={user.profilePicture || assets.avatar_icon}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-600/30"
                  />

                  {/* ONLINE DOT */}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-sidebar-bg"></span>
                  )}
                </div>

                <div className="flex-1 flex flex-col leading-5 text-text-main overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <p className="font-medium truncate">{user.fullName}</p>
                    {user.lastMessage && (
                      <span className="text-[10px] text-gray-500 flex-shrink-0 ml-1">
                        {new Date(user.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  {user.lastMessage ? (
                    <span className="text-xs text-text-main/60 truncate pr-4">
                      {user.lastMessage.text || "📷 Photo"}
                    </span>
                  ) : (
                    <span className="text-xs text-text-main/60 truncate pr-4">
                      {isOnline ? "Online" : formatLastSeen(user.lastSeen)}
                    </span>
                  )}
                </div>

                {unseenCounts[user._id] > 0 && (
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {unseenCounts[user._id]}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // ================= GROUPS LIST =================
          <div className="space-y-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              + Create Group
            </button>

            {filteredGroups.map((group) => {
              const isSelected = selectedUser?._id === group._id && selectedUser.isGroup;
              return (
                <div
                  key={group._id}
                  onClick={() => setSelectedUser({ ...group, isGroup: true })}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition duration-150 ${
                    isSelected ? "bg-blue-500/10 dark:bg-blue-500/20 shadow-sm border border-blue-500/20" : "hover:bg-input-bg/30"
                  }`}
                >
                  {group.avatar ? (
                    <img
                      src={group.avatar}
                      alt={group.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-600/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center border border-blue-500/40">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 flex flex-col leading-5 text-text-main overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium truncate">{group.name}</p>
                      {group.lastMessage && (
                        <span className="text-[10px] text-gray-500 flex-shrink-0 ml-1">
                          {new Date(group.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    {group.lastMessage ? (
                      <span className="text-xs text-text-main/60 truncate pr-4">
                        <span className="text-blue-400 font-semibold">{group.lastMessage.senderName}:</span> {group.lastMessage.text || "📷 Photo"}
                      </span>
                    ) : (
                      <span className="text-xs text-text-main/60">
                        {group.members.length} members
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-panel-bg border border-border-main rounded-2xl p-6 w-[360px] text-text-main shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-center">Create New Group</h3>
            <input
              type="text"
              placeholder="Group Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full bg-input-bg p-2.5 rounded-xl border border-border-main/50 outline-none focus:border-blue-500 text-sm mb-4 text-text-main"
            />

            <p className="text-xs text-text-main/60 mb-2">Select Members</p>
            <div className="max-h-40 overflow-y-auto space-y-2 mb-5 pr-1 border border-border-main/50 p-2 rounded-xl bg-input-bg/30">
              {users.map((user) => (
                <label key={user._id} className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-input-bg/40 p-1.5 rounded-lg transition text-text-main">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(user._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers((prev) => [...prev, user._id]);
                      } else {
                        setSelectedMembers((prev) => prev.filter((id) => id !== user._id));
                      }
                    }}
                    className="rounded border-border-main bg-input-bg text-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span>{user.fullName}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewGroupName("");
                  setSelectedMembers([]);
                }}
                className="px-4 py-2 bg-input-bg hover:bg-input-bg/85 text-xs rounded-full transition cursor-pointer text-text-main"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-xs text-white rounded-full font-semibold transition cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
