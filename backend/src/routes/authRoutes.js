const express = require('express');
const { registerUser,loginUser,verifyEmail,checkVerifyStatus,autoLogin } = require('../controllers/authController');
const router = express.Router();

const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { registerSchema,loginSchema } = require('../schemas/authSchemas');

const { authLimiter,authSpeedLimiter } = require('../middleware/rateLimit');

router.post('/register',validate(registerSchema),asyncHandler(registerUser));
router.post('/login',authLimiter,authSpeedLimiter,validate(loginSchema),asyncHandler(loginUser));
router.get('/verify-email',asyncHandler(verifyEmail));
router.get('/verify-status',asyncHandler(checkVerifyStatus));
router.post('/auto-login',asyncHandler(autoLogin));

module.exports = router;
