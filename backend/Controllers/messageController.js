import User from '../models/User.js';
import Message from '../models/Message.js';
import cloudinary from '../lib/cloudinary.js';
import { io, userSocketMap } from '../server.js';

//Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        //count the number of messages unseen
        const unseenMessages={}
        const promises = filteredUsers.map(async (user) => {
            const count = await Message.countDocuments({ sender: user._id, receiver: userId, seen: false });
            if(count > 0) unseenMessages[user._id] = count;
        });
        await Promise.all(promises);
        res.json({ success: true, users: filteredUsers, unseenMessages });
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
                { senderId: selectedUserId, receiverId: myId }
            ]
        })
        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId, seen: false },
            { $set: { seen: true } }
        );
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
        await Message.findByIdAndUpdate(id, { seen: true });        
        res.json({ success: true, message: "Messages marked as seen" });
    } catch (error) {
        console.error("Error marking messages as seen:", error);
        res.json({ success: false, message: error.message });
    }   
};

//send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { receiverId, text, image } = req.body;
        const senderId = req.user._id;
        
        let imageUrl;
        if (image) {
            const uploadResult = await cloudinary.uploader.upload(image);
            imageUrl = uploadResult.secure_url;   
        }
        const newMessage = new Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        //emit the new message to the receiver if they are online
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        res.json({ success: true, newMessage });
    } catch (error) {
        console.error("Error sending message:", error);
        res.json({ success: false, message: error.message });
    }
};