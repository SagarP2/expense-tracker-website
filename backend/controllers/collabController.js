const Collaboration = require('../models/Collaboration');
const CollabTransaction = require('../models/CollabTransaction');
const User = require('../models/User');

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

        await collaboration.populate('users','name email');
        await collaboration.populate('createdBy','name email');

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

        await collaboration.populate('users','name email');
        await collaboration.populate('createdBy','name email');

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
            .populate('users','name email')
            .populate('createdBy','name email')
            .sort({ createdAt: -1 });

        res.json(collaborations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single collaboration details
exports.getCollaboration = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collaboration = await Collaboration.findById(id)
            .populate('users','name email')
            .populate('createdBy','name email');

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

// Add transaction to collaboration
exports.addTransaction = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { amount,type,category,description,date } = req.body;

        const collaboration = await Collaboration.findById(id);
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        if (collaboration.status !== 'active') {
            return res.status(400).json({ message: 'Collaboration is not active' });
        }

        // Check if user is part of this collaboration
        const isParticipant = collaboration.users.some(user => user.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        const transaction = await CollabTransaction.create({
            collaborationId: id,
            userId,
            amount,
            type,
            category,
            description,
            date: date || Date.now()
        });

        await transaction.populate('userId','name email');

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all transactions for a collaboration
exports.getTransactions = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collaboration = await Collaboration.findById(id);
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        // Check if user is part of this collaboration
        const isParticipant = collaboration.users.some(user => user.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        const transactions = await CollabTransaction.find({ collaborationId: id })
            .populate('userId','name email')
            .sort({ date: -1 });

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

        const transaction = await CollabTransaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Check if user is the owner of this transaction
        if (transaction.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You can only edit your own transactions' });
        }

        transaction.amount = amount;
        transaction.type = type;
        transaction.category = category;
        transaction.description = description;
        transaction.date = date;

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

        const transaction = await CollabTransaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Check if user is the owner of this transaction
        if (transaction.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You can only delete your own transactions' });
        }

        await CollabTransaction.findByIdAndDelete(transactionId);

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get balance summary for a collaboration
exports.getBalanceSummary = async (req,res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collaboration = await Collaboration.findById(id).populate('users','name email');
        if (!collaboration) {
            return res.status(404).json({ message: 'Collaboration not found' });
        }

        // Check if user is part of this collaboration
        const isParticipant = collaboration.users.some(user => user._id.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not part of this collaboration' });
        }

        const transactions = await CollabTransaction.find({ collaborationId: id });

        // Calculate totals for each user
        const userA = collaboration.users[0];
        const userB = collaboration.users[1];

        let userA_total_expense = 0;
        let userB_total_expense = 0;
        let userA_total_income = 0;
        let userB_total_income = 0;

        transactions.forEach(t => {
            if (t.userId.toString() === userA._id.toString()) {
                if (t.type === 'expense') userA_total_expense += t.amount;
                else userA_total_income += t.amount;
            } else {
                if (t.type === 'expense') userB_total_expense += t.amount;
                else userB_total_income += t.amount;
            }
        });

        const total_expense = userA_total_expense + userB_total_expense;
        const total_income = userA_total_income + userB_total_income;
        const amount_each_should_pay = total_expense / 2;

        const userA_balance = userA_total_expense - amount_each_should_pay;
        const userB_balance = userB_total_expense - amount_each_should_pay;

        let final_statement = '';
        let owedAmount = 0;
        let owedBy = null;
        let owedTo = null;

        if (Math.abs(userA_balance) < 0.01) {
            final_statement = 'Both are settled';
        } else if (userA_balance > 0) {
            owedAmount = Math.abs(userA_balance);
            owedBy = userB;
            owedTo = userA;
            final_statement = `${userB.name} owes ${userA.name} ₹${owedAmount.toFixed(2)}`;
        } else {
            owedAmount = Math.abs(userA_balance);
            owedBy = userA;
            owedTo = userB;
            final_statement = `${userA.name} owes ${userB.name} ₹${owedAmount.toFixed(2)}`;
        }

        res.json({
            userA: {
                id: userA._id,
                name: userA.name,
                email: userA.email,
                total_expense: userA_total_expense,
                total_income: userA_total_income,
                balance: userA_balance
            },
            userB: {
                id: userB._id,
                name: userB.name,
                email: userB.email,
                total_expense: userB_total_expense,
                total_income: userB_total_income,
                balance: userB_balance
            },
            total_expense,
            total_income,
            amount_each_should_pay,
            final_statement,
            owedAmount,
            owedBy,
            owedTo
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
