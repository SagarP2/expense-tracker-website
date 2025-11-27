const Transaction = require('../models/Transaction');

const getTransactions = async (req,res) => {
    const { type,category,startDate,endDate } = req.query;
    let query = { user: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
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

    res.status(201).json(transaction);
};

const updateTransaction = async (req,res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.json(updatedTransaction);
};

const deleteTransaction = async (req,res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'User not authorized' });
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction removed' });
};

module.exports = { getTransactions,addTransaction,updateTransaction,deleteTransaction };
