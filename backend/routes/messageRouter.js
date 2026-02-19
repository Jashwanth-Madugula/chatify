import express from "express";
import {
  getMessages,
  getUsersForSidebar,
  markMessagesAsSeen,
  sendMessage,
} from "../Controllers/messageController.js";

import { protectRoute } from "../middleware/auth.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessagesAsSeen);

// removed unnecessary :id
messageRouter.post("/send", protectRoute, sendMessage);

export default messageRouter;
