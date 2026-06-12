import express from "express";
import {
  createGroup,
  getGroups,
  getGroupMessages,
  sendGroupMessage,
  addRemoveMembers,
} from "../Controllers/groupController.js";
import { protectRoute } from "../middleware/auth.js";

const groupRouter = express.Router();

groupRouter.post("/create", protectRoute, createGroup);
groupRouter.get("/", protectRoute, getGroups);
groupRouter.get("/:groupId/messages", protectRoute, getGroupMessages);
groupRouter.post("/:groupId/send", protectRoute, sendGroupMessage);
groupRouter.put("/:groupId/members", protectRoute, addRemoveMembers);

export default groupRouter;
