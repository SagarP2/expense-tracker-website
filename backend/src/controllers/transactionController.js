const Transaction = require('../models/Transaction');
const { checkGoalStatus } = require('../utils/goalChecker');
const { cache, invalidateUserCache } = require('../middleware/cache');

const getTransactions = async (req, res) => {
    // req.user is guaranteed by protect middleware

    const { type, category, startDate, endDate } = req.query;
    let query = { user: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
        .sort({ date: -1, createdAt: -1 })
        .lean(); // Optimize for read performance

    // Explicitly cache result if not using middleware (but we are using middleware in routes)
    // However, since we're using middleware in the route definition (which I need to update),
    // we don't need to do anything here for caching GET.

    res.json(transactions);
};

const addTransaction = async (req, res) => {
    const { amount, type, category, description, date } = req.body;

    const transaction = await Transaction.create({
        user: req.user._id,
        amount,
        type,
        category,
        description,
        date,
    });

    // Check goal status
    // Check goal status (non-blocking if possible, but we want consistency)
    await checkGoalStatus(req.user._id);

    // Invalidate cache
    await invalidateUserCache(req.user._id);

    res.status(201).json(transaction);
};

const updateTransaction = async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure logged in user matches the transaction user
    if (transaction.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    // Check goal status
    // Check goal status
    await checkGoalStatus(req.user._id);

    // Invalidate cache
    await invalidateUserCache(req.user._id);

    res.json(updatedTransaction);
};

const deleteTransaction = async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure logged in user matches the transaction user
    if (transaction.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized');
    }


    await transaction.deleteOne();

    // Check goal status
    await checkGoalStatus(req.user._id);

    // Invalidate cache
    await invalidateUserCache(req.user._id);

    res.json({ message: 'Transaction removed' });
};

module.exports = { getTransactions, addTransaction, updateTransaction, deleteTransaction };
