import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRouter.js";
import messageRouter from "./routes/messageRouter.js";
import { Server } from "socket.io";
import User from "./models/User.js";
import groupRouter from "./routes/groupRouter.js";

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json({limit: "4mb"}));

const server = http.createServer(app);

//intialize socket.io server
export const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});
//store online users
export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("A user connected: " + userId);

  if(userId) {
    userSocketMap[userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typing", ({ senderId, receiverId, isGroup, memberIds }) => {
    if (isGroup && memberIds) {
      memberIds.forEach((mId) => {
        if (mId.toString() !== senderId.toString()) {
          const socketId = userSocketMap[mId];
          if (socketId) {
            io.to(socketId).emit("userTyping", { senderId, groupId: receiverId });
          }
        }
      });
    } else {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", { senderId });
      }
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId, isGroup, memberIds }) => {
    if (isGroup && memberIds) {
      memberIds.forEach((mId) => {
        if (mId.toString() !== senderId.toString()) {
          const socketId = userSocketMap[mId];
          if (socketId) {
            io.to(socketId).emit("userStopTyping", { senderId, groupId: receiverId });
          }
        }
      });
    } else {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userStopTyping", { senderId });
      }
    }
  });

  socket.on("disconnect", async () => {
    console.log("A user disconnected: " + userId);
    if (userId) {
      try {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { lastSeen });
        io.emit("userOffline", { userId, lastSeen });
      } catch (err) {
        console.error("Error updating last seen:", err);
      }
    }
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

app.get("/api/status", (req, res) => {
  res.send("server is live");
});


app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRouter);

await connectDB();

export let aiUserId = "666666666666666666666666";

const seedAiUser = async () => {
  try {
    let aiUser = await User.findOne({ email: "ai@triples.chat" });
    if (!aiUser) {
      aiUser = await User.create({
        _id: aiUserId,
        fullName: "TripleS AI",
        email: "ai@triples.chat",
        password: "virtual_ai_user_password_xyz_123_456", // dummy password
        profilePicture: "https://cdn-icons-png.flaticon.com/512/8943/8943377.png", // pretty robot avatar icon
        bio: "Your personal AI assistant, powered by Groq. Ask me anything inside any conversation!",
        lastSeen: new Date(),
      });
      console.log("Seed: Created virtual AI User with ID:", aiUserId);
    } else {
      aiUserId = aiUser._id.toString();
      console.log("AI User initialized with ID:", aiUserId);
    }
  } catch (err) {
    console.error("Error seeding AI User:", err);
  }
};

await seedAiUser();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});