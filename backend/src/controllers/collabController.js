const Collaboration = require('../models/Collaboration');
const CollabTransaction = require('../models/CollabTransaction');
const User = require('../models/User');
const mongoose = require('mongoose');
const { generateUniqueUsername } = require('../helpers/usernameHelper');
const {
    sendInvite,
    sendInviteResponse,
    sendSettlementRequest,
    sendSettlementPayment,
    createNotification
} = require('../services/notificationService');

// Send collaboration invite
exports.sendInvite = async (req,res) => {
    // req.user guaranteed
    const { email } = req.body;
    const inviterId = req.user.id;

    // Find the user to invite
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
        res.status(404);
        throw new Error('User not found with this email');
    }

    // Check if user is trying to invite themselves
    if (invitedUser._id.toString() === inviterId) {
        res.status(400);
        throw new Error('You cannot invite yourself');
    }

    // Check if collaboration already exists
    const existingCollab = await Collaboration.findOne({
        users: { $all: [inviterId,invitedUser._id] }
    });

    if (existingCollab) {
        // If collaboration was rejected, reset it to pending
        if (existingCollab.status === 'rejected') {
            existingCollab.status = 'pending';
            existingCollab.createdBy = inviterId;
            existingCollab.invitedUser = invitedUser._id;
            await existingCollab.save();

            await existingCollab.populate('users','name email mobileNumber');
            await existingCollab.populate('createdBy','name email');

            return res.status(200).json(existingCollab);
        }

        res.status(400);
        throw new Error(existingCollab.status === 'pending'
            ? 'Invitation already sent to this user'
            : 'Collaboration already exists with this user');
    }

    // Create new collaboration
    const collaboration = await Collaboration.create({
        users: [inviterId,invitedUser._id],
        createdBy: inviterId,
        invitedUser: invitedUser._id,
        status: 'pending'
    });

    await collaboration.populate('users','name email mobileNumber');
    await collaboration.populate('createdBy','name email');

    await sendInvite(req.user,invitedUser,collaboration);

    res.status(201).json(collaboration);
};

// Accept collaboration invite
exports.acceptInvite = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    // Check if user is the invited user
    if (collaboration.invitedUser.toString() !== userId) {
        res.status(403);
        throw new Error('You are not authorized to accept this invitation');
    }

    if (collaboration.status !== 'pending') {
        res.status(400);
        throw new Error('This invitation has already been processed');
    }

    collaboration.status = 'active';
    await collaboration.save();

    await collaboration.populate('users','name email mobileNumber');
    await collaboration.populate('createdBy','name email');

    await sendInviteResponse(req.user,collaboration.createdBy,collaboration,'accepted');

    res.json(collaboration);
};

// Reject collaboration invite
exports.rejectInvite = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    // Check if user is the invited user
    if (collaboration.invitedUser.toString() !== userId) {
        res.status(403);
        throw new Error('You are not authorized to reject this invitation');
    }

    if (collaboration.status !== 'pending') {
        res.status(400);
        throw new Error('This invitation has already been processed');
    }

    collaboration.status = 'rejected';
    await collaboration.save();

    await sendInviteResponse(req.user,collaboration.createdBy,collaboration,'rejected');

    res.json({ message: 'Invitation rejected' });
};

// Get all collaborations for current user
exports.getMyCollaborations = async (req,res) => {
    const userId = req.user.id;

    const collaborations = await Collaboration.find({
        users: userId
    })
        .populate('users','name email mobileNumber')
        .populate('createdBy','name email')
        .sort({ createdAt: -1 });

    // Check and clear expired requests
    const now = new Date();
    const updates = [];

    collaborations.forEach(collab => {
        if (collab.settlementRequest && collab.settlementRequest.requestedBy) {
            const requestedAt = new Date(collab.settlementRequest.requestedAt);
            const diffMs = now - requestedAt;
            if (diffMs >= 30 * 60 * 1000) { // 30 mins
                collab.settlementRequest = {
                    requestedBy: null,
                    requestedAt: null,
                    amount: 0,
                    method: 'UPI'
                };
                updates.push(collab.save());
            }
        }
    });

    if (updates.length > 0) {
        await Promise.all(updates);
    }

    res.json(collaborations);
};

