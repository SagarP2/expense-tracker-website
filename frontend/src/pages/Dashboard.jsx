import { useEffect, useState, useMemo } from 'react';
import { Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '../components/ui/Card';
import api from '../utils/axiosInstance';
import { formatCurrency } from '../utils/format';
import { TrendingUp, TrendingDown, Wallet, Eye, EyeOff, Calendar } from 'lucide-react';
import {
  calculateHealthScore, getSmartInsights,
  getCategoryHighlight, getMiniStats
} from '../utils/dashboardUtils';
import {
  MiniStatsStrip, HealthScoreWidget, SmartInsightsWidget,
  GoalTrackerWidget, WeeklyActivityWidget, CategoryHighlightWidget,
  HealthBarWidget
} from '../components/DashboardWidgets';

const CustomXAxisTick = ({ x, y, payload }) => {
  const MAX_LENGTH = 10;
  let text = payload.value;
  let lines = [];

  if (text.length > MAX_LENGTH && text.includes(' ')) {
    const words = text.split(' ');
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      if ((currentLine + ' ' + words[i]).length <= MAX_LENGTH) {
        currentLine += ' ' + words[i];
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
  } else {
    lines = [text];
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={10} dy={10} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={500}>
        {lines.map((line, index) => (
          <tspan x={0} dy={index === 0 ? 0 : 12} key={index}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};


export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [hideBalance, setHideBalance] = useState(true);
  const [hideIncome, setHideIncome] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await api.get('/transactions');
        setTransactions(data);
      } catch (error) {
        // console.error('Failed to fetch transactions', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  useEffect(() => {
    const fetchSavingsGoal = async () => {
      try {
        const { data } = await api.get('/users/savings-goal');
        setSavingsGoal(data.savingsGoal || 0);
      } catch (error) {
        // console.error('Failed to fetch savings goal', error);
      }
    };
    fetchSavingsGoal();
  }, []);

  const handleUpdateSavingsGoal = async (newGoal) => {
    try {
      const { data } = await api.put('/users/savings-goal', { savingsGoal: newGoal });
      setSavingsGoal(data.savingsGoal);
    } catch (error) {
      // console.error('Failed to update savings goal', error);
      alert('Failed to update savings goal. Please try again.');
    }
  };

  // include month filter (default to current month)
  const [filter, setFilter] = useState({
    type: '',
    search: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    year: new Date().getFullYear().toString(),
    viewMode: 'month' // 'month' or 'year'
  });

  // Calculate All-Time Balance (for Month View)
  const allTimeIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const allTimeExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const allTimeBalance = allTimeIncome - allTimeExpense;

  // Filter transactions based on View Mode
  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);

    if (filter.viewMode === 'month') {
      if (!filter.month) return true;
      const tMonth = tDate.toISOString().slice(0, 7); // YYYY-MM
      return tMonth === filter.month;
    } else {
      // Year View
      if (!filter.year) return true;
      const tYear = tDate.getFullYear().toString();
      return tYear === filter.year;
    }
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = filter.viewMode === 'year'
    ? totalIncome - totalExpense // Year Balance
    : allTimeBalance; // All-Time Balance (for Month View)

  // Calculate Percentage Change dynamically
  const percentageChange = useMemo(() => {
    const currentNet = totalIncome - totalExpense;

    if (filter.viewMode === 'month') {
      // For month view, we compare current month's net income to the opening balance of the month
      // Opening Balance = All Time Balance - Current Month Net
      const openingBalance = allTimeBalance - currentNet;
      if (openingBalance === 0) return 0;
      return ((currentNet / openingBalance) * 100).toFixed(1);
    } else {
      // For year view, compare with last year
      const currentYear = parseInt(filter.year);
      const lastYear = currentYear - 1;
      const lastYearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === lastYear);
      const lastYearIncome = lastYearTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
      const lastYearExpense = lastYearTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
      const lastYearNet = lastYearIncome - lastYearExpense;

      if (lastYearNet === 0) return 0;
      return ((currentNet - lastYearNet) / Math.abs(lastYearNet) * 100).toFixed(1);
    }
  }, [filter.viewMode, filter.year, totalIncome, totalExpense, allTimeBalance, transactions]);

  const percentageLabel = filter.viewMode === 'month' ? 'from last month' : 'from last year';
  const isPositiveChange = Number(percentageChange) >= 0;

  const [categoryColors, setCategoryColors] = useState(() => {
    try {
      const saved = localStorage.getItem('expenseTracker_categoryColors');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      // console.error('Failed to load category colors', e);
      return {};
    }
  });

  const COLORS = [
    '#2563eb', '#eab308', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
    '#14b8a6', '#f59e0b', '#6366f1', '#84cc16', '#a855f7', '#fb923c',
    '#0ea5e9', '#facc15', '#d946ef', '#10b981', '#3b82f6', '#fbbf24',
    '#8b5a3c', '#64748b', '#0891b2', '#ca8a04', '#7c3aed', '#dc2626',
    '#059669', '#4f46e5'
  ];

  useEffect(() => {
    if (!transactions.length) return;

    const expenses = transactions.filter(t => t.type === 'expense');
    const uniqueCategories = [...new Set(expenses.map(t => t.category))];

    setCategoryColors(prevColors => {
      const newColors = { ...prevColors };
      let hasChanges = false;
      let nextColorIndex = Object.keys(prevColors).length;

      uniqueCategories.forEach(category => {
        if (!newColors[category]) {
          newColors[category] = COLORS[nextColorIndex % COLORS.length];
          nextColorIndex++;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem('expenseTracker_categoryColors', JSON.stringify(newColors));
        return newColors;
      }
      return prevColors;
    });
  }, [transactions]);

  // Process data for charts
  const categoryData = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, [])
    .reverse()
    .map((cat) => ({
      ...cat,
      color: categoryColors[cat.name] || '#cbd5e1' // Fallback color
    }));

  // New Metrics Calculations
  const healthScore = calculateHealthScore(totalIncome, totalExpense);
  const smartInsight = getSmartInsights(filteredTransactions);
  const categoryHighlight = getCategoryHighlight(filteredTransactions);
  const miniStats = getMiniStats(filteredTransactions, totalExpense);
  const currentSavings = Math.max(0, totalIncome - totalExpense);

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface/40 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-sm">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">Dashboard</h2>
          <p className="text-text-muted mt-1 font-medium text-sm sm:text-base">Your financial overview</p>
        </div>
        {/* Month filter */}
        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-xl border border-border shadow-sm w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setFilter(prev => ({ ...prev, viewMode: 'month' }))}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter.viewMode === 'month' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'}`}
            >
              Month
            </button>
            <button
              onClick={() => setFilter(prev => ({ ...prev, viewMode: 'year' }))}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter.viewMode === 'year' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'}`}
            >
              Year
            </button>
          </div>

          <div className="h-6 w-px bg-border mx-1"></div>

          {/* Month Filter */}
          {filter.viewMode === 'month' && (
            <div className="relative flex items-center">
              <Calendar size={14} className="absolute left-2 text-text-muted pointer-events-none" />
              <input
                type="month"
                className="pl-7 pr-2 py-1 bg-transparent text-sm font-medium text-text focus:outline-none cursor-pointer w-full sm:w-auto"
                value={filter.month}
                onChange={(e) => setFilter({ ...filter, month: e.target.value })}
                onKeyDown={(e) => e.preventDefault()}
              />
            </div>
          )}

          {/* Year Filter */}
          {filter.viewMode === 'year' && (
            <div className="relative flex items-center">
              <Calendar size={14} className="absolute left-2 text-text-muted pointer-events-none" />
              <select
                className="pl-7 pr-6 py-1 bg-transparent text-sm font-medium text-text focus:outline-none cursor-pointer appearance-none"
                value={filter.year}
                onChange={(e) => setFilter({ ...filter, year: e.target.value })}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Mini Stats Strip */}
      <MiniStatsStrip data={miniStats} />

      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
        <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-glow relative overflow-hidden col-span-1 md:col-span-2 lg:col-span-1 min-h-[160px]">
          <div className="absolute -bottom-4 -right-4 p-7 opacity-20 rotate-0">
            <Wallet size={100} />
          </div>

          <div className="relative z-10 h-full flex flex-col justify-between p-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-100 font-medium text-sm uppercase tracking-wide">Total Balance</p>
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Toggle balance visibility"
                >
                  {hideBalance ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <h3 className="text-3xl font-bold tracking-tight truncate">
                {hideBalance ? '₹*****' : formatCurrency(balance)}
              </h3>
            </div>
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-2 text-xs text-blue-50 inline-block w-fit font-medium border border-white/10">
              {isPositiveChange ? '+' : ''}{percentageChange}% {percentageLabel}
            </div>
          </div>
        </Card>

        <Card hover className="bg-gradient-to-br from-surface to-emerald-50/50 dark:bg-none dark:bg-surface border-emerald-100/50 dark:border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 min-h-[160px]">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-emerald-100/50 rounded-2xl text-emerald-600 shadow-sm">
              <TrendingUp size={24} />
            </div>
            <button
              onClick={() => setHideIncome(!hideIncome)}
              className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600/70 hover:text-emerald-600"
              aria-label="Toggle income visibility"
            >
              {hideIncome ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div>
            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Total Income</p>
            <h3 className="text-2xl font-bold text-text mt-1 truncate">
              {hideIncome ? '₹*****' : formatCurrency(totalIncome)}
            </h3>
          </div>
        </Card>

        <Card hover className="bg-gradient-to-br from-surface to-rose-50/50 dark:bg-none dark:bg-surface border-rose-100/50 dark:border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 min-h-[160px]">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-rose-100/50 rounded-2xl text-rose-600 shadow-sm">
              <TrendingDown size={24} />
            </div>
          </div>
          <div>
            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Total Expense</p>
            <h3 className="text-2xl font-bold text-text mt-1 truncate">{formatCurrency(totalExpense)}</h3>
          </div>
        </Card>

        <div className="h-full min-h-[160px]">
          <HealthBarWidget score={healthScore} />
        </div>
      </div>

      {/* Main Grid: Health, Chart, Goal/Category */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>

        {/* Center: Main Chart */}
        <div className="lg:col-span-2 h-[470px]">
          <Card className="h-full flex flex-col bg-gradient-to-b from-surface to-neutral-50/30 dark:bg-none dark:bg-surface border-border shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold flex items-center gap-3 text-text">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-blue-600 rounded-full shadow-sm"></div>
                Income & Expense Breakdown
              </h3>
              <div className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full border border-primary/10">
                Overview
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Total Income', value: totalIncome, type: 'income' },
                    { name: 'Total Expense', value: totalExpense, type: 'expense' },
                    ...categoryData.map((cat) => ({
                      name: cat.name,
                      value: cat.value,
                      type: 'category',
                      color: cat.color
                    }))
                  ]}
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={1} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
                    </linearGradient>
                    {categoryData.map((cat, index) => (
                      <linearGradient key={`gradient-${index}`} id={`gradient-${cat.name.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={cat.color} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={cat.color} stopOpacity={1} />
                      </linearGradient>
                    ))}
                    <filter id="shadow" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.1" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={<CustomXAxisTick />}
                    interval={0}
                    height={60}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)',
                      padding: '12px 16px'
                    }}
                    itemStyle={{ color: '#1e293b', fontWeight: 600, fontSize: '13px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={32} filter="url(#shadow)">
                    {
                      [
                        { name: 'Total Income', value: totalIncome, type: 'income' },
                        { name: 'Total Expense', value: totalExpense, type: 'expense' },
                        ...categoryData.map((cat) => ({
                          name: cat.name,
                          value: cat.value,
                          type: 'category',
                          color: cat.color
                        }))
                      ].map((entry, index) => {
                        let fillUrl;
                        if (entry.type === 'income') fillUrl = 'url(#incomeGradient)';
                        else if (entry.type === 'expense') fillUrl = 'url(#expenseGradient)';
                        else fillUrl = `url(#gradient-${entry.name.replace(/\s+/g, '-')})`;

                        return <Cell key={`cell-${index}`} fill={fillUrl} strokeWidth={0} />;
                      })
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 px-4 pb-4 text-[10px] text-text-muted text-center italic">
              Note: The expense bar depends on all category-wise expenses.
            </div>
          </Card>
        </div>

        {/* Right: Goal & Category */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-auto lg:h-[464px]">
          <div className="flex-1 grid grid-cols-2 gap-4 min-h-[200px]">
            <GoalTrackerWidget current={currentSavings} target={filter.viewMode === 'year' ? 0 : savingsGoal} onUpdateGoal={handleUpdateSavingsGoal} />
            <CategoryHighlightWidget category={categoryHighlight} />
          </div>
          <div className="flex-1 min-h-[200px]">
            <WeeklyActivityWidget transactions={filteredTransactions} selectedMonth={filter.month} selectedYear={filter.year} />
          </div>
        </div>
      </div>
    </div>
  );
}
