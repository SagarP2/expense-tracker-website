const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId,ref: 'User',required: true },
        collabId: { type: mongoose.Schema.Types.ObjectId,ref: 'Collaboration' },
        type: { type: String,required: true }, // invite_received, invite_response, settlement_request, etc.
        payload: { type: Object },
        isRead: { type: Boolean,default: false },

        isEmailed: { type: Boolean,default: false },
        emailedAt: Date,
        status: { type: String,enum: ["pending","sent","failed"],default: "pending" },

        eventId: { type: String,unique: true }, // idempotency
    },
    { timestamps: true }
);

const Notification = mongoose.model('Notification',notificationSchema);
module.exports = Notification;
