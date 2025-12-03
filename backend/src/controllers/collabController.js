const Collaboration = require('../models/Collaboration');
const CollabTransaction = require('../models/CollabTransaction');
const User = require('../models/User');
const mongoose = require('mongoose');

// Send collaboration invite
exports.sendInvite = async (req,res) => {
    try {
        const { email } = req.body;
        const inviterId = req.user.id;

        // Find the user to invite
        const invitedUser = await User.findOne({ email });
        if (!invitedUser) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Check if user is trying to invite themselves
        if (invitedUser._id.toString() === inviterId) {
            return res.status(400).json({ message: 'You cannot invite yourself' });
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

            return res.status(400).json({
                message: existingCollab.status === 'pending'
                    ? 'Invitation already sent to this user'
                    : 'Collaboration already exists with this user'
            });
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

        const { createNotification } = require('../services/notificationService');
        await createNotification(
            invitedUser._id,
            collaboration._id,
            'invite_received',
            {
                collabName: 'New Collaboration', // Ideally get name if available
                inviterName: req.user.name,
                collabId: collaboration._id
            },
            `invite_received_${collaboration._id}`
        );

        res.status(201).json(collaboration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Accept collaboration invite
exports.acceptInvite = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collaboration = await Collaboration.findById(id);
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        // Check if user is the invited user
        if (collaboration.invitedUser.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to accept this invitation' });
        }

        if (collaboration.status !== 'pending') {
            return res.status(400).json({ message: 'This invitation has already been processed' });
        }

        collaboration.status = 'active';
        await collaboration.save();

        await collaboration.populate('users','name email mobileNumber');
        await collaboration.populate('createdBy','name email');

        const { createNotification } = require('../services/notificationService');
        await createNotification(
            collaboration.createdBy._id,
            collaboration._id,
            'invite_response',
            {
                collabName: 'Collaboration',
                userName: req.user.name,
                status: 'accepted',
                collabId: collaboration._id
            },
            `invite_accepted_${collaboration._id}`
        );

        res.json(collaboration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reject collaboration invite
exports.rejectInvite = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collaboration = await Collaboration.findById(id);
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        // Check if user is the invited user
        if (collaboration.invitedUser.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to reject this invitation' });
        }

        if (collaboration.status !== 'pending') {
            return res.status(400).json({ message: 'This invitation has already been processed' });
        }

        collaboration.status = 'rejected';
        await collaboration.save();

        const { createNotification } = require('../services/notificationService');
        await createNotification(
            collaboration.createdBy,
            collaboration._id,
            'invite_response',
            {
                collabName: 'Collaboration',
                userName: req.user.name,
                status: 'rejected',
                collabId: collaboration._id
            },
            `invite_rejected_${collaboration._id}`
        );

        res.json({ message: 'Invitation rejected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all collaborations for current user
exports.getMyCollaborations = async (req,res) => {
    try {
        const userId = req.user.id;

        const collaborations = await Collaboration.find({
            users: userId
        })
            .populate('users','name email mobileNumber')
            .populate('createdBy','name email')
            .populate('deletionRequest.requestedBy','name email')
            .sort({ createdAt: -1 });

        res.json(collaborations);
    } catch (error) {
        console.error('getMyCollaborations error:',error);
        res.status(500).json({ message: error.message });
    }
};

// Get single collaboration details
exports.getCollaboration = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collaboration = await Collaboration.findById(id)
            .populate('users','name email mobileNumber')
            .populate('createdBy','name email')
            .populate('deletionRequest.requestedBy','name email');

        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        // Check if user is part of this collaboration
        const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        res.json(collaboration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add transaction
exports.addTransaction = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { amount,type,category,description,date } = req.body;

        // Verify collaboration exists and user is part of it
        const collaboration = await Collaboration.findById(id);
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        if (collaboration.status !== 'active') {
            return res.status(400).json({ message: 'Collaboration is not active' });
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
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get transactions
exports.getTransactions = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify collaboration exists and user is part of it
        const collaboration = await Collaboration.findById(id);
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
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
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update transaction
exports.updateTransaction = async (req,res) => {
    try {
        const { id,transactionId } = req.params;
        const userId = req.user.id;
        const { amount,type,category,description,date } = req.body;

        // Verify collaboration
        const collaboration = await Collaboration.findById(id);
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        // Find transaction
        const transaction = await CollabTransaction.findOne({
            _id: transactionId,
            collaborationId: id
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Only the transaction owner can update it
        if (transaction.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You can only update your own transactions' });
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
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete transaction
exports.deleteTransaction = async (req,res) => {
    try {
        const { id,transactionId } = req.params;
        const userId = req.user.id;

        // Verify collaboration
        const collaboration = await Collaboration.findById(id);
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        // Find transaction
        const transaction = await CollabTransaction.findOne({
            _id: transactionId,
            collaborationId: id
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Only the transaction owner can delete it
        if (transaction.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You can only delete your own transactions' });
        }

        await CollabTransaction.findByIdAndDelete(transactionId);

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get balance summary
exports.getBalanceSummary = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collaboration = await Collaboration.findById(id).populate('users','name email mobileNumber');
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        const { month } = req.query; // YYYY-MM

        const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
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
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Settle payment - creates settlement transactions
exports.settlePayment = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { payerId,receiverId,amount,method } = req.body;

        // Validate input
        if (!payerId || !receiverId || !amount || !method) {
            throw new Error('Missing required fields');
        }

        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        if (!['UPI','Cash'].includes(method)) {
            throw new Error('Invalid payment method');
        }

        // Get collaboration
        const collaboration = await Collaboration.findById(id).populate('users','name email mobileNumber');
        if (!collaboration) {
            throw new Error('Collaboration not found');
        }

        if (collaboration.status !== 'active') {
            throw new Error('Collaboration is not active');
        }

        // Verify requester is the payer
        if (payerId !== userId) {
            throw new Error('You can only make payments on your own behalf');
        }

        // Verify both users are part of the collaboration
        const isPayerParticipant = collaboration.users.some(user => user._id.toString() === payerId);
        const isReceiverParticipant = collaboration.users.some(user => user._id.toString() === receiverId);

        if (!isPayerParticipant || !isReceiverParticipant) {
            throw new Error('Invalid payer or receiver');
        }

        // Check for duplicate settlement (idempotency)
        const existingSettlement = await CollabTransaction.findOne({
            collaborationId: id,
            userId: payerId,
            category: 'Settlement',
            amount: amount,
            createdAt: { $gte: new Date(Date.now() - 60000) } // Within last minute
        });

        if (existingSettlement) {
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

        const { createNotification } = require('../services/notificationService');
        await createNotification(
            receiverId,
            id,
            'settlement_paid',
            {
                payerName: req.user.name,
                amount: amount,
                collabId: id
            },
            `settlement_paid_${id}_${Date.now()}`
        );
    } catch (error) {
        console.error('Settlement payment error:',error);
        res.status(400).json({ message: error.message });
    }
};

// Request collaboration deletion
exports.requestDeletion = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collaboration = await Collaboration.findById(id);
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        const isParticipant = collaboration.users.some(user => user.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        if (collaboration.status !== 'active') {
            return res.status(400).json({ message: 'Only active collaborations can be deleted' });
        }

        if (collaboration.deletionRequest.requestedBy) {
            return res.status(400).json({ message: 'Deletion already requested for this collaboration' });
        }

        collaboration.deletionRequest = {
            requestedBy: userId,
            requestedAt: new Date()
        };
        await collaboration.save();

        await collaboration.populate('users','name email mobileNumber');
        await collaboration.populate('deletionRequest.requestedBy','name email');

        res.json(collaboration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Accept collaboration deletion
exports.acceptDeletion = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collaboration = await Collaboration.findById(id);
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        const isParticipant = collaboration.users.some(user => user.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        if (!collaboration.deletionRequest.requestedBy) {
            return res.status(400).json({ message: 'No deletion request found for this collaboration' });
        }

        if (collaboration.deletionRequest.requestedBy.toString() === userId) {
            return res.status(403).json({ message: 'You cannot accept your own deletion request' });
        }

        await CollabTransaction.deleteMany({ collaborationId: id });
        await Collaboration.findByIdAndDelete(id);

        res.json({ message: 'Collaboration deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reject collaboration deletion
exports.rejectDeletion = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collaboration = await Collaboration.findById(id);
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        const isParticipant = collaboration.users.some(user => user.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        if (!collaboration.deletionRequest.requestedBy) {
            return res.status(400).json({ message: 'No deletion request found for this collaboration' });
        }

        if (collaboration.deletionRequest.requestedBy.toString() === userId) {
            return res.status(403).json({ message: 'You cannot reject your own deletion request' });
        }

        collaboration.deletionRequest = {
            requestedBy: null,
            requestedAt: null
        };
        await collaboration.save();

        await collaboration.populate('users','name email mobileNumber');

        const { createNotification } = require('../services/notificationService');
        const requester = collaboration.settlementRequest.requestedBy;
        if (requester) {
            await createNotification(
                requester,
                collaboration._id,
                'settlement_response',
                {
                    status: 'rejected',
                    collabId: collaboration._id
                },
                `settlement_rejected_${collaboration._id}_${Date.now()}`
            );
        }

        res.json(collaboration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Request settlement payment
exports.requestSettlement = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { amount,method } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        if (!['UPI','Cash'].includes(method)) {
            return res.status(400).json({ message: 'Invalid payment method' });
        }

        const collaboration = await Collaboration.findById(id).populate('users','name email mobileNumber');
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        if (collaboration.status !== 'active') {
            return res.status(400).json({ message: 'Collaboration is not active' });
        }

        if (collaboration.settlementRequest.requestedBy) {
            return res.status(400).json({ message: 'Settlement request already pending' });
        }

        collaboration.settlementRequest = {
            requestedBy: userId,
            requestedAt: new Date(),
            amount,
            method
        };
        await collaboration.save();

        await collaboration.populate('settlementRequest.requestedBy','name email');

        const { createNotification } = require('../services/notificationService');
        const otherUser = collaboration.users.find(u => u._id.toString() !== userId);
        if (otherUser) {
            await createNotification(
                otherUser._id,
                collaboration._id,
                'settlement_request',
                {
                    requesterName: req.user.name,
                    amount: amount,
                    collabId: collaboration._id
                },
                `settlement_request_${collaboration._id}_${Date.now()}`
            );
        }

        res.json(collaboration);
    } catch (error) {
        console.error('requestSettlement error:',error);
        res.status(500).json({ message: error.message });
    }
};

// Accept settlement request (Pay)
exports.acceptSettlementRequest = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collaboration = await Collaboration.findById(id).populate('users','name email mobileNumber');
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        if (!collaboration.settlementRequest.requestedBy) {
            return res.status(400).json({ message: 'No settlement request found' });
        }

        if (collaboration.settlementRequest.requestedBy.toString() === userId) {
            return res.status(403).json({ message: 'You cannot accept your own settlement request' });
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

        const { createNotification } = require('../services/notificationService');
        if (receiverId) {
            await createNotification(
                receiverId,
                collaboration._id,
                'settlement_paid',
                {
                    payerName: req.user.name,
                    amount: amount,
                    collabId: collaboration._id
                },
                `settlement_paid_${collaboration._id}_${Date.now()}`
            );
        }

        res.json({ message: 'Settlement completed successfully',collaboration });
    } catch (error) {
        console.error('acceptSettlementRequest error:',error);
        res.status(500).json({ message: error.message });
    }
};

// Reject settlement request (Cancel)
exports.rejectSettlementRequest = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collaboration = await Collaboration.findById(id);
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        const isParticipant = collaboration.users.some(user => user.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        if (!collaboration.settlementRequest.requestedBy) {
            return res.status(400).json({ message: 'No settlement request found' });
        }

        if (collaboration.settlementRequest.requestedBy.toString() === userId) {
            return res.status(403).json({ message: 'You cannot reject your own settlement request' });
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
    } catch (error) {
        console.error('rejectSettlementRequest error:',error);
        res.status(500).json({ message: error.message });
    }
};
