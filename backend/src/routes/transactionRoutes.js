const express = require('express');
const {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

const asyncHandler = require('../utils/asyncHandler');

router.route('/')
    .get(protect,asyncHandler(getTransactions))
    .post(protect,asyncHandler(addTransaction));

router.route('/:id')
    .put(protect,asyncHandler(updateTransaction))
    .delete(protect,asyncHandler(deleteTransaction));

module.exports = router;
