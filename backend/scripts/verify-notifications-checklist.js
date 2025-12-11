const axios = require('axios');
const io = require('socket.io-client');
const mongoose = require('mongoose');

// Helper to wait
const delay = (ms) => new Promise(resolve => setTimeout(resolve,ms));

const API_URL = 'http://localhost:5000/api';

async function verifyNotificationChecklist() {
    console.log('📋 Starting Notification Checklist Verification...');

    try {
        await mongoose.connect('mongodb://localhost:27017/expense-tracker');
        const UserSchema = new mongoose.Schema({ email: String,emailVerified: Boolean },{ strict: false });
        // Use existing model name if possible or define temp
        const User = mongoose.models.User || mongoose.model('User',UserSchema);

        // 1. Setup Users
        const inviter = { name: 'Inviter Check',email: `inviter_${Date.now()}@test.com`,password: 'password123' };
        const recipient = { name: 'Recipient Check',email: `recipient_${Date.now()}@test.com`,password: 'password123' };

        // Register Inviter
        console.log('👤 Registering Inviter...');
        try {
            await axios.post(`${API_URL}/auth/register`,{ ...inviter,mobileNumber: '9999999999' });
        } catch (e) { console.log('Inviter register might have failed if exists, ignoring',e.message); }

        // Manually verify
        await User.updateOne({ email: inviter.email },{ $set: { emailVerified: true } });

        // Login Inviter
        const resA = await axios.post(`${API_URL}/auth/login`,{ email: inviter.email,password: inviter.password });
        const tokenA = resA.data.token;
        const inviterId = resA.data._id;

        // Register Recipient
        console.log('👤 Registering Recipient...');
        try {
            await axios.post(`${API_URL}/auth/register`,{ ...recipient,mobileNumber: '8888888888' });
        } catch (e) { console.log('Recipient register might have failed if exists, ignoring',e.message); }

        // Manually verify
        await User.updateOne({ email: recipient.email },{ $set: { emailVerified: true } });

        // Login Recipient
        const resB = await axios.post(`${API_URL}/auth/login`,{ email: recipient.email,password: recipient.password });
        const tokenB = resB.data.token;
        const recipientId = resB.data._id;

        console.log(`🆔 Inviter ID: ${inviterId}`);
        console.log(`🆔 Recipient ID: ${recipientId}`);

        // 2. Setup Socket for Recipient with TOKEN AUTH
        console.log('🔌 Connecting Recipient Socket with Token Auth...');
        const socketB = io('http://localhost:5000',{
            auth: { token: tokenB }
        });

        let socketNotifReceived = null;

        const socketConnected = new Promise((resolve) => {
            socketB.on('connect',() => {
                console.log('✅ Socket connected:',socketB.id);
                // Server auto-joins room based on token, no manual join needed
                resolve();
            });
        });

        const socketNotificationPromise = new Promise((resolve) => {
            socketB.on('notification:new',(data) => {
                console.log('🔔 Socket Notification Received:',data);
                socketNotifReceived = data;
                resolve(data);
            });
        });

        await socketConnected;

        // 3. Create Collaboration
        console.log('🤝 sending invite...');
        const inviteRes = await axios.post(`${API_URL}/collab/invite`,{ email: recipient.email },{
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        const collabId = inviteRes.data._id;

        // Accept invite to make it active so we can run settlement
        console.log('🤝 checking invite on recipient side...');
        // Wait minor delay for invite notif to propagate
        await delay(500);

        // Recipient accepts
        console.log('🤝 Recipient accepting invite...');
        await axios.post(`${API_URL}/collab/${collabId}/accept`,{},{
            headers: { Authorization: `Bearer ${tokenB}` }
        });

        // 4. Trigger Settlement (The Event to Verify)
        console.log('💸 Triggering Settlement Request (Inviter -> Recipient)...');
        // Clear previous catch
        const settlementRes = await axios.post(`${API_URL}/collab/${collabId}/settlement/request`,{
            amount: 50,
            method: 'UPI'
        },{
            headers: { Authorization: `Bearer ${tokenA}` }
        });

        console.log('✅ Settlement Request API returned success');

        // 5. Verify Checklist Items

        // A) Verify Socket Receipt (Real-time)
        console.log('⏳ Waiting for socket notification...');
        const receivedNotif = await Promise.race([
            socketNotificationPromise,
            delay(5000).then(() => null)
        ]);

        if (receivedNotif) {
            console.log('✅ CHECKPASSED: Socket notification received in real-time');
            // Check if backend sent populated object or just notification
            const receivedUserId = receivedNotif.userId._id || receivedNotif.userId; // handle populate if any

            if (receivedUserId.toString() === recipientId.toString()) {
                console.log('✅ CHECKPASSED: Notification.userId matches Recipient ID');
            } else {
                console.error(`❌ FAILURE: Notification.userId (${receivedUserId}) != Recipient ID (${recipientId})`);
            }
        } else {
            console.error('❌ FAILURE: Socket notification NOT received within 5s');
        }

        // B) Verify Database Persistence (API Fetch)
        console.log('🔍 Fetching Recipient Notifications via API...');
        const apiRes = await axios.get(`${API_URL}/notifications`,{
            headers: { Authorization: `Bearer ${tokenB}` }
        });

        const notifications = apiRes.data.notifications;
        // The endpoint sorts by createdAt desc, so first one should be it
        const settlementNotif = notifications.find(n => n.type === 'settlement_request');

        if (settlementNotif) {
            console.log('✅ CHECKPASSED: Notification persisted in DB and returned by API');
            console.log(`   ID: ${settlementNotif._id}`);
            console.log(`   Type: ${settlementNotif.type}`);

            if (settlementNotif.status === 'pending' || settlementNotif.status === 'sent') {
                console.log(`✅ CHECKPASSED: Status is ${settlementNotif.status}`);
            }

            // Verify idempotency
            console.log('🔄 Triggering SAME request again to check idempotency...');
            try {
                await axios.post(`${API_URL}/collab/${collabId}/settlement/request`,{
                    amount: 50,
                    method: 'UPI'
                },{
                    headers: { Authorization: `Bearer ${tokenA}` }
                });
            } catch (err) {
                console.log('ℹ️ Re-trigger result:',err.response ? err.response.data.message : 'Success');
            }

        } else {
            console.error('❌ FAILURE: Settlement notification NOT found in API response');
        }

        console.log('🏁 Verification Complete');
        if (receivedNotif && settlementNotif) {
            process.exit(0);
        } else {
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Script Error:',error.message);
        if (error.response) console.error('Response:',error.response.data);
        process.exit(1);
    }
}

verifyNotificationChecklist();
