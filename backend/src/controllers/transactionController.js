const Transaction = require('../models/Transaction');
const { checkGoalStatus } = require('../utils/goalChecker');

const getTransactions = async (req,res) => {
    // req.user is guaranteed by protect middleware

    const { type,category,startDate,endDate } = req.query;
    let query = { user: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query).sort({ date: -1,createdAt: -1 });
    res.json(transactions);
};

const addTransaction = async (req,res) => {
    const { amount,type,category,description,date } = req.body;

    const transaction = await Transaction.create({
        user: req.user._id,
        amount,
        type,
        category,
        description,
        date,
    });

    // Check goal status
    await checkGoalStatus(req.user._id);

    res.status(201).json(transaction);
};

const updateTransaction = async (req,res) => {
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
    await checkGoalStatus(req.user._id);

    res.json(updatedTransaction);
};

const deleteTransaction = async (req,res) => {
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

    res.json({ message: 'Transaction removed' });
};

module.exports = { getTransactions,addTransaction,updateTransaction,deleteTransaction };
