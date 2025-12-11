// Run with: node src/scripts/test-notification.js
require('dotenv').config();
const mongoose = require('mongoose');
const { createNotification } = require('../services/notificationService');

// Mock Socket.IO
global.io = {
    to: (room) => ({
        emit: (event,data) => console.log(`[MockSocket] Emitted to ${room}: ${event}`,data.type)
    })
};

const testNotification = async () => {
    try {
        console.log('🔌 Connecting to DB...');
        if (!process.env.MONGO_URI) {
            console.error('❌ MONGO_URI is missing in .env');
            return;
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // logic to find a user or create dummy
        // For safety, we just try to notify a random ID, it will fail email but pass DB creation if model allows
        // Better: require a valid user ID as arg
        const userId = process.argv[2];
        if (!userId) {
            console.warn('⚠️ No user ID provided. Usage: node src/scripts/test-notification.js <USER_ID>');
            console.warn('   Will try with a dummy ID (email will likely fail lookup)');
        }

        const targetId = userId || new mongoose.Types.ObjectId();
        const collabId = new mongoose.Types.ObjectId();

        console.log('🚀 Triggering Notification...');
        const result = await createNotification(
            targetId,
            collabId,
            'settlement_request',
            { requesterName: 'TestUser',amount: 999,collabId },
            `test_event_${Date.now()}`
        );

        if (result) {
            console.log('✅ Notification Flow Successful (DB + Socket). Check logs for Email status.');
            console.log('📝 Result ID:',result._id);
        } else {
            console.error('❌ Notification Flow Failed (returned null)');
        }

    } catch (err) {
        console.error('❌ Test Script Error:',err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

testNotification();
