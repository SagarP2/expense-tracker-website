const User = require('../models/User');
const { generateUniqueUsername } = require('../helpers/usernameHelper');
const { checkGoalStatus } = require('../utils/goalChecker');

// @desc    Get user's savings goal
// @route   GET /api/users/savings-goal
// @access  Private
const { get,set,del } = require('../utils/cache');

// @desc    Get user's savings goal
// @route   GET /api/users/savings-goal
// @access  Private
const getSavingsGoal = async (req,res) => {
    // req.user is guaranteed by protect middleware

    const cacheKey = `user:savings:${req.user._id}`;
    const cachedGoal = await get(cacheKey);

    if (cachedGoal !== null) {
        return res.json({ savingsGoal: cachedGoal });
    }

    // We can also fetch the user again if we need fresh data, or just use req.user ID
    const user = await User.findById(req.user._id).select('savingsGoal');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const goal = user.savingsGoal || 0;
    await set(cacheKey,goal,60); // Cache for 60s

    res.json({ savingsGoal: goal });
};

// @desc    Update user's savings goal
// @route   PUT /api/users/savings-goal
// @access  Private
const updateSavingsGoal = async (req,res) => {
    // req.user is guaranteed by protect middleware

    const { savingsGoal } = req.body;

    if (savingsGoal < 0) {
        res.status(400);
        throw new Error('Savings goal must be a positive number');
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.savingsGoal = savingsGoal;
    await user.save();

    // Invalidate cache
    await del(`user:savings:${req.user._id}`);

    // Check goal status immediately
    await checkGoalStatus(req.user._id);

    res.json({ savingsGoal: user.savingsGoal });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req,res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            mobileNumber: user.mobileNumber,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req,res) => {
    // req.user is guaranteed by protect middleware

    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.mobileNumber = req.body.mobileNumber || user.mobileNumber;

        // Regenerate username if name or mobile number changed
        if (req.body.name || req.body.mobileNumber) {
            user.username = await generateUniqueUsername(User,user.name,user.mobileNumber);
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            username: updatedUser.username,
            mobileNumber: updatedUser.mobileNumber,
            // Keep existing token
            token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : null,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

module.exports = { getSavingsGoal,updateSavingsGoal,updateUserProfile,getUserProfile };

