const User = require('../models/User');

exports.searchUsers = async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ message: "Email search term is required" });
        }

        // Find users excluding the current user and only verified users
        const users = await User.find({
            _id: { $ne: req.user.userId },
            email: { $regex: email, $options: 'i' },
            isVerified: true
        })
        .select('_id name email isOnline lastSeen')
        .limit(10);

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error searching users" });
    }
};
