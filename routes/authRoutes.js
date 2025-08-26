const express = require("express");
const { 
  signup, 
  login,  
  verifyEmail, 
  forgotPassword, 
  resetPassword 
} = require("../authControllers/authController");
const { authMiddleware, addToBlacklist } = require("../middleware/authMiddleware"); // Import addToBlacklist

const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected route (requires valid token)
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Add the token to blacklist using the imported function
    addToBlacklist(req.token);
    
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});
// router.get("/me", authMiddleware, async (req, res) => {
//   res.json({ email: req.user.email }); // JWT se mila hua user
// });

// Google Login Route
router.post('/google-login', async (req, res) => {
    const { token } = req.body;
    
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        // Check if user exists in DB (or create new user)
        let user = await User.findOne({ email });
        
        if (!user) {
            user = new User({
                email,
                name,
                avatar: picture,
                provider: 'google',
            });
            await user.save();
        }

        // Generate JWT token (same as your existing auth)
        const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '365d',
        });

        res.status(200).json({ token: jwtToken, user });
    } catch (error) {
        res.status(400).json({ error: 'Invalid Google token' });
    }
});
module.exports = router;