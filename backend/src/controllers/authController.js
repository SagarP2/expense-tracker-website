const User = require('../models/User');
const TempUser = require('../models/TempUser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');
const { generateUniqueUsername } = require('../helpers/usernameHelper');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    const { name, email, password, mobileNumber } = req.body;

    // Check if user is already registered and verified
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Check if there is a pending registration
    const tempUserExists = await TempUser.findOne({ email });
    if (tempUserExists) {
        // Option: Delete old pending and create new, or tell them to check email.
        // Let's delete old and create new to allow re-sending/updating details
        await TempUser.findOneAndDelete({ email });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // const verificationExpires = Date.now() + 30 * 60 * 1000; // Handled by TTL in TempUser

    // Save to TempUser collection
    const tempUser = await TempUser.create({
        name,
        email,
        username: await generateUniqueUsername(User, name, mobileNumber), // Reserve username concept
        password, // Pre-save hook will hash it
        mobileNumber,
        verificationToken
    });

    if (tempUser) {
        // Send verification email asynchronously
        sendEmail(tempUser.email, 'verification', verificationToken)
            .catch(error => {
                console.error('Failed to send verification email:', error);
            });

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            ...(process.env.NODE_ENV === 'development' && { verificationToken })
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (!user.emailVerified) {
            res.status(403);
            throw new Error('Please verify your email first.');
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            mobileNumber: user.mobileNumber,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.query;

    const tempUser = await TempUser.findOne({ verificationToken: token });

    if (!tempUser) {
        return res.redirect(`${process.env.FRONTEND_URL}/verify-error?reason=invalid`);
    }

    // Move data from TempUser to User
    // NOTE: TempUser.password is already hashed. We use insertOne to bypass Mongoose pre-save hook 
    // which would otherwise double-hash the password.
    const userData = {
        name: tempUser.name,
        email: tempUser.email,
        username: tempUser.username,
        password: tempUser.password, // Already hashed
        mobileNumber: tempUser.mobileNumber,
        savingsGoal: 0,
        emailVerified: true,
        monthlyGoalStatus: { isReachedNotified: false, isPendingNotified: false },
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Direct MongoDB insert to bypass middleware
    const result = await User.collection.insertOne(userData);
    const newUserId = result.insertedId;

    await TempUser.findOneAndDelete({ verificationToken: token });

    // Generate token for auto-login
    const authToken = generateToken(newUserId);

    // Redirect to simple success page with token
    res.redirect(`${process.env.FRONTEND_URL}/verified-success?token=${authToken}`);
};

// Check verification status (for polling)
const checkVerifyStatus = async (req, res) => {
    const { email } = req.query;

    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json({ verified: user.emailVerified });
};

// Auto-login endpoint (only for verified users)
const autoLogin = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (!user.emailVerified) {
        res.status(403);
        throw new Error('Email not verified');
    }

    // Generate token and return user data
    const token = generateToken(user._id);

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        mobileNumber: user.mobileNumber,
        token
    });
};

module.exports = { registerUser, loginUser, verifyEmail, checkVerifyStatus, autoLogin };

