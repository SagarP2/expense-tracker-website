const mongoose = require('mongoose');

const collaborationSchema = new mongoose.Schema({
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    status: {
        type: String,
        enum: ['pending','active','rejected'],
        default: 'pending'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        default: 'Shared Expenses'
    }
},{
    timestamps: true
});

// Index for faster queries
collaborationSchema.index({ users: 1,status: 1 });

module.exports = mongoose.model('Collaboration',collaborationSchema);
