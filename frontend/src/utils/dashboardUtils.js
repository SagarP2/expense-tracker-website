export const calculateHealthScore = (income,expense) => {
    if (income === 0) return 0;
    const savingsRate = ((income - expense) / income) * 100;
    // Base score 50
    let score = 50;

    // Add points for savings rate
    if (savingsRate > 50) score += 50;
    else if (savingsRate > 20) score += 30;
    else if (savingsRate > 0) score += 10;
    else score -= 20; // Negative savings

    // Cap at 100 and floor at 0
    return Math.min(100,Math.max(0,score));
};

export const getSmartInsights = (transactions) => {
    if (!transactions.length) return { type: 'neutral',message: 'Start adding transactions to get insights!' };

    const expenses = transactions.filter(t => t.type === 'expense');
    if (!expenses.length) return { type: 'success',message: 'No expenses yet. Great start!' };

    // 1. Check Weekend Spending
    const weekendSpend = expenses
        .filter(t => {
            const day = new Date(t.date).getDay();
            return day === 0 || day === 6;
        })
        .reduce((acc,curr) => acc + curr.amount,0);

    const totalSpend = expenses.reduce((acc,curr) => acc + curr.amount,0);

    if (weekendSpend > totalSpend * 0.4) {
        return { type: 'warning',message: 'You spend 40% of your money on weekends.' };
    }

    // 2. Check Top Category
    const categoryTotals = expenses.reduce((acc,curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    },{});

    const topCategory = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1])[0];
    if (topCategory) {
        return { type: 'info',message: `Your highest spending is in ${topCategory[0]}.` };
    }

    return { type: 'success',message: 'You are on track this month!' };
};

export const getWeeklyActivity = (transactions) => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const activity = days.map(day => ({ name: day,income: 0,expense: 0 }));

    transactions.forEach(t => {
        const dayIndex = new Date(t.date).getDay();
        if (t.type === 'income') activity[dayIndex].income += t.amount;
        else activity[dayIndex].expense += t.amount;
    });

    return activity;
};

export const getMonthlyActivity = (transactions) => {
    const weeks = ['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6'];
    const activity = weeks.map(week => ({ name: week,income: 0,expense: 0 }));

    transactions.forEach(t => {
        const date = new Date(t.date);
        const day = date.getDate();
        const firstDayOfMonth = new Date(date.getFullYear(),date.getMonth(),1).getDay(); // 0=Sun, 6=Sat
        // Calculate week index: Week 1 is 0
        // Formula: floor((day + firstDayOfMonth - 1) / 7)
        const weekIndex = Math.floor((day + firstDayOfMonth - 1) / 7);

        if (weekIndex >= 0 && weekIndex < 6) {
            if (t.type === 'income') activity[weekIndex].income += t.amount;
            else activity[weekIndex].expense += t.amount;
        }
    });

    // Optional: Filter out Week 6 if it's empty and not needed, but keeping it consistent is fine.
    // For UI consistency, we'll return all, or maybe filter empty ones at the end?
    // Let's return all for now to match the dropdown options.
    return activity;
};

export const getCategoryHighlight = (transactions) => {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (!expenses.length) return { name: '-',amount: 0 };

    const categoryTotals = expenses.reduce((acc,curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    },{});

    const sorted = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1]);
    if (!sorted.length) return { name: '-',amount: 0 };

    return { name: sorted[0][0],amount: sorted[0][1] };
};

export const getMiniStats = (transactions,totalExpense) => {
    const expenses = transactions.filter(t => t.type === 'expense' && t.category !== 'Settlement');
    const daysInMonth = new Date().getDate(); // Approximation for current month progress

    const avgDaily = totalExpense / (daysInMonth || 1);

    // Sort expenses by amount to find biggest and lowest
    const sortedExpenses = [...expenses].sort((a,b) => a.amount - b.amount);

    const biggestTx = sortedExpenses.length > 0
        ? { amount: sortedExpenses[sortedExpenses.length - 1].amount,category: sortedExpenses[sortedExpenses.length - 1].category }
        : { amount: 0,category: '-' };

    const lowestTx = sortedExpenses.length > 0
        ? { amount: sortedExpenses[0].amount,category: sortedExpenses[0].category }
        : { amount: 0,category: '-' };

    return {
        avgDaily,
        biggestTx,
        lowestTx,
        txCount: transactions.length
    };
};
