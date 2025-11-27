import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { 
  getCollaboration, 
  getCollabTransactions, 
  addCollabTransaction,
  deleteCollabTransaction,
  getBalanceSummary 
} from '../../services/collabApi';
import { formatCurrency } from '../../utils/format';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Trash2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  X,
  PieChart as PieChartIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { clsx } from 'clsx';

export default function CollaborationDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collaboration, setCollaboration] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      const [collabData, transData, balanceData] = await Promise.all([
        getCollaboration(id),
        getCollabTransactions(id),
        getBalanceSummary(id)
      ]);
      setCollaboration(collabData);
      setTransactions(transData);
      setBalance(balanceData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addCollabTransaction(id, formData);
      setShowModal(false);
      setFormData({
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (error) {
      console.error('Failed to add transaction', error);
    }
  };

  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure?')) {
      try {
        await deleteCollabTransaction(id, transactionId);
        fetchData();
      } catch (error) {
        console.error('Failed to delete transaction', error);
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!collaboration) return null;

  const otherUser = collaboration.users.find(u => u._id !== collaboration.createdBy._id);
  
  // Prepare chart data
  const userAExpenses = transactions
    .filter(t => t.userId._id === balance.userA.id && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const userBExpenses = transactions
    .filter(t => t.userId._id === balance.userB.id && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const chartData = [
    { name: balance.userA.name, value: userAExpenses, color: '#2563eb' },
    { name: balance.userB.name, value: userBExpenses, color: '#ef4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/collaborations')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-text flex items-center gap-3">
              <Users size={32} className="text-primary" />
              Shared with {otherUser?.name}
            </h2>
            <p className="text-text-muted mt-1">{otherUser?.email}</p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 shadow-glow">
          <Plus size={20} />
          Add Transaction
        </Button>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-glow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100 font-medium">Total Expenses</p>
            <TrendingDown size={20} className="text-blue-100" />
          </div>
          <h3 className="text-3xl font-bold">{formatCurrency(balance.total_expense)}</h3>
          <p className="text-xs text-blue-100 mt-2">Split equally: {formatCurrency(balance.amount_each_should_pay)}</p>
        </Card>

        <Card hover className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-muted text-sm font-medium">{balance.userA.name}'s Total</p>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              {balance.userA.name.charAt(0)}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-text">{formatCurrency(balance.userA.total_expense)}</h3>
          <p className={clsx(
            "text-sm mt-2 font-medium",
            balance.userA.balance > 0 ? "text-success" : balance.userA.balance < 0 ? "text-danger" : "text-text-muted"
          )}>
            {balance.userA.balance > 0 ? `+${formatCurrency(Math.abs(balance.userA.balance))}` : 
             balance.userA.balance < 0 ? `-${formatCurrency(Math.abs(balance.userA.balance))}` : 
             'Settled'}
          </p>
        </Card>

        <Card hover className="border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-muted text-sm font-medium">{balance.userB.name}'s Total</p>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              {balance.userB.name.charAt(0)}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-text">{formatCurrency(balance.userB.total_expense)}</h3>
          <p className={clsx(
            "text-sm mt-2 font-medium",
            balance.userB.balance > 0 ? "text-success" : balance.userB.balance < 0 ? "text-danger" : "text-text-muted"
          )}>
            {balance.userB.balance > 0 ? `+${formatCurrency(Math.abs(balance.userB.balance))}` : 
             balance.userB.balance < 0 ? `-${formatCurrency(Math.abs(balance.userB.balance))}` : 
             'Settled'}
          </p>
        </Card>

        <Card className={clsx(
          "border-l-4",
          balance.final_statement === 'Both are settled' ? "border-l-success bg-green-50" : "border-l-yellow-500 bg-yellow-50"
        )}>
          <p className="text-text-muted text-sm font-medium mb-2">Settlement</p>
          <p className="text-lg font-bold text-text leading-tight">
            {balance.final_statement}
          </p>
          {balance.owedAmount > 0 && (
            <p className="text-sm text-text-muted mt-2">
              Amount: {formatCurrency(balance.owedAmount)}
            </p>
          )}
        </Card>
      </div>

      {/* Charts and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Distribution Chart */}
        <Card className="h-[400px] flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            Expense Distribution
          </h3>
          {chartData.length > 0 ? (
            <div className="flex-1 min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                {chartData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-text-muted">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-muted">
              <div className="text-center">
                <PieChartIcon size={48} className="mx-auto mb-2 opacity-20" />
                <p>No expenses yet</p>
              </div>
            </div>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-2 h-[400px] flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            Recent Transactions
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
            {transactions.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-muted">
                <div className="text-center">
                  <Calendar size={48} className="mx-auto mb-2 opacity-20" />
                  <p>No transactions yet</p>
                </div>
              </div>
            ) : (
              transactions.map((t) => (
                <div key={t._id} className="group flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                      t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    )}>
                      {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-text">{t.description || t.category}</p>
                        <Badge variant="outline" className="text-xs">{t.category}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-text-muted flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(t.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-text-muted">by {t.userId.name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      "font-bold text-lg",
                      t.type === 'income' ? 'text-success' : 'text-danger'
                    )}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                    <button 
                      onClick={() => handleDelete(t._id)}
                      className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md relative animate-slide-up shadow-2xl border-none">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-2xl font-bold mb-6 text-text">Add Shared Transaction</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 rounded-xl">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={formData.type === 'expense'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="hidden peer"
                  />
                  <div className="text-center py-2.5 rounded-lg text-sm font-medium text-text-muted transition-all peer-checked:bg-white peer-checked:text-danger peer-checked:shadow-sm">
                    Expense
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    checked={formData.type === 'income'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="hidden peer"
                  />
                  <div className="text-center py-2.5 rounded-lg text-sm font-medium text-text-muted transition-all peer-checked:bg-white peer-checked:text-success peer-checked:shadow-sm">
                    Income
                  </div>
                </label>
              </div>

              <div className="space-y-4">
                <Input
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="text-lg font-medium"
                />

                <Input
                  label="Category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  placeholder="e.g., Food, Rent, Utilities"
                />

                <Input
                  label="Description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What was this for?"
                />

                <Input
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full py-3 text-base shadow-glow mt-2">
                Add Transaction
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
