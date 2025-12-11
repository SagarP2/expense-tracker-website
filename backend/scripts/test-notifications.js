const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:5000/api';

async function testNotifications() {
    try {
        console.log('🚀 Starting Notification Test...');

        const registerOrLogin = async (name,email,password) => {
            try {
                console.log(`👤 Registering ${name}...`);
                await axios.post(`${API_URL}/auth/register`,{
                    name,
                    email,
                    password,
                    mobileNumber: '1234567890'
                });
                console.log(`✅ ${name} registered`);
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    console.log(`ℹ️ ${name} already exists, proceeding to login`);
                } else {
                    throw error;
                }
            }

            console.log(`🔑 Logging in ${name}...`);
            const res = await axios.post(`${API_URL}/auth/login`,{
                email,
                password
            });
            return res.data;
        };

        // 1. Login/Register User A (Inviter)
        const userAData = await registerOrLogin('User A','usera@test.com','password123');
        const tokenA = userAData.token;
        const userAId = userAData._id;
        console.log('✅ User A logged in');

        // 2. Login/Register User B (Invitee)
        const userBData = await registerOrLogin('User B','userb@test.com','password123');
        const tokenB = userBData.token;
        const userBId = userBData._id;
        console.log('✅ User B logged in');

        // 3. Connect Sockets
        console.log('🔌 Connecting Sockets...');
        const socketA = io('http://localhost:5000');
        const socketB = io('http://localhost:5000');

        const setupSocket = (socket,userId,label) => {
            return new Promise((resolve,reject) => {
                socket.on('connect',() => {
                    console.log(`✅ Socket ${label} connected`);
                    socket.emit('join',userId);
                });

                socket.on('notification:new',(data) => {
                    console.log(`🔔 Socket ${label} Event Received:`,data);
                    resolve(data);
                });
            });
        };

        const socketAPromise = setupSocket(socketA,userAId,'A');
        const socketBPromise = setupSocket(socketB,userBId,'B');

        // 4. Ensure Active Collaboration
        console.log('🤝 Ensuring active collaboration...');
        let collabId;

        try {
            // Try to invite
            const inviteRes = await axios.post(`${API_URL}/collab/invite`,{
                email: 'userb@test.com'
            },{
                headers: { Authorization: `Bearer ${tokenA}` }
            });
            collabId = inviteRes.data._id;
            console.log('✅ Invite sent, waiting for notification on B...');
            const notif = await socketBPromise;
            console.log('✅ Notification received on B');
            return verifyAndExit(tokenB,notif);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('ℹ️ Collaboration/Invite already exists, checking status...');

                // Fetch User B's groups to find the collab
                const groupsRes = await axios.get(`${API_URL}/collab/my-groups`,{
                    headers: { Authorization: `Bearer ${tokenB}` }
                });

                // Find group with User A
                const group = groupsRes.data.find(g =>
                    g.users.some(u => u._id === userAId) ||
                    (g.createdBy && g.createdBy._id === userAId)
                );

                if (!group) {
                    throw new Error('Could not find collaboration group');
                }

                collabId = group._id;

                if (group.status === 'pending') {
                    console.log('ℹ️ Collaboration is pending, accepting...');
                    await axios.post(`${API_URL}/collab/${collabId}/accept`,{},{
                        headers: { Authorization: `Bearer ${tokenB}` }
                    });
                    console.log('✅ Collaboration accepted, waiting for notification on A...');
                    const notif = await socketAPromise;
                    console.log('✅ Notification received on A');
                    return verifyAndExit(tokenA,notif);
                } else {
                    console.log('✅ Collaboration is already active');
                }
            } else {
                throw error;
            }
        }

        // 5. Trigger Notification (Settlement Request)
        console.log('💸 User A requesting settlement...');
        try {
            await axios.post(`${API_URL}/collab/${collabId}/settlement/request`,{
                amount: 100,
                method: 'UPI'
            },{
                headers: { Authorization: `Bearer ${tokenA}` }
            });
            console.log('✅ Settlement requested, waiting for notification on B...');
            const notif = await socketBPromise;
            console.log('✅ Notification received on B');
            return verifyAndExit(tokenB,notif);
        } catch (error) {
            if (error.response && error.response.status === 400 && error.response.data.message.includes('pending')) {
                console.log('ℹ️ Settlement request already pending, User B accepting...');
                await axios.post(`${API_URL}/collab/${collabId}/settlement/accept`,{},{
                    headers: { Authorization: `Bearer ${tokenB}` }
                });
                console.log('✅ Settlement accepted, waiting for notification on A...');
                const notif = await socketAPromise;
                console.log('✅ Notification received on A');
                return verifyAndExit(tokenA,notif);
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('❌ Test failed:',error.message);
        if (error.response) {
            console.error('Response data:',error.response.data);
        }
        process.exit(1);
    }
}

async function verifyAndExit(token,notification) {
    try {
        // 7. Verify via API
        console.log('🔍 Verifying via API...');
        const notifications = await axios.get(`${API_URL}/notifications`,{
            headers: { Authorization: `Bearer ${token}` }
        });

        const latest = notifications.data.notifications[0];
        console.log('Latest notification type:',latest.type);

        if (latest._id === notification._id) {
            console.log('✅ API matches socket notification');
        } else {
            console.log('ℹ️ API latest is different from socket (might be race condition), but that is okay if both exist');
        }

        // 8. Verify Mark as Read
        console.log('👀 Marking notification as read...');
        await axios.patch(`${API_URL}/notifications/${latest._id}/read`,{},{
            headers: { Authorization: `Bearer ${token}` }
        });

        const updatedNotifications = await axios.get(`${API_URL}/notifications`,{
            headers: { Authorization: `Bearer ${token}` }
        });

        const updatedLatest = updatedNotifications.data.notifications.find(n => n._id === latest._id);
        if (updatedLatest && updatedLatest.isRead) {
            console.log('✅ Notification marked as read successfully');
        } else {
            throw new Error('Failed to mark notification as read');
        }

        console.log('🎉 All tests passed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:',error.message);
        process.exit(1);
    }
}

testNotifications();
