import express from "express";
import {
  signup,
  login,
  updateProfilePicture,
} from "../Controllers/userControlers.js";

import { protectRoute, checkAuth } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.get("/check-auth", protectRoute, checkAuth);

// Protected profile update
userRouter.put("/update-profile", protectRoute, updateProfilePicture);

export default userRouter;
