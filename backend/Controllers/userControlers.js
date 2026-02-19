import User from "../models/User.js";
import bcrypt from "bcrypt";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";


// ================= SIGNUP =================
export const signup = async (req, res) => {
  try {
    console.log("Signup Body:", req.body);
    const { email, fullName, password, bio } = req.body;

    // Validation
    if (!email || !fullName || !password || !bio) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      email,
      fullName,
      password: hashedPassword,
      bio,
    });

    // Generate token
    const token = generateToken(newUser);

    // Remove password from response
    const userWithoutPassword = await User.findById(newUser._id).select("-password");

    res.json({
      success: true,
      userData: userWithoutPassword,
      token,
      message: "Signup successful",
    });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(userData);

    const userWithoutPassword = await User.findById(userData._id).select("-password");

    res.json({
      success: true,
      userData: userWithoutPassword,
      token,
      message: "Login successful",
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ================= CHECK AUTH =================
export const checkAuth = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= UPDATE PROFILE =================
export const updateProfilePicture = async (req, res) => {
  try {
    const { profilePicture, bio, fullName } = req.body;
    const userId = req.user._id;

    let updatedUser;

    // Update without image
    if (!profilePicture) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      );
    } else {
      // Upload image to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(profilePicture);

      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          profilePicture: uploadResult.secure_url,
          bio,
          fullName,
        },
        { new: true }
      );
    }

    res.json({
      success: true,
      userData: updatedUser,
      message: "Profile updated successfully",
    });

  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
