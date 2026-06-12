import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap, aiUserId } from "../server.js";
import { getAiResponse } from "../lib/groq.js";

// ================= CREATE GROUP =================
export const createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const adminId = req.user._id;

    if (!name) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }

    // Ensure admin is in members list
    const groupMembers = Array.from(new Set([adminId.toString(), ...(members || [])]));

    const newGroup = await Group.create({
      name,
      description,
      members: groupMembers,
      admin: adminId,
    });

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "fullName profilePicture email lastSeen bio")
      .populate("admin", "fullName profilePicture email");

    // Notify all online members about the new group
    groupMembers.forEach((memberId) => {
      const socketId = userSocketMap[memberId];
      if (socketId) {
        io.to(socketId).emit("groupCreated", populatedGroup);
      }
    });

    res.json({ success: true, group: populatedGroup });
  } catch (error) {
    console.error("Create Group Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= FETCH GROUPS =================
export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ members: userId })
      .populate("members", "fullName profilePicture email lastSeen bio")
      .populate("admin", "fullName profilePicture email");

    const promises = groups.map(async (group) => {
      const lastMsg = await Message.findOne({ receiverId: group._id })
        .sort({ createdAt: -1 })
        .populate("senderId", "fullName");

      return {
        ...group.toObject(),
        lastMessage: lastMsg ? {
          text: lastMsg.text,
          image: lastMsg.image,
          createdAt: lastMsg.createdAt,
          senderName: lastMsg.senderId?.fullName || "Member",
        } : null
      };
    });

    const groupsWithLastMessage = await Promise.all(promises);
    res.json({ success: true, groups: groupsWithLastMessage });
  } catch (error) {
    console.error("Get Groups Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= FETCH GROUP MESSAGES =================
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await Message.find({ receiverId: groupId })
      .sort({ createdAt: 1 })
      .populate("senderId", "fullName profilePicture")
      .populate({ path: 'replyTo', populate: { path: 'senderId', select: 'fullName' } });

    res.json({ success: true, messages });
  } catch (error) {
    console.error("Get Group Messages Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= SEND GROUP MESSAGE =================
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResult = await cloudinary.uploader.upload(image);
      imageUrl = uploadResult.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId: groupId,
      text,
      image: imageUrl,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePicture");

    // Fetch the group to find its members
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Broadcast the message to all members (including sender for syncing across sessions)
    group.members.forEach((memberId) => {
      const socketId = userSocketMap[memberId];
      if (socketId) {
        io.to(socketId).emit("newMessage", populatedMessage);
      }
    });

    res.json({ success: true, newMessage: populatedMessage });

    // Trigger AI response if starting with @ai
    const isAiTriggerWord = text && text.trim().toLowerCase().startsWith("@ai");
    if (isAiTriggerWord) {
      (async () => {
        try {
          const prompt = text.replace(/^@ai\s+/i, "").trim();
          const aiResponseText = await getAiResponse(prompt, req.user);

          // Create AI message in DB under the group
          const aiMessage = await Message.create({
            senderId: aiUserId,
            receiverId: groupId,
            text: aiResponseText,
          });

          // Fetch the populated AI message with sender details
          const populatedAiMsg = await Message.findById(aiMessage._id)
            .populate("senderId", "fullName profilePicture");

          // Broadcast the AI response to all members
          group.members.forEach((memberId) => {
            const socketId = userSocketMap[memberId];
            if (socketId) {
              io.to(socketId).emit("newMessage", populatedAiMsg);
            }
          });
        } catch (aiErr) {
          console.error("AI response generation group error:", aiErr);
        }
      })();
    }
  } catch (error) {
    console.error("Send Group Message Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= ADD / REMOVE MEMBERS =================
export const addRemoveMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body; // Array of new members list
    const adminId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Verify requesting user is admin
    if (group.admin.toString() !== adminId.toString()) {
      return res.status(403).json({ success: false, message: "Only group admin can modify members" });
    }

    group.members = members;
    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate("members", "fullName profilePicture email lastSeen bio")
      .populate("admin", "fullName profilePicture email");

    // Notify all members
    members.forEach((memberId) => {
      const socketId = userSocketMap[memberId];
      if (socketId) {
        io.to(socketId).emit("groupUpdated", populatedGroup);
      }
    });

    res.json({ success: true, group: populatedGroup });
  } catch (error) {
    console.error("Modify Group Members Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
