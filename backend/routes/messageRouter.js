import express from "express";
import { getMessages,getUsersForSidebar, markMessagesAsSeen } from "../Controllers/messageController.js";
import { protectRoute } from "../middleware/authMiddleware.js";
import { sendMessage } from "../Controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages)
messageRouter.put("/mark/:id", protectRoute, markMessagesAsSeen);
messageRouter.post("/send/:id", protectRoute,sendMessage);

export default messageRouter;