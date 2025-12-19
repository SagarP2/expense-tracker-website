const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { sendGoalStatus } = require('../services/notificationService');

/**
 * Checks and triggers monthly goal notifications
 * @param {string} userId - User ID to check
 */
const checkGoalStatus = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || user.savingsGoal <= 0) return;

        // Get current month string YYYY-MM
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const currentMonthStr = startOfMonth.toISOString().slice(0, 7); // "YYYY-MM"

        // Check if month changed, if so reset notifications
        let goalStatus = user.monthlyGoalStatus || {};
        if (goalStatus.month !== currentMonthStr) {
            goalStatus = {
                month: currentMonthStr,
                isReachedNotified: false,
                isPendingNotified: false,
                isRegressedNotified: false
            };
        }

        // Calculate total savings for this month
        // Savings = Income - Expense (ignoring settlements for simplicity or strict accounting?)
        // Standard expense tracker logic: Income - Expense
        const transactions = await Transaction.find({
            user: userId,
            date: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        }).select('amount type category').lean();

        const totalIncome = transactions
            .filter(t => t.type === 'income' && t.category !== 'Settlement Received')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === 'expense' && t.category !== 'Settlement')
            .reduce((sum, t) => sum + t.amount, 0);

        const currentSavings = totalIncome - totalExpense;
        const goalAmount = user.savingsGoal;

        let shouldSaveUser = false;

        // 1. Check Goal Reached
        if (currentSavings >= goalAmount) {
            // Goal Reached!
            console.log(`🏆 User ${userId} reached savings goal!`);
            await sendGoalStatus(user, goalAmount, currentSavings);
            goalStatus.isReachedNotified = true;
            goalStatus.isPendingNotified = true; // Avoid sending pending msg if we already won
            shouldSaveUser = true;
        }

        // 2. Check Goal Pending (Target > Saving)
        else {
            // Check if we dropped from a reached state
            if (goalStatus.isReachedNotified) {
                console.log(`📉 User ${userId} dropped below goal!`);
                await sendGoalStatus(user, goalAmount, currentSavings, 'GOAL_REGRESSED');

                // Reset reached status so they can reach it again
                goalStatus.isReachedNotified = false;

                // Set pending status to true because we just notified them about the drop.
                // We don't want to immediately send a "Monthly Goal Update: X remaining" since "You dropped below" implies it.
                goalStatus.isPendingNotified = true;
                shouldSaveUser = true;

            } else if (!goalStatus.isPendingNotified) {
                console.log(`📉 User ${userId} goal pending notification`);
                await sendGoalStatus(user, goalAmount, currentSavings);
                goalStatus.isPendingNotified = true;
                shouldSaveUser = true;
            }
        }

        // Only save if status changed (month reset or notification sent)
        // If we reset month above but didn't trigger notification (unlikely logic flow but possible), we should still save.
        // Actually, if month changed, we definitely want to save the reset state.
        if (user.monthlyGoalStatus?.month !== currentMonthStr) {
            shouldSaveUser = true;
        }

        if (shouldSaveUser) {
            user.monthlyGoalStatus = goalStatus;
            await user.save();
        }

    } catch (error) {
        console.error('❌ Error checking goal status:', error);
    }
};

module.exports = { checkGoalStatus };
