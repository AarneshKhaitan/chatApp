// server/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.post('/logout', auth, authController.logout);

// Get current user (protected route)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user data' });
  }
});

// Verify token (protected route)
router.get('/verify-token', auth, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

module.exports = router;