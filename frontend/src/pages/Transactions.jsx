import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import api from '../utils/axiosInstance';
import { formatCurrency } from '../utils/format';
import { Plus, Search, Trash2, Edit2, Filter, X, Calendar, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { clsx } from 'clsx';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [filter, setFilter] = useState({ type: '', search: '' });

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

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, formData);
      } else {
        await api.post('/transactions', formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchTransactions();
    } catch (error) {
      console.error('Failed to save transaction', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchTransactions();
      } catch (error) {
        console.error('Failed to delete transaction', error);
      }
    }
  };

  const handleEdit = (t) => {
    setEditingId(t._id);
    setFormData({
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description,
      date: new Date(t.date).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filter.type ? t.type === filter.type : true;
    const matchesSearch = t.description?.toLowerCase().includes(filter.search.toLowerCase()) || 
                          t.category.toLowerCase().includes(filter.search.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text">Transactions</h2>
          <p className="text-text-muted mt-1">Manage your income and expenses</p>
        </div>
        <Button onClick={() => {
          setEditingId(null);
          setFormData({
            amount: '',
            type: 'expense',
            category: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
          });
          setShowModal(true);
        }} className="flex items-center gap-2 shadow-glow">
          <Plus size={20} />
          Add New
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
        </div>
        <select
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block overflow-hidden p-0 border-0 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-text-muted uppercase tracking-wider">Description</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-text-muted uppercase tracking-wider">Category</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-text-muted uppercase tracking-wider">Amount</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="py-4 px-6 text-sm text-text-muted">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      {new Date(t.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-text">{t.description}</td>
                  <td className="py-4 px-6 text-sm">
                    <Badge variant="outline" className="bg-gray-50">
                      {t.category}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold">
                    <span className={clsx(
                      "flex items-center gap-1 w-fit px-2 py-1 rounded-lg",
                      t.type === 'income' ? 'text-success bg-green-50' : 'text-danger bg-red-50'
                    )}>
                      {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {formatCurrency(t.amount)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(t)} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(t._id)} className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="opacity-20" />
                      <p>No transactions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredTransactions.map((t) => (
          <Card key={t._id} className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-text text-lg">{t.description || t.category}</p>
                <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                  <Calendar size={14} />
                  {new Date(t.date).toLocaleDateString()}
                </p>
              </div>
              <span className={clsx(
                "font-bold text-lg flex items-center gap-1",
                t.type === 'income' ? 'text-success' : 'text-danger'
              )}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <Badge variant="outline" className="bg-gray-50">
                {t.category}
              </Badge>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(t)} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(t._id)} className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {filteredTransactions.length === 0 && (
          <div className="text-center text-text-muted py-10">
            <p>No transactions found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md relative animate-slide-up shadow-2xl border-none">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-2xl font-bold mb-6 text-text">{editingId ? 'Edit Transaction' : 'New Transaction'}</h3>
            
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
                  placeholder="e.g., Food, Rent, Salary"
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
                {editingId ? 'Save Changes' : 'Add Transaction'}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
