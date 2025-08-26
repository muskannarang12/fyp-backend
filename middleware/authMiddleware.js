const jwt = require('jsonwebtoken');
const User = require('../models/User');

const blacklist = new Set();

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    if (blacklist.has(token)) {
      return res.status(401).json({ message: 'Token invalidated. Please log in again.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ 
        _id: decoded.userId,
        verified: true 
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found or not verified' });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Allow logout even with expired token
        if (req.originalUrl.includes('/auth/logout')) {
          blacklist.add(token); // Add to blacklist
          return next();
        }
        return res.status(401).json({ 
          message: 'Token expired. Please log in again.',
          expiredAt: error.expiredAt 
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

const addToBlacklist = (token) => blacklist.add(token);

module.exports = { 
  authMiddleware,
  addToBlacklist
};