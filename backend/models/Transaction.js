const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId,required: true,ref: 'User' },
        amount: { type: Number,required: true },
        type: { type: String,required: true,enum: ['income','expense'] },
        category: { type: String,required: true },
        description: { type: String },
        date: { type: Date,required: true,default: Date.now },
    },
    { timestamps: true }
);

const Transaction = mongoose.model('Transaction',transactionSchema);
module.exports = Transaction;