// Get single collaboration details
exports.getCollaboration = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findById(id)
        .populate('users','name email mobileNumber')
        .populate('deletionRequest.requestedBy','name email')
        .populate('createdBy','name email');

    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    // Check if user is part of this collaboration
    const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
    if (!isParticipant) {
        res.status(403);
        throw new Error('You are not part of this collaboration');
    }

    // Check for expired settlement request (30 mins)
    if (collaboration.settlementRequest && collaboration.settlementRequest.requestedBy) {
        const requestedAt = new Date(collaboration.settlementRequest.requestedAt);
        const now = new Date();
        const diffMs = now - requestedAt;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins >= 30) {
            console.log(`⏳ Settlement request expired for collab ${id} (Age: ${diffMins} mins)`);
            collaboration.settlementRequest = {
                requestedBy: null,
                requestedAt: null,
                amount: 0,
                method: 'UPI'
            };
            await collaboration.save();
        }
    }

    res.json(collaboration);
};

// Add transaction
exports.addTransaction = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { amount,type,category,description,date } = req.body;

    // Verify collaboration exists and user is part of it
    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
    if (!isParticipant) {
        res.status(403);
        throw new Error('You are not part of this collaboration');
    }

    if (collaboration.status !== 'active') {
        res.status(400);
        throw new Error('Collaboration is not active');
    }

    const transaction = await CollabTransaction.create({
        collaborationId: id,
        userId,
        amount,
        type,
        category,
        description,
        date: date || new Date()
    });

    await transaction.populate('userId','name email');

    res.status(201).json(transaction);
};

// Get transactions
exports.getTransactions = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify collaboration exists and user is part of it
    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
    if (!isParticipant) {
        res.status(403);
        throw new Error('You are not part of this collaboration');
    }

    const { month } = req.query; // YYYY-MM

    let query = { collaborationId: id };
    if (month) {
        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        query.date = { $gte: startDate,$lt: endDate };
    }

    const transactions = await CollabTransaction.find(query)
        .populate('userId','name email')
        .sort({ date: -1,createdAt: -1 });

    res.json(transactions);
};

// Update transaction
exports.updateTransaction = async (req,res) => {
    const { id,transactionId } = req.params;
    const userId = req.user.id;
    const { amount,type,category,description,date } = req.body;

    // Verify collaboration
    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
    if (!isParticipant) {
        res.status(403);
        throw new Error('You are not part of this collaboration');
    }

    // Find transaction
    const transaction = await CollabTransaction.findOne({
        _id: transactionId,
        collaborationId: id
    });

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    // Only the transaction owner can update it
    if (transaction.userId.toString() !== userId) {
        res.status(403);
        throw new Error('You can only update your own transactions');
    }

    // Update fields
    if (amount !== undefined) transaction.amount = amount;
    if (type !== undefined) transaction.type = type;
    if (category !== undefined) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = date;

    await transaction.save();
    await transaction.populate('userId','name email');

    res.json(transaction);
};

// Delete transaction
exports.deleteTransaction = async (req,res) => {
    const { id,transactionId } = req.params;
    const userId = req.user.id;

    // Verify collaboration
    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
    if (!isParticipant) {
        res.status(403);
        throw new Error('You are not part of this collaboration');
    }

    // Find transaction
    const transaction = await CollabTransaction.findOne({
        _id: transactionId,
        collaborationId: id
    });

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    // Only the transaction owner can delete it
    if (transaction.userId.toString() !== userId) {
        res.status(403);
        throw new Error('You can only delete your own transactions');
    }

    await CollabTransaction.findByIdAndDelete(transactionId);

    res.json({ message: 'Transaction deleted successfully' });
};

