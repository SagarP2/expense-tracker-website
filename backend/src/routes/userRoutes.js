const express = require('express');
const { getSavingsGoal,updateSavingsGoal,updateUserProfile,getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

const asyncHandler = require('../utils/asyncHandler');

router.get('/savings-goal',protect,asyncHandler(getSavingsGoal));
router.put('/savings-goal',protect,asyncHandler(updateSavingsGoal));
router.put('/profile',protect,asyncHandler(updateUserProfile));
router.get('/profile',protect,asyncHandler(getUserProfile));

module.exports = router;
