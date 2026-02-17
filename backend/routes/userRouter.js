import express from 'express';
import { signup,login, updateProfile } from '../Controllers/userControlers.js';
import { protectRoute, checkAuth } from '../middleware/authMiddleware.js';

const userRouter = express.Router();

userRouter.post('/signup', signup);
userRouter.post('/login', login);
userRouter.get('/check-auth', checkAuth);
userRouter.post('/updateprofile', protectRoute, updateProfile);

export default userRouter;