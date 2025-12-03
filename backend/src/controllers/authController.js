const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id },process.env.JWT_SECRET,{ expiresIn: '30d' });
};

const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

const registerUser = async (req,res) => {
    const { name,email,password,mobileNumber } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 30 * 60 * 1000; // 30 mins

    const user = await User.create({
        name,
        email,
        password,
        mobileNumber,
        verificationToken,
        verificationExpires,
        emailVerified: false
    });

    if (user) {
        // Send verification email
        try {
            await sendEmail(user.email,'verification',verificationToken);
        } catch (error) {
            console.error('Failed to send verification email:',error);
            // Consider deleting user or handling error gracefully
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
            token: generateToken(user._id),
            message: 'Registration successful. Please check your email to verify your account.',
            ...(process.env.NODE_ENV === 'development' && { verificationToken })
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

const loginUser = async (req,res) => {
    const { email,password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (!user.emailVerified) {
            return res.status(403).json({ message: 'Please verify your email first.' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

const verifyEmail = async (req,res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({
            verificationToken: token,
            verificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            // Redirect to error page
            return res.redirect(`${process.env.FRONTEND_URL}/verify-error?reason=invalid`);
        }

        user.emailVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();

        // Generate JWT token for auto-login
        const authToken = generateToken(user._id);
        const userData = encodeURIComponent(JSON.stringify({
            _id: user._id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber
        }));

        // Redirect to success page with token for auto-login
        res.redirect(`${process.env.FRONTEND_URL}/verified-success?token=${authToken}&user=${userData}`);
    } catch (error) {
        console.error('Email verification error:',error);
        res.redirect(`${process.env.FRONTEND_URL}/verify-error?reason=server`);
    }
};

module.exports = { registerUser,loginUser,verifyEmail };