// Get balance summary
exports.getBalanceSummary = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findById(id).populate('users','name email mobileNumber');
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    const { month } = req.query; // YYYY-MM

    const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
    if (!isParticipant) {
        res.status(403);
        throw new Error('You are not part of this collaboration');
    }

    let query = { collaborationId: id };
    if (month) {
        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        query.date = { $gte: startDate,$lt: endDate };
    }

    const transactions = await CollabTransaction.find(query);

    const userA = collaboration.users[0];
    const userB = collaboration.users[1];

    let userA_total_expense = 0;
    let userB_total_expense = 0;
    let userA_total_income = 0;
    let userB_total_income = 0;

    // Track settlement amounts separately
    let userA_settled_paid = 0;
    let userB_settled_paid = 0;
    let userA_settled_received = 0;
    let userB_settled_received = 0;

    transactions.forEach(t => {
        const tUserId = t.userId.toString();
        if (t.type === 'expense') {
            if (t.category === 'Settlement') {
                if (tUserId === userA._id.toString()) userA_settled_paid += t.amount;
                else userB_settled_paid += t.amount;
            } else {
                if (tUserId === userA._id.toString()) userA_total_expense += t.amount;
                else userB_total_expense += t.amount;
            }
        } else if (t.type === 'income') {
            if (t.category === 'Settlement Received') {
                if (tUserId === userA._id.toString()) userA_settled_received += t.amount;
                else userB_settled_received += t.amount;
            } else {
                if (tUserId === userA._id.toString()) userA_total_income += t.amount;
                else userB_total_income += t.amount;
            }
        }
    });

    const total_expense = userA_total_expense + userB_total_expense;
    const split_amount = total_expense / 2;

    let userA_balance = userA_total_expense - split_amount;
    // Apply settlements
    userA_balance = userA_balance + userA_settled_paid - userA_settled_received;
    userA_balance = Math.round(userA_balance * 100) / 100;

    let final_statement = 'Both are settled';
    let owedAmount = 0;

    if (Math.abs(userA_balance) > 0.01) {
        if (userA_balance > 0) {
            owedAmount = Math.abs(userA_balance);
            final_statement = `${userB.name} pays ${userA.name} ₹${owedAmount.toFixed(2)}`;
        } else {
            owedAmount = Math.abs(userA_balance);
            final_statement = `${userA.name} pays ${userB.name} ₹${owedAmount.toFixed(2)}`;
        }
    }

    res.json({
        userA: {
            id: userA._id,
            name: userA.name,
            total_expense: userA_total_expense,
            total_income: userA_total_income,
            balance: userA_balance
        },
        userB: {
            id: userB._id,
            name: userB.name,
            total_expense: userB_total_expense,
            total_income: userB_total_income,
            balance: -userA_balance
        },
        total_expense,
        split_amount,
        final_statement,
        owedAmount
    });
};

