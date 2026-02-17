import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../lib/utils.js';
import cloudinary from '../lib/cloudinary.js';

// Signup controller
export const signup = async (req, res) => {
    const { email, fullName, password, bio } = req.body;

    try {
        if (!email || !fullName || !password || !bio) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Create a new user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password, salt);
        const newUser = new User({
            email,
            fullName,
            password: hashedPassword,
            bio,
        });
        const token = generateToken(newUser);
        res.json({ success: true, userData: newUser, token, message: "Signup successful" });
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Login controller
export const login = async (req, res) => {
    try{
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }
        const userData = await User.findOne({ email });

        const isPasswordValid = await bcrypt.compare(password, userData.password);

        if(!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = generateToken(userData);
        res.json({ success: true, userData, token, message: "Login successful" });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Server error" });
    }
}

export const checkAuth = async (req, res) => {
    res.json({ success: true, user: req.user });
}

export const updateProfilePicture = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;
        const userId = req.user._id;
        let updatedUser;
        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { bio, fullName },
                { new: true }
            );
        }else{
            const upload = await cloudinary.uploader.upload(profilePic)
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { profilePic: upload.secure_url, bio, fullName },
                { new: true }
            );
        }
        res.json({ success: true, userData: updatedUser });
    } catch (error) {
        console.error("Error updating profile picture:", error);
        res.json({ success: false, message: "Server error" });
    }
}