const express = require('express');
const {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const { cache } = require('../middleware/cache');
const router = express.Router();

const asyncHandler = require('../utils/asyncHandler');

router.route('/')
    .get(protect, cache(60 * 5), asyncHandler(getTransactions)) // Cache for 5 minutes
    .post(protect, asyncHandler(addTransaction));

router.route('/:id')
    .put(protect, asyncHandler(updateTransaction))
    .delete(protect, asyncHandler(deleteTransaction));

module.exports = router;