// Settle payment - creates settlement transactions
exports.settlePayment = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { payerId,receiverId,amount,method,reason } = req.body;

    // Validate input
    if (!payerId || !receiverId || !amount || !method) {
        res.status(400);
        throw new Error('Missing required fields');
    }

    if (amount <= 0) {
        res.status(400);
        throw new Error('Amount must be positive');
    }

    if (!['UPI','Cash'].includes(method)) {
        res.status(400);
        throw new Error('Invalid payment method');
    }

    // Get collaboration
    const collaboration = await Collaboration.findById(id).populate('users','name email mobileNumber');
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    if (collaboration.status !== 'active') {
        res.status(400);
        throw new Error('Collaboration is not active');
    }

    // Verify requester is the payer
    if (payerId !== userId) {
        res.status(403);
        throw new Error('You can only make payments on your own behalf');
    }

    // Verify both users are part of the collaboration
    const isPayerParticipant = collaboration.users.some(user => user._id.toString() === payerId);
    const isReceiverParticipant = collaboration.users.some(user => user._id.toString() === receiverId);

    if (!isPayerParticipant || !isReceiverParticipant) {
        res.status(400);
        throw new Error('Invalid payer or receiver');
    }

    // Check for duplicate settlement (idempotency)
    // Look for any recent settlement from this payer within last 5 seconds
    const existingSettlement = await CollabTransaction.findOne({
        collaborationId: id,
        userId: payerId,
        category: 'Settlement',
        createdAt: { $gte: new Date(Date.now() - 5000) } // Within last 5 seconds
    });

    if (existingSettlement) {
        res.status(400);
        throw new Error('Duplicate payment detected. Please wait before trying again.');
    }

    // Create two transactions
    const currentDate = new Date();

    // 1. Expense transaction for payer
    const payerTransaction = await CollabTransaction.create({
        collaborationId: id,
        userId: payerId,
        amount: amount,
        type: 'expense',
        category: 'Settlement',
        description: `Settlement payment via ${method}`,
        date: currentDate
    });

    // 2. Income transaction for receiver
    const receiverTransaction = await CollabTransaction.create({
        collaborationId: id,
        userId: receiverId,
        amount: amount,
        type: 'income',
        category: 'Settlement Received',
        description: `Settlement received via ${method}`,
        date: currentDate
    });

    // Get updated balance summary (Reuse logic from getBalanceSummary)
    const transactions = await CollabTransaction.find({ collaborationId: id });

    const userA = collaboration.users[0];
    const userB = collaboration.users[1];

    let userA_total_expense = 0;
    let userB_total_expense = 0;
    let userA_total_income = 0;
    let userB_total_income = 0;

    // Track settlement amounts separately
    let userA_settled_paid = 0;
    let userB_settled_paid = 0;
    let userA_settled_received = 0;
    let userB_settled_received = 0;

    transactions.forEach(t => {
        const tUserId = t.userId.toString();
        if (t.type === 'expense') {
            if (t.category === 'Settlement') {
                if (tUserId === userA._id.toString()) userA_settled_paid += t.amount;
                else userB_settled_paid += t.amount;
            } else {
                if (tUserId === userA._id.toString()) userA_total_expense += t.amount;
                else userB_total_expense += t.amount;
            }
        } else if (t.type === 'income') {
            if (t.category === 'Settlement Received') {
                if (tUserId === userA._id.toString()) userA_settled_received += t.amount;
                else userB_settled_received += t.amount;
            } else {
                if (tUserId === userA._id.toString()) userA_total_income += t.amount;
                else userB_total_income += t.amount;
            }
        }
    });

    const total_expense = userA_total_expense + userB_total_expense;
    const split_amount = total_expense / 2;

    let userA_balance = userA_total_expense - split_amount;
    userA_balance = userA_balance + userA_settled_paid - userA_settled_received;
    userA_balance = Math.round(userA_balance * 100) / 100;

    let final_statement = 'Both are settled';
    let owedAmount = 0;

    if (Math.abs(userA_balance) > 0.01) {
        if (userA_balance > 0) {
            owedAmount = Math.abs(userA_balance);
            final_statement = `${userB.name} pays ${userA.name} ₹${owedAmount.toFixed(2)}`;
        } else {
            owedAmount = Math.abs(userA_balance);
            final_statement = `${userA.name} pays ${userB.name} ₹${owedAmount.toFixed(2)}`;
        }
    }

    res.json({
        message: 'Payment settled successfully',
        transactions: [payerTransaction,receiverTransaction],
        balance: {
            userA: {
                id: userA._id,
                name: userA.name,
                total_expense: userA_total_expense,
                total_income: userA_total_income,
                balance: userA_balance
            },
            userB: {
                id: userB._id,
                name: userB.name,
                total_expense: userB_total_expense,
                total_income: userB_total_income,
                balance: -userA_balance
            },
            total_expense,
            split_amount,
            final_statement,
            owedAmount
        }
    });

    // [PATCH] Handle Settlement Request Logic (Partial/Full)
    if (collaboration.settlementRequest && collaboration.settlementRequest.requestedBy) {
        const originalRequestedAmount = collaboration.settlementRequest.amount;
        const isPartial = amount < originalRequestedAmount;

        // Requirement: Always clear request so "Request" button appears for pending amount
        collaboration.settlementRequest = {
            requestedBy: null,
            requestedAt: null,
            amount: 0,
            method: 'UPI'
        };

        // Delete the notification for the payer
        const Notification = require('../models/Notification');
        await Notification.findOneAndDelete({
            userId: payerId,
            payload: { $elemMatch: { settlementId: collaboration._id } }
        }).catch(err => console.error("Failed to delete notification",err));

        // Also try alternative query if payload structure differs
        await Notification.findOneAndDelete({
            userId: payerId,
            type: 'SETTLEMENT_REQUEST',
            'payload.settlementId': collaboration._id
        }).catch(err => console.error("Failed to delete notification alt",err));

        await collaboration.save();
    }

    await sendSettlementPayment(req.user,receiverId,collaboration,amount,reason);
};

