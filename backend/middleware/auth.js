

// Middleware to protect routes
export const protectRoute = async (req, res, next) => {
    try{
        const token = req.header.token;

        const decoded = JsonWebTokenError.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            res.json({success:false, message: "User not found" });
        }

        req.user = user;
        next();
    }catch(error){
        res.json({success:false, message: error.message });
    }
}

// controller to check if the user is authenticated
export const checkAuth = async (req, res) => {
    try {
        res.json({success:true, user: req.user });
    }catch (error) {
        res.json({success:false, message: error.message });
    }
}