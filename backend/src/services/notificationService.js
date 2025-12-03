const Notification = require('../models/Notification');
const Queue = require('bull');
const { sendEmail } = require('./emailService');
const User = require('../models/User');

// Create email queue
const emailQueue = new Queue('emailQueue',{
    redis: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
});

// Process email queue
emailQueue.process(async (job) => {
    const { notificationId,to,type,payload } = job.data;

    try {
        await sendEmail(to,type,payload);

        await Notification.findByIdAndUpdate(notificationId,{
            isEmailed: true,
            emailedAt: new Date(),
            status: 'sent',
        });
    } catch (error) {
        console.error(`Failed to send email for notification ${notificationId}:`,error);
        await Notification.findByIdAndUpdate(notificationId,{
            status: 'failed',
        });
        throw error; // Retry job
    }
});

const createNotification = async (userId,collabId,type,payload,eventId) => {
    try {
        // Idempotency check
        const existingNotification = await Notification.findOne({ eventId });
        if (existingNotification) {
            return existingNotification;
        }

        const notification = await Notification.create({
            userId,
            collabId,
            type,
            payload,
            eventId,
            status: 'pending',
        });

        // Get user email
        const user = await User.findById(userId);
        if (user && user.email) {
            // Add to email queue
            emailQueue.add({
                notificationId: notification._id,
                to: user.email,
                type,
                payload,
            },{
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
            });
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:',error);
        // Don't throw error to prevent blocking main flow
    }
};

module.exports = { createNotification };
