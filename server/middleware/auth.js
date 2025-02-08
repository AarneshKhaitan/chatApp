// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.userId)
        .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Add user info to request
      req.user = {
        userId: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
      };
      
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token is not valid' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = auth;