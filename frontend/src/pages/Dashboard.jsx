import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '../components/ui/Card';
import api from '../utils/axiosInstance';
import { formatCurrency } from '../utils/format';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await api.get('/transactions');
        setTransactions(data);
      } catch (error) {
        console.error('Failed to fetch transactions', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  // Process data for charts
  const categoryData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, []);

  // Monthly data for bar chart (simplified for last 6 months)
  const monthlyData = transactions.reduce((acc, curr) => {
    const date = new Date(curr.date);
    const month = date.toLocaleString('default', { month: 'short' });
    const existing = acc.find(item => item.name === month);
    if (existing) {
      if (curr.type === 'income') existing.income += curr.amount;
      else existing.expense += curr.amount;
    } else {
      acc.push({
        name: month,
        income: curr.type === 'income' ? curr.amount : 0,
        expense: curr.type === 'expense' ? curr.amount : 0,
      });
    }
    return acc;
  }, []).slice(-6); // Last 6 months

  const COLORS = ['#2563eb', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#ec4899'];

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text">Dashboard</h2>
          <p className="text-text-muted mt-1">Your financial overview</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-text-muted">
          <Activity size={16} />
          <span>Last 30 Days</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-glow relative overflow-hidden col-span-1 md:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={80} />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <p className="text-blue-100 mb-1 font-medium">Total Balance</p>
              <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(balance)}</h3>
            </div>
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-2 text-xs text-blue-50 inline-block w-fit">
              +2.5% from last month
            </div>
          </div>
        </Card>

        <Card hover className="border-l-4 border-l-success">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl text-success">
              <TrendingUp size={24} />
            </div>
            <span className="flex items-center text-xs font-medium text-success bg-green-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} className="mr-1" /> +12%
            </span>
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Total Income</p>
            <h3 className="text-2xl font-bold text-text mt-1">{formatCurrency(totalIncome)}</h3>
          </div>
        </Card>

        <Card hover className="border-l-4 border-l-danger">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-xl text-danger">
              <TrendingDown size={24} />
            </div>
            <span className="flex items-center text-xs font-medium text-danger bg-red-50 px-2 py-1 rounded-full">
              <ArrowDownRight size={14} className="mr-1" /> +5%
            </span>
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Total Expense</p>
            <h3 className="text-2xl font-bold text-text mt-1">{formatCurrency(totalExpense)}</h3>
          </div>
        </Card>

        <Card hover className="flex flex-col justify-center items-center text-center">
          <div className="p-3 bg-yellow-50 rounded-full text-yellow-600 mb-2">
            <Activity size={24} />
          </div>
          <p className="text-text-muted text-sm font-medium">Transactions</p>
          <h3 className="text-2xl font-bold text-text mt-1">{transactions.length}</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trends Chart */}
        <Card className="lg:col-span-2 h-[400px] flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            Monthly Trends
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                  }} 
                />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expense Breakdown */}
        <Card className="h-[400px] flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            Expenses by Category
          </h3>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-xs text-text-muted">Total</p>
                <p className="font-bold text-lg">{formatCurrency(totalExpense)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
