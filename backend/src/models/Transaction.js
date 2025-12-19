const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
        amount: { type: Number, required: true },
        type: { type: String, required: true, enum: ['income', 'expense'] },
        category: { type: String, required: true },
        description: { type: String },
        date: { type: Date, required: true, default: Date.now, index: true },
    },
    { timestamps: true }
);

// Compound indexes for common queries
transactionSchema.index({ user: 1, date: -1 }); // For history
transactionSchema.index({ user: 1, type: 1, date: -1 }); // For filtering by type

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
