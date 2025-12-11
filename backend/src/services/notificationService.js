const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');
const User = require('../models/User');

const getNotificationMessage = (type,payload) => {
    switch (type) {
        case 'COLLAB_INVITE':
        case 'invite_received': // Legacy support
            return `${payload.inviterName} invited you to join "${payload.collabName}"`;
        case 'invite_response':
            return `${payload.userName} ${payload.status} your invitation to "${payload.collabName}"`;
        case 'SETTLEMENT_REQUEST':
        case 'settlement_request': // Legacy support
            return `${payload.requesterName} requested settlement of ₹${payload.amount}`;
        case 'settlement_response':
            return `Settlement request for "${payload.collabName}" was ${payload.status}`;
        case 'settlement_paid':
            return `${payload.payerName} paid ₹${payload.amount}`;
        case 'SETTLEMENT_PARTIAL_PAYMENT':
            return `${payload.payerName} paid partial amount ₹${payload.amount}`;
        case 'COLLAB_DELETE_REQUEST':
            return `${payload.requesterName} requested to delete collaboration "${payload.collabName}"`;
        case 'COLLAB_DELETED':
            return `Collaboration "${payload.collabName}" was deleted`;
        case 'COLLAB_DELETE_REJECTED':
            return `Deletion request for "${payload.collabName}" was rejected`;
        case 'GOAL_REACHED':
            return `🎉 Goal Achieved! You reached your savings goal of ₹${payload.goalAmount}`;
        case 'GOAL_PROGRESS':
            return `Monthly Goal Update: ₹${payload.remaining} remaining to reach your goal of ₹${payload.goalAmount}`;
        case 'GOAL_REGRESSED':
            return `⚠️ Alert: You have dropped below your monthly savings goal of ₹${payload.goalAmount}`;
        default:
            return 'New notification';
    }
};

/**
 * Core function to create and send a notification.
 * Safe, strictly fire-and-forget for side effects.
 */
const createNotification = async (userId,collabId,type,payload,eventId) => {
    try {
        console.log('🏗️ createNotification:',{ userId: userId?.toString(),type,eventId });

        if (!userId) {
            console.warn('⚠️ No userId provided to createNotification');
            return null;
        }

        // Idempotency
        if (eventId) {
            const existing = await Notification.findOne({ eventId });
            if (existing) {
                console.log('ℹ️ Notification exists:',existing._id);
                return existing;
            }
        }

        const message = getNotificationMessage(type,payload);

        // 1. Create DB Record
        const notification = await Notification.create({
            userId,
            collabId,
            type,
            message,
            payload,
            eventId,
            status: 'pending',
            isRead: false
        });

        // 2. Real-time emit (Socket.IO)
        if (global.io) {
            const roomName = `user:${userId.toString()}`;
            global.io.to(roomName).emit('notification:new',notification);
        }

        // 3. Email (Fire-and-forget)
        (async () => {
            try {
                const user = await User.findById(userId);
                // Basic check: don't email if user invalid or is the payload actor (failsafe)
                // e.g. if payerId == requesterId (defensive)
                if (user && user.email) {
                    await sendEmail(user.email,type,payload);
                    await Notification.findByIdAndUpdate(notification._id,{
                        isEmailed: true,
                        emailedAt: new Date(),
                        status: 'sent'
                    });
                }
            } catch (err) {
                console.error(`❌ Email failed for notif ${notification._id}:`,err.message);
                await Notification.findByIdAndUpdate(notification._id,{ status: 'failed' });
            }
        })();

        return notification;

    } catch (error) {
        console.error('❌ critical createNotification error:',error);
        // Do not throw, return safe null
        return null;
    }
};

// --- Exports ---

// Required by user prompt
const sendSettlementRequest = async ({ requesterId,requesterName,payerId,amount,settlementId,appUrl,emitter }) => {
    if (requesterId.toString() === payerId.toString()) {
        console.warn('⚠️ Skipping notification: Requester is same as Payer');
        return;
    }

    const frontendUrl = appUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
    const payUrl = `${frontendUrl}/settlements/${settlementId}/pay`;

    return createNotification(
        payerId,
        settlementId,
        'SETTLEMENT_REQUEST',
        {
            requesterName,
            amount: amount,
            collabId: settlementId,
            settlementId: settlementId,
            payUrl: payUrl
        },
        `settlement_request_${settlementId}_${Date.now()}`
    );
};

// Wrappers for other events to keep controller clean
const sendInvite = async (inviter,invitedUser,collaboration) => {
    return createNotification(
        invitedUser._id,
        collaboration._id,
        'COLLAB_INVITE',
        {
            collabName: 'New Collaboration',
            inviterName: inviter.name,
            collabId: collaboration._id
        },
        `invite_received_${collaboration._id}`
    );
};

const sendInviteResponse = async (responder,recipients,collaboration,status) => {
    const recipientId = recipients._id || recipients;
    return createNotification(
        recipientId,
        collaboration._id,
        'invite_response',
        {
            collabName: 'Collaboration',
            userName: responder.name,
            status,
            collabId: collaboration._id
        },
        `invite_${status}_${collaboration._id}`
    );
};

const sendSettlementPayment = async (payer,recipientId,collaboration,amount,reason = null) => {
    const type = reason ? 'SETTLEMENT_PARTIAL_PAYMENT' : 'settlement_paid';
    return createNotification(
        recipientId,
        collaboration._id,
        type,
        {
            payerName: payer.name,
            amount,
            reason,
            collabId: collaboration._id
        },
        `settlement_paid_${collaboration._id}_${Date.now()}`
    );
};

const sendGoalStatus = async (user,goalAmount,currentSavings,forcedType) => {
    const reached = currentSavings >= goalAmount;
    const type = forcedType || (reached ? 'GOAL_REACHED' : 'GOAL_PROGRESS');
    const remaining = Math.max(0,goalAmount - currentSavings);

    return createNotification(
        user._id,
        null, // No collabId
        type,
        {
            goalName: 'Monthly Savings', // Generic name
            goalAmount,
            currentSavings,
            remaining,
            reached
        },
        `goal_${type.toLowerCase()}_${user._id}_${new Date().toISOString().slice(0,7)}`
    );
};

module.exports = {
    createNotification,
    sendSettlementRequest,
    sendInvite,
    sendInviteResponse,
    sendSettlementPayment,
    sendGoalStatus
};