// Request deletion
exports.requestDeletion = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    const isParticipant = collaboration.users.some(user => user.toString() === userId);
    if (!isParticipant) {
        res.status(403);
        throw new Error('You are not part of this collaboration');
    }

    if (collaboration.status !== 'active') {
        res.status(400);
        throw new Error('Only active collaborations can be deleted');
    }

    if (collaboration.deletionRequest.requestedBy) {
        res.status(400);
        throw new Error('Deletion already requested for this collaboration');
    }

    collaboration.deletionRequest = {
        requestedBy: userId,
        requestedAt: new Date()
    };
    await collaboration.save();

    await collaboration.populate('users','name email mobileNumber');
    await collaboration.populate('deletionRequest.requestedBy','name email');

    // Notify other user
    const otherUser = collaboration.users.find(u => u._id.toString() !== userId);
    if (otherUser) {
        await createNotification(
            otherUser._id,
            collaboration._id,
            'COLLAB_DELETE_REQUEST',
            {
                requesterName: req.user.name,
                collabName: collaboration.name,
                collabId: collaboration._id
            },
            `delete_request_${collaboration._id}_${Date.now()}`
        );
    }

    res.json(collaboration);
};

// Accept deletion
exports.acceptDeletion = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    const isParticipant = collaboration.users.some(user => user.toString() === userId);
    if (!isParticipant) {
        res.status(403);
        throw new Error('You are not part of this collaboration');
    }

    if (!collaboration.deletionRequest.requestedBy) {
        res.status(400);
        throw new Error('No deletion request found for this collaboration');
    }

    if (collaboration.deletionRequest.requestedBy.toString() === userId) {
        res.status(403);
        throw new Error('You cannot accept your own deletion request');
    }

    await CollabTransaction.deleteMany({ collaborationId: id });
    await Collaboration.findByIdAndDelete(id);

    // Notify requester
    const requesterId = collaboration.deletionRequest.requestedBy;
    if (requesterId) {
        await createNotification(
            requesterId,
            id, // collabId (even if deleted, we can keep reference or null)
            'COLLAB_DELETED',
            {
                collabName: collaboration.name,
                collabId: id
            },
            `collab_deleted_${id}_${Date.now()}`
        );
    }

    res.json({ message: 'Collaboration deleted successfully' });
};

// Reject deletion
exports.rejectDeletion = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    const isParticipant = collaboration.users.some(user => user.toString() === userId);
    if (!isParticipant) {
        res.status(403);
        throw new Error('You are not part of this collaboration');
    }

    if (!collaboration.deletionRequest.requestedBy) {
        res.status(400);
        throw new Error('No deletion request found for this collaboration');
    }

    if (collaboration.deletionRequest.requestedBy.toString() === userId) {
        res.status(403);
        throw new Error('You cannot reject your own deletion request');
    }

    const requesterId = collaboration.deletionRequest.requestedBy;

    collaboration.deletionRequest = {
        requestedBy: null,
        requestedAt: null
    };
    await collaboration.save();

    await collaboration.populate('users','name email mobileNumber');

    // Notify requester
    if (requesterId) {
        await createNotification(
            requesterId,
            collaboration._id,
            'COLLAB_DELETE_REJECTED',
            {
                collabName: collaboration.name,
                collabId: collaboration._id
            },
            `delete_rejected_${collaboration._id}_${Date.now()}`
        );
    }


    res.json(collaboration);
};


