import React from 'react';
import { Card } from './ui/Card';
import { formatCurrency } from '../utils/format';
import {
    TrendingUp,TrendingDown,Activity,Target,
    Lightbulb,Zap,Award,ArrowRight,Wallet
} from 'lucide-react';
import {
    BarChart,Bar,XAxis,Tooltip,ResponsiveContainer,Cell,CartesianGrid,
    RadialBarChart,RadialBar,Legend,
    Radar,RadarChart,PolarGrid,PolarAngleAxis,PolarRadiusAxis
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

const useChartTheme = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return {
        text: isDark ? '#94a3b8' : '#64748b',
        grid: isDark ? '#334155' : '#e2e8f0',
        tooltipBg: isDark ? '#1e293b' : '#ffffff',
        tooltipBorder: isDark ? '#334155' : '#e2e8f0',
        tooltipText: isDark ? '#f8fafc' : '#0f172a',
        barPrimary: isDark ? '#60a5fa' : '#3b82f6',
        barSecondary: isDark ? '#1e40af' : '#93c5fd',
    };
};

export const MiniStatsStrip = ({ data }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-slide-up">
        <Card className="p-4 bg-surface/60 backdrop-blur-sm border-border/50 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300" hover>
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Avg. Daily Spend</p>
            <div className="flex items-end justify-between mt-2">
                <h4 className="text-lg font-bold text-text">{formatCurrency(data.avgDaily)}</h4>
                <Activity size={18} className="text-primary/70 mb-1" />
            </div>
        </Card>
        <Card className="p-4 bg-surface/60 backdrop-blur-sm border-border/50 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300" hover>
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Biggest Purchase</p>
            <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                    <h4 className="text-lg font-bold text-text">{formatCurrency(data.biggestTx.amount)}</h4>
                    <span className="text-[10px] font-medium text-text-muted truncate max-w-[100px]">{data.biggestTx.category}</span>
                </div>
                <Zap size={18} className="text-amber-500/70 mb-1" />
            </div>
        </Card>
        <Card className="p-4 bg-surface/60 backdrop-blur-sm border-border/50 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300" hover>
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Lowest Purchase</p>
            <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                    <h4 className="text-lg font-bold text-text">{formatCurrency(data.lowestTx.amount)}</h4>
                    <span className="text-[10px] font-medium text-text-muted truncate max-w-[100px]">{data.lowestTx.category}</span>
                </div>
                <TrendingDown size={18} className="text-emerald-500/70 mb-1" />
            </div>
        </Card>
        <Card className="p-4 bg-surface/60 backdrop-blur-sm border-border/50 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300" hover>
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Total Transactions</p>
            <div className="flex items-end justify-between mt-2">
                <h4 className="text-lg font-bold text-text">{data.txCount}</h4>
                <Wallet size={18} className="text-blue-500/70 mb-1" />
            </div>
        </Card>
    </div>
);

