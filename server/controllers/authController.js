const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailService");

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

exports.register = async (req, res) => {
    try{
        const {name, email, password} = req.body;

        if(!name || !email || !password){
            return res.status(400).json({error: "All fields are required"});
        }

        if(password.length < 6){
            return res.status(400).json({error: "Password must be at least 6 characters long"});
        }

        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({error: "User with this email already exists"});
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 1);

        const user = new User({
            name,
            email,
            password,
            verificationToken: {
                token: verificationToken,
                expiresAt: tokenExpiry
            }
        })

        await user.save();

        const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        const emailSent = await sendVerificationEmail(email, verificationUrl);

        if(!emailSent){
            return res.status(201).json({
                message: 'Account created but verification email could not be sent. Please contact support.',
                user: user.getPublicProfile()
            });
        }

        res.status(201).json({
            message: "Account created. Please verify your email to login.",
            user: user.getPublicProfile()
        });
    }
    catch(error){
        console.log(error);
        res.status(500).json({error: "Registration error"});
    }
}

exports.login = async (req, res) => {
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({error: "All fields are required"});
        }

        const user = await User.findOne({email});

        if(!user){
            return res.status(401).json({error: "Invalid email"});
        }

        if(!user.isVerified){
            return res.status(403).json({
                error: 'Please verify your email first',
                isVerified: false,
                email: user.email
            });
        }

        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.status(401).json({error: "Invalid password"});
        }

        user.isOnline = true;
        user.lastSeen = Date.now();
        await user.save();

        const token = generateToken(user._id);
        res.json({token, user: user.getPublicProfile()});
    }
    catch(error){
        console.log(error);
        res.status(500).json({error: "Error logging in"});
    }
}

exports.verifyEmail = async (req, res) => {
    try{
        const token = req.params.token;
        const user = await User.findOne({
            "verificationToken.token": token,
            "verificationToken.expiresAt": { $gt: Date.now() }
        });

        if(!user){
            return res.status(400).json({error: "Invalid or expired token"});
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        const authToken = generateToken(user._id);
        res.json({
            message: "Email verified successfully",
            token: authToken, 
            user: user.getPublicProfile()
        });
    }
    catch(error){
        console.log(error);
        res.status(500).json({error: "Error verifying email"});
    }
}

exports.resendVerification = async (req, res) => {
    try{
        const {email} = req.body;
        const user = await User.findOne({email, isVerified: false});
        if(!user){
            return res.status(400).json({error: "User not found or already verified"});
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 1);

        user.verificationToken = {
            token: verificationToken,
            expiresAt: tokenExpiry
        }
        await user.save();

        const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        const emailSent = await sendVerificationEmail(email, verificationUrl);

        if(!emailSent){
            return res.status(201).json({
                message: 'Verification email could not be sent. Please contact support.',
                user: user.getPublicProfile()
            });
        }

        res.status(201).json({
            message: "Verification email sent. Please verify your email to login.",
            user: user.getPublicProfile()
        });
    }
    catch(error){
        console.log(error);
        res.status(500).json({error: "Error resending verification email"});
    }
}

exports.forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Set expiry to 1 hour from now
      const resetExpires = Date.now() + 3600000; // 1 hour
  
      // Save token and expiry
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save();
  
      // Send reset email
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      await sendPasswordResetEmail(email, resetUrl);
  
      res.json({ 
        message: 'Password reset link sent to your email',

      });
  
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Error processing request' });
    }
  };

exports.resetPassword = async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
  
      // Validate password
      if (!password || password.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters long' 
        });
      }
  
      // Find user with valid reset token
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
  
      if (!user) {
        return res.status(400).json({ 
          error: 'Invalid or expired token' 
        });
      }
  
      // Update password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      
      await user.save();
  
      // You might want to automatically log in the user
      const authToken = generateToken(user._id);
  
      res.json({ 
        message: 'Password reset successful',
        token: authToken,
        user: user.getPublicProfile()
      });
  
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Error resetting password' });
    }
  };

exports.logout = async (req, res) => {
    try{
        const user = await User.findById(req.user.userId);
        if(!user){
            return res.status(400).json({error: "User not found"});
        }

        user.isOnline = false;
        user.lastSeen = new Date();
        await user.save();

        res.json({message: "Logged out successfully"});
    }
    catch(error){
        console.log(error);
        res.status(500).json({error: "Error logging out"});
    }
}

