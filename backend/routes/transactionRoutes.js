const express = require('express');
const {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect,getTransactions).post(protect,addTransaction);
router.route('/:id').put(protect,updateTransaction).delete(protect,deleteTransaction);

module.exports = router;