export const HealthScoreWidget = ({ score }) => {
    const getColor = (s) => {
        if (s >= 80) return 'text-emerald-500';
        if (s >= 50) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getLabel = (s) => {
        if (s >= 80) return 'Excellent';
        if (s >= 50) return 'Good';
        return 'Needs Attention';
    };

    return (
        <Card className="h-full flex flex-col items-center justify-center p-6 bg-surface border-border shadow-soft relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400 opacity-50 dark:opacity-10 dark:from-transparent dark:to-transparent"></div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Financial Health</h3>
            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neutral-100" />
                    <circle
                        cx="64" cy="64" r="56"
                        stroke="currentColor" strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={351.86}
                        strokeDashoffset={351.86 - (351.86 * score) / 100}
                        className={`${getColor(score)} transition-all duration-1000 ease-out`}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${getColor(score)}`}>{Math.round(score)}</span>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1">{getLabel(score)}</span>
                </div>
            </div>
        </Card>
    );
};

export const HealthBarWidget = ({ score }) => {
    const getColor = (s) => {
        if (s >= 80) return 'text-emerald-600';
        if (s >= 50) return 'text-amber-600';
        return 'text-rose-600';
    };

    const getBgColor = (s) => {
        if (s >= 80) return 'bg-emerald-500';
        if (s >= 50) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const getLightBgColor = (s) => {
        if (s >= 80) return 'bg-emerald-100/50';
        if (s >= 50) return 'bg-amber-100/50';
        return 'bg-rose-100/50';
    };

    const getLabel = (s) => {
        if (s >= 80) return 'Excellent';
        if (s >= 50) return 'Good';
        return 'Needs Attention';
    };

    const colorClass = getColor(score);
    const bgClass = getBgColor(score);
    const lightBgClass = getLightBgColor(score);

    return (
        <Card hover className="h-full bg-gradient-to-br from-surface to-indigo-50/30 dark:bg-none dark:bg-surface border-indigo-100/50 dark:border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between p-5">
            <div className="flex items-center justify-between mb-2">
                <div className={`p-3 ${lightBgClass} rounded-2xl ${colorClass}`}>
                    <Activity size={20} />
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${lightBgClass} ${colorClass}`}>
                    {getLabel(score)}
                </span>
            </div>
            <div>
                <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Financial Health</p>
                <div className="flex items-end gap-2 mt-1 mb-3">
                    <h3 className="text-2xl font-bold text-text">{Math.round(score)}</h3>
                    <span className="text-xs text-text-muted font-medium mb-1.5">/ 100</span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${bgClass}`}
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>
        </Card>
    );
};

export const SmartInsightsWidget = ({ insight }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'warning': return <TrendingDown size={20} className="text-rose-500" />;
            case 'success': return <TrendingUp size={20} className="text-emerald-500" />;
            default: return <Lightbulb size={20} className="text-amber-500" />;
        }
    };

    return (
        <Card className="h-full p-6 bg-gradient-to-br from-indigo-50/50 to-surface dark:bg-none dark:bg-surface border-border shadow-soft flex flex-col">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-surface rounded-xl shadow-sm border border-border/50">
                    {getIcon(insight.type)}
                </div>
                <h3 className="font-bold text-indigo-950 text-sm uppercase tracking-wide">Smart Insight</h3>
            </div>
            <p className="text-sm text-text-secondary font-medium leading-relaxed">
                {insight.message}
            </p>
            <div className="mt-auto pt-4">
                <button className="text-xs font-bold text-primary flex items-center hover:gap-2 transition-all group">
                    View Details <ArrowRight size={12} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </Card>
    );
};

export const GoalTrackerWidget = ({ current,target,onUpdateGoal }) => {
    const [isModalOpen,setIsModalOpen] = React.useState(false);
    const [goalValue,setGoalValue] = React.useState(target);
    const percentage = target > 0 ? Math.min(100,Math.max(0,(current / target) * 100)) : 0;

    React.useEffect(() => {
        setGoalValue(target);
    },[target]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (goalValue >= 0 && onUpdateGoal) {
            onUpdateGoal(goalValue);
            setIsModalOpen(false);
        }
    };

    const handleCancel = () => {
        setGoalValue(target);
        setIsModalOpen(false);
    };

    return (
        <>
            <Card className="h-full p-5 bg-surface border-border shadow-soft flex flex-col justify-center">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                            <Target size={16} />
                        </div>
                        <h3 className="font-bold text-text text-sm">Monthly Goal</h3>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{Math.round(percentage)}%</span>
                </div>
                <div className="mb-4">
                    <div className="flex justify-between text-xs font-medium text-text-muted mb-1.5">
                        <span>{formatCurrency(current)}</span>
                        <span>Target: {formatCurrency(target)}</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                </div>
                <p className="text-xs text-text-muted mb-3 leading-relaxed">
                    {target === 0 ? "Set a goal to track your savings!" : percentage >= 100 ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            🎉 Goal reached! (+{formatCurrency(current - target)})
                        </span>
                    ) : `You need ${formatCurrency(target - current)} more to reach your goal.`}
                </p>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-2 px-4 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20"
                >
                    Set Goal
                </button>
            </Card>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={handleCancel}>
                    <div className="bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scale-in border border-border" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-text">Set Monthly Savings Goal</h3>
                            <button onClick={handleCancel} className="text-text-muted hover:text-text transition-colors p-1 hover:bg-neutral-100 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                                    Goal Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={goalValue === 0 ? '' : goalValue}
                                    onChange={(e) => setGoalValue(e.target.value === '' ? 0 : Number(e.target.value))}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-lg bg-surface-highlight font-medium transition-all"
                                    placeholder="Enter your savings goal"
                                    autoFocus
                                    min="0"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 py-2.5 px-4 border border-border text-text-secondary font-semibold rounded-xl hover:bg-neutral-50 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors shadow-lg shadow-primary/25 text-sm"
                                >
                                    Save Goal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

import { getWeeklyActivity,getMonthlyActivity } from '../utils/dashboardUtils';

export const WeeklyActivityWidget = ({ transactions,selectedMonth,selectedYear }) => {
    const [viewMode,setViewMode] = React.useState('overview'); // 'overview', 'week1', 'week2', 'week3', 'week4', 'week5', 'week6'

    const data = React.useMemo(() => {
        if (viewMode === 'overview') {
            return getMonthlyActivity(transactions);
        } else {
            // Filter transactions for the selected week
            const weekIndex = parseInt(viewMode.replace('week','')) - 1; // 0-5
            const weekTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                const day = tDate.getDate();
                const firstDayOfMonth = new Date(tDate.getFullYear(),tDate.getMonth(),1).getDay();
                const tWeekIndex = Math.floor((day + firstDayOfMonth - 1) / 7);
                return tWeekIndex === weekIndex;
            });
            return getWeeklyActivity(weekTransactions);
        }
    },[viewMode,transactions]);

    const getDateRange = () => {
        // Use selectedMonth and selectedYear if provided, otherwise use current date
        let year,month;
        if (selectedMonth && selectedYear) {
            // selectedMonth is in YYYY-MM format
            const [y,m] = selectedMonth.split('-');
            year = parseInt(y);
            month = parseInt(m) - 1; // Month is 0-indexed
        } else {
            const now = new Date();
            year = now.getFullYear();
            month = now.getMonth();
        }

        const options = { day: '2-digit',month: 'short' };

        if (viewMode === 'overview') {
            const startDate = new Date(year,month,1);
            const endDate = new Date(year,month + 1,0);
            return `(${startDate.toLocaleDateString('en-GB',options)} - ${endDate.toLocaleDateString('en-GB',options)})`;
        }

        const weekIndex = parseInt(viewMode.replace('week','')) - 1;
        const firstDayOfMonth = new Date(year,month,1).getDay(); // 0=Sun, 6=Sat

        // Calculate start date of the week
        // Week 0 starts on 1st.
        // Week > 0 starts on Sunday: 1 + (7 - firstDayOfMonth) + (weekIndex - 1) * 7
        let startDay;
        if (weekIndex === 0) {
            startDay = 1;
        } else {
            startDay = 1 + (7 - firstDayOfMonth) + (weekIndex - 1) * 7;
        }

        const startDate = new Date(year,month,startDay);

        // Calculate end date (start + 6 days, but cap at end of month, and Week 0 ends on first Sat)
        let endDay;
        if (weekIndex === 0) {
            endDay = 1 + (6 - firstDayOfMonth);
        } else {
            endDay = startDay + 6;
        }

        const endDate = new Date(year,month,endDay);
        const lastDayOfMonth = new Date(year,month + 1,0);

        // Cap end date at the last day of the month
        const finalEndDate = endDate > lastDayOfMonth ? new Date(year,month + 1,0) : endDate;

        // If start date is beyond month end (e.g. Week 6 in a short month), handle gracefully
        if (startDate > lastDayOfMonth) {
            return '';
        }

        return `(${startDate.toLocaleDateString('en-GB',options)} - ${finalEndDate.toLocaleDateString('en-GB',options)})`;
    };

    const chartTheme = useChartTheme();

    return (
        <Card className="h-[232px] p-5 bg-surface border-border shadow-soft flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-text flex items-center gap-2 text-sm">
                    <Activity size={16} className="text-primary" />
                    {viewMode === 'overview' ? 'Monthly Activity' : `Week ${viewMode.replace('week','')}`}
                    <span className="text-[10px] text-text-muted font-normal ml-1 hidden sm:inline-block">
                        {getDateRange()}
                    </span>
                </h3>
                <div className="bg-surface-highlight rounded-lg p-0.5 border border-border">
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        className="bg-transparent text-[10px] font-bold uppercase tracking-wide text-text-secondary focus:outline-none cursor-pointer px-2 py-1"
                    >
                        <option value="overview">Month Overview</option>
                        <option value="week1">Week 1</option>
                        <option value="week2">Week 2</option>
                        <option value="week3">Week 3</option>
                        <option value="week4">Week 4</option>
                        <option value="week5">Week 5</option>
                        <option value="week6">Week 6</option>
                    </select>
                </div>
            </div>
            <div className="h-60 w-full flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10,fill: chartTheme.text,fontWeight: 500 }}
                            interval={0}
                            dy={10}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                                borderRadius: '12px',
                                border: `1px solid ${chartTheme.tooltipBorder}`,
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                padding: '8px 12px',
                                backgroundColor: chartTheme.tooltipBg,
                                color: chartTheme.tooltipText
                            }}
                            formatter={(value) => [formatCurrency(value),'Expense']}
                            labelStyle={{ color: chartTheme.text,fontSize: '12px',marginBottom: '4px' }}
                            itemStyle={{ color: chartTheme.tooltipText }}
                        />
                        <Bar dataKey="expense" radius={[4,4,0,0]}>
                            {data && data.map((entry,index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? chartTheme.barPrimary : chartTheme.barSecondary} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export const CategoryHighlightWidget = ({ category }) => {
    if (!category) return null;

    return (
        <Card className="h-full p-5 bg-gradient-to-br from-orange-50/50 to-surface dark:bg-none dark:bg-surface border-border shadow-soft flex flex-col justify-center items-center text-center flex-wrap  ">
            <div className="p-3 bg-orange-100 rounded-2xl text-orange-600 mb-3 shadow-sm">
                <Award size={20} />
            </div>
            <h3 className="text-[10px] font-bold text-orange-900/60 uppercase tracking-wider mb-1">Top Category</h3>
            <p className="text-sm font-bold text-orange-950 mb-1 truncate max-w-full px-2">Your highest spending is in <br></br>{category.name}.</p>
            <p className="text-xl font-black text-orange-600">{formatCurrency(category.amount)}</p>
        </Card>
    );

};

// Custom X Axis Tick for the breakdown chart
const CustomXAxisTick = ({ x,y,payload,theme }) => {
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
            <text x={0} y={10} dy={10} textAnchor="middle" fill={theme?.text || "#94a3b8"} fontSize={10} fontWeight={500}>
                {lines.map((line,index) => (
                    <tspan x={0} dy={index === 0 ? 0 : 12} key={index}>
                        {line}
                    </tspan>
                ))}
            </text>
        </g>
    );
};

export const IncomeExpenseBreakdownWidget = ({ totalIncome,totalExpense,categoryData }) => {
    const chartTheme = useChartTheme();

    return (
        <Card className="h-[470px] flex flex-col bg-gradient-to-b from-surface to-neutral-50/30 dark:bg-none dark:bg-surface border-border shadow-lg">
            <div className="flex items-center justify-between mb-8 p-6 pb-0">
                <h3 className="text-lg font-bold flex items-center gap-3 text-text">
                    <div className="w-1 h-6 bg-gradient-to-b from-primary to-blue-600 rounded-full shadow-sm"></div>
                    Income & Expense Breakdown
                </h3>
                <div className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full border border-primary/10">
                    Overview
                </div>
            </div>
            <div className="flex-1 min-h-0 px-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={[
                            { name: 'Total Income',value: totalIncome,type: 'income' },
                            { name: 'Total Expense',value: totalExpense,type: 'expense' }
                        ].filter(item => item.value > 0).concat(
                            categoryData.map((cat) => ({
                                name: cat.name,
                                value: cat.value,
                                type: 'category',
                                color: cat.color
                            }))
                        )}
                        margin={{ top: 20,right: 10,left: -20,bottom: 0 }}
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
                            {categoryData.map((cat,index) => (
                                <linearGradient key={`gradient-${index}`} id={`gradient-${cat.name.replace(/\s+/g,'-')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={cat.color} stopOpacity={0.8} />
                                    <stop offset="100%" stopColor={cat.color} stopOpacity={1} />
                                </linearGradient>
                            ))}
                            <filter id="shadow" height="200%">
                                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.1" />
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={<CustomXAxisTick theme={chartTheme} />}
                            interval={0}
                            height={60}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                            formatter={(value) => formatCurrency(value)}
                            contentStyle={{
                                backgroundColor: chartTheme.tooltipBg,
                                borderRadius: '16px',
                                border: `1px solid ${chartTheme.tooltipBorder}`,
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                backdropFilter: 'blur(10px)',
                                padding: '12px 16px',
                                color: chartTheme.tooltipText
                            }}
                            itemStyle={{ color: chartTheme.tooltipText,fontWeight: 600,fontSize: '13px' }}
                            labelStyle={{ color: chartTheme.text }}
                        />
                        <Bar dataKey="value" radius={[6,6,0,0]} maxBarSize={32} filter="url(#shadow)">
                            {
                                [
                                    { name: 'Total Income',value: totalIncome,type: 'income' },
                                    { name: 'Total Expense',value: totalExpense,type: 'expense' }
                                ].filter(item => item.value > 0).concat(
                                    categoryData.map((cat) => ({
                                        name: cat.name,
                                        value: cat.value,
                                        type: 'category',
                                        color: cat.color
                                    }))
                                ).map((entry,index) => {
                                    let fillUrl;
                                    if (entry.type === 'income') fillUrl = 'url(#incomeGradient)';
                                    else if (entry.type === 'expense') fillUrl = 'url(#expenseGradient)';
                                    else fillUrl = `url(#gradient-${entry.name.replace(/\s+/g,'-')})`;

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
    );
};

export const CategoryRadialWidget = ({ data }) => {
    const chartTheme = useChartTheme();
    // Filter out categories with 0 value, sort by value descending, take top 5
    const chartData = data
        .filter(item => item.value > 0)
        .sort((a,b) => b.value - a.value)
        .slice(0,5)
        .map(item => ({
            name: item.name,
            value: item.value,
            fill: item.color
        }));

};

export const SpendingPatternWidget = ({ data }) => {
    const chartTheme = useChartTheme();

    const chartData = data
        .filter(item => item.value > 0)
        .slice(0,6); // Max 6 categories for cleaner radar

    return (
        <Card className="h-full p-5 bg-surface border-border shadow-soft flex flex-col relative overflow-hidden">
            <h3 className="text-sm font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2 relative z-10">
                <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                Spending Pattern
            </h3>

            <div className="flex-1 min-h-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                        <PolarGrid gridType="polygon" stroke={chartTheme.grid} />
                        <PolarAngleAxis
                            dataKey="name"
                            tick={{ fill: chartTheme.text,fontSize: 10,fontWeight: 600 }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0,'auto']} tick={false} axisLine={false} />
                        <Radar
                            name="Spending"
                            dataKey="value"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fill="#8b5cf6"
                            fillOpacity={0.4}
                        />
                        <Tooltip
                            cursor={false}
                            contentStyle={{
                                backgroundColor: chartTheme.tooltipBg,
                                borderRadius: '12px',
                                border: `1px solid ${chartTheme.tooltipBorder}`,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                padding: '8px 12px',
                            }}
                            itemStyle={{ color: chartTheme.tooltipText,fontSize: '12px',fontWeight: 600 }}
                            formatter={(value) => formatCurrency(value)}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Decorative background element */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        </Card>
    );
};