// Request settlement payment
exports.requestSettlement = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { amount,method } = req.body;

    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Invalid amount');
    }

    if (!['UPI','Cash'].includes(method)) {
        res.status(400);
        throw new Error('Invalid payment method');
    }

    const collaboration = await Collaboration.findById(id).populate('users','name email mobileNumber');
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
    if (!isParticipant) {
        res.status(403);
        throw new Error('You are not part of this collaboration');
    }

    if (collaboration.status !== 'active') {
        res.status(400);
        throw new Error('Collaboration is not active');
    }

    if (collaboration.settlementRequest && collaboration.settlementRequest.requestedBy) {
        res.status(400);
        throw new Error('Settlement request already pending');
    }

    // Identify other user BEFORE saving (to avoid any population issues)
    const otherUser = collaboration.users.find(u => u._id.toString() !== userId);
    console.log(`💸 Settlement Request: Requester=${userId}, OtherUser=${otherUser?._id}`);

    collaboration.settlementRequest = {
        requestedBy: userId,
        requestedAt: new Date(),
        amount,
        method
    };
    await collaboration.save();

    if (otherUser) {
        console.log(`🔔 Triggering notification for user ${otherUser._id}`);
        // [PATCH] Trigger settlement capability notification
        await sendSettlementRequest({
            requesterId: req.user._id,
            requesterName: req.user.name,
            payerId: otherUser._id,
            amount: amount,
            settlementId: collaboration._id,
            appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
            emitter: req.app.get('io')
        });
    } else {
        console.error('❌ Could not find other user to notify');
    }

    res.json(collaboration);
};

// Accept settlement request (Pay)
exports.acceptSettlementRequest = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findById(id).populate('users','name email mobileNumber');
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
    if (!isParticipant) {
        res.status(403);
        throw new Error('You are not part of this collaboration');
    }

    if (!collaboration.settlementRequest || !collaboration.settlementRequest.requestedBy) {
        res.status(400);
        throw new Error('No settlement request found');
    }

    if (collaboration.settlementRequest.requestedBy.toString() === userId) {
        res.status(403);
        throw new Error('You cannot accept your own settlement request');
    }

    const { amount,method } = collaboration.settlementRequest;
    const receiverId = collaboration.settlementRequest.requestedBy.toString();
    const payerId = userId;

    // Create settlement transactions
    const currentDate = new Date();

    await CollabTransaction.create({
        collaborationId: id,
        userId: payerId,
        amount: amount,
        type: 'expense',
        category: 'Settlement',
        description: `Settlement payment via ${method}`,
        date: currentDate
    });

    await CollabTransaction.create({
        collaborationId: id,
        userId: receiverId,
        amount: amount,
        type: 'income',
        category: 'Settlement Received',
        description: `Settlement received via ${method}`,
        date: currentDate
    });

    // Clear the settlement request
    collaboration.settlementRequest = {
        requestedBy: null,
        requestedAt: null,
        amount: 0,
        method: 'UPI'
    };
    await collaboration.save();

    await collaboration.populate('users','name email mobileNumber');

    if (receiverId) {
        await sendSettlementPayment(req.user,receiverId,collaboration,amount);
    }

    res.json({ message: 'Settlement completed successfully',collaboration });
};

// Reject settlement request (Cancel)
exports.rejectSettlementRequest = async (req,res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
        res.status(404);
        throw new Error('Collaboration not found');
    }

    const isParticipant = collaboration.users.some(user => user.toString() === userId);
    if (!isParticipant) {
        res.status(403);
        throw new Error('You are not part of this collaboration');
    }

    if (!collaboration.settlementRequest || !collaboration.settlementRequest.requestedBy) {
        res.status(400);
        throw new Error('No settlement request found');
    }

    if (collaboration.settlementRequest.requestedBy.toString() === userId) {
        res.status(403);
        throw new Error('You cannot reject your own settlement request');
    }

    collaboration.settlementRequest = {
        requestedBy: null,
        requestedAt: null,
        amount: 0,
        method: 'UPI'
    };
    await collaboration.save();

    await collaboration.populate('users','name email');

    res.json(collaboration);
};
