const mongoose = require('mongoose');

const collabTransactionSchema = new mongoose.Schema({
    collaborationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collaboration',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['income','expense'],
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        default: Date.now
    }
},{
    timestamps: true
});

// Index for faster queries
collabTransactionSchema.index({ collaborationId: 1,date: -1 });

module.exports = mongoose.model('CollabTransaction',collabTransactionSchema);
