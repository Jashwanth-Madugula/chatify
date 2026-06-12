import User from '../models/User.js';
import Message from '../models/Message.js';
import Group from '../models/Group.js';
import cloudinary from '../lib/cloudinary.js';
import { io, userSocketMap, aiUserId } from '../server.js';
import { getAiResponse } from '../lib/groq.js';

//Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({
            _id: { $ne: req.user._id }
        }).select("-password");

        //count the number of messages unseen
        const unseenMessages={}
        const promises = filteredUsers.map(async (user) => {
            const count = await Message.countDocuments({ senderId: user._id, receiverId: userId, seen: false });
            if(count > 0) unseenMessages[user._id] = count;

            // Find last message in this conversation (including AI messages)
            const lastMsg = await Message.findOne({
                $or: [
                    { senderId: userId, receiverId: user._id },
                    { senderId: user._id, receiverId: userId },
                    ...(aiUserId ? [
                        { senderId: aiUserId, receiverId: user._id, associatedUserId: userId },
                        { senderId: aiUserId, receiverId: userId, associatedUserId: user._id }
                    ] : [])
                ]
            }).sort({ createdAt: -1 });

            return {
                ...user.toObject(),
                lastMessage: lastMsg ? {
                    text: lastMsg.text,
                    image: lastMsg.image,
                    createdAt: lastMsg.createdAt,
                    senderId: lastMsg.senderId,
                } : null
            };
        });
        const usersWithLastMessage = await Promise.all(promises);
        res.json({ success: true, users: usersWithLastMessage, unseenMessages });
    }
    catch (error) {
        console.error("Error fetching users for sidebar:", error);
        res.json({ success: false, message: error.message });
    }
};

// Get messages between two users
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
                ...(aiUserId ? [
                    { senderId: aiUserId, receiverId: selectedUserId, associatedUserId: myId },
                    { senderId: aiUserId, receiverId: myId, associatedUserId: selectedUserId }
                ] : [])
            ]
        })
        .sort({ createdAt: 1 })
        .populate({ path: 'replyTo', populate: { path: 'senderId', select: 'fullName' } });

        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId, seen: false },
            { $set: { seen: true } }
        );

        const senderSocketId = userSocketMap[selectedUserId];
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesSeen", {
                senderId: selectedUserId,
                receiverId: myId
            });
        }

        res.json({ success: true, messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.json({ success: false, message: error.message });
    }
};

// Mark messages as seen
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Message.findByIdAndUpdate(id, { seen: true }, { new: true });        
        
        if (updated) {
            const senderSocketId = userSocketMap[updated.senderId];
            if (senderSocketId) {
                io.to(senderSocketId).emit("messagesSeen", {
                    senderId: updated.senderId,
                    receiverId: updated.receiverId
                });
            }
        }

        res.json({ success: true, message: "Messages marked as seen" });
    } catch (error) {
        console.error("Error marking messages as seen:", error);
        res.json({ success: false, message: error.message });
    }   
};

//send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { receiverId, text, image, replyTo } = req.body;
        const senderId = req.user._id;
        
        let imageUrl;
        if (image) {
            const uploadResult = await cloudinary.uploader.upload(image);
            imageUrl = uploadResult.secure_url;   
        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            replyTo
        });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate({ path: 'replyTo', populate: { path: 'senderId', select: 'fullName' } });

        //emit the new message to the receiver if they are online
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", populatedMessage);
        }

        // Also emit to the sender's other sockets (to sync sidebar/multi-tab)
        const senderSocketId = userSocketMap[senderId];
        if (senderSocketId) {
            io.to(senderSocketId).emit("newMessage", populatedMessage);
        }

        res.json({ success: true, newMessage: populatedMessage });

        // Trigger AI Response in the background (asynchronous)
        const isDirectAiChat = receiverId.toString() === aiUserId.toString();
        const isAiTriggerWord = text && text.trim().toLowerCase().startsWith("@ai");

        if (isDirectAiChat || isAiTriggerWord) {
            (async () => {
                try {
                    const prompt = isAiTriggerWord ? text.replace(/^@ai\s+/i, "").trim() : text;
                    const aiResponseText = await getAiResponse(prompt, req.user);

                    // Create AI message in DB
                    const aiMessage = await Message.create({
                        senderId: aiUserId,
                        receiverId: isDirectAiChat ? senderId : receiverId,
                        associatedUserId: isDirectAiChat ? undefined : senderId,
                        text: aiResponseText,
                    });

                    const populatedAiMessage = await Message.findById(aiMessage._id);

                    // Broadcast AI response to receiver
                    const targetReceiverId = isDirectAiChat ? senderId : receiverId;
                    const recSocket = userSocketMap[targetReceiverId];
                    if (recSocket) {
                        io.to(recSocket).emit("newMessage", populatedAiMessage);
                    }

                    // Broadcast AI response to sender
                    const sendSocket = userSocketMap[senderId];
                    if (sendSocket) {
                        io.to(sendSocket).emit("newMessage", populatedAiMessage);
                    }
                } catch (aiErr) {
                    console.error("AI response generation background error:", aiErr);
                }
            })();
        }
    } catch (error) {
        console.error("Error sending message:", error);
        res.json({ success: false, message: error.message });
    }
};

// ================= MESSAGE ACTIONS HELPER =================
const broadcastMessageUpdate = async (event, payload) => {
    const { receiverId, senderId } = payload;
    const group = await Group.findById(receiverId);
    if (group) {
        group.members.forEach((memberId) => {
            if (memberId.toString() !== senderId.toString()) {
                const socketId = userSocketMap[memberId];
                if (socketId) {
                    io.to(socketId).emit(event, payload);
                }
            }
        });
    } else {
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit(event, payload);
        }
    }
};

// ================= EDIT MESSAGE =================
export const editMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const senderId = req.user._id;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        if (message.senderId.toString() !== senderId.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized to edit this message" });
        }

        message.text = text;
        message.isEdited = true;
        await message.save();

        const updatedMessage = await Message.findById(id)
            .populate({ path: 'replyTo', populate: { path: 'senderId', select: 'fullName' } });

        await broadcastMessageUpdate("messageEdited", updatedMessage);

        res.json({ success: true, message: updatedMessage });
    } catch (error) {
        console.error("Error editing message:", error);
        res.json({ success: false, message: error.message });
    }
};

// ================= DELETE MESSAGE =================
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const senderId = req.user._id;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        if (message.senderId.toString() !== senderId.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this message" });
        }

        message.text = "This message was deleted";
        message.image = undefined;
        message.isDeleted = true;
        await message.save();

        const updatedMessage = await Message.findById(id)
            .populate({ path: 'replyTo', populate: { path: 'senderId', select: 'fullName' } });

        await broadcastMessageUpdate("messageDeleted", updatedMessage);

        res.json({ success: true, message: updatedMessage });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.json({ success: false, message: error.message });
    }
};