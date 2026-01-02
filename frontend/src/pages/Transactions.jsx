import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { TableResponsive } from '../components/ui/TableResponsive';
import api from '../utils/axiosInstance';
import { formatCurrency } from '../utils/format';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Plus, Search, Trash2, Edit2, Filter, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import clsx from 'clsx';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [lockedType, setLockedType] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    customCategory: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // include month filter (default to current month)
  const [filter, setFilter] = useState({
    type: '',
    search: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
  });

  // default categories (for UI only). Keep synced with backend defaults if any.
  const defaultCategories = {
    expense: ['Food', 'Rent', 'Bill', 'Traveling', 'Personal', 'Other'],
    income: ['Salary', 'Home', 'Other'],
  };

  const fetchTransactions = useCallback(async () => {
    try {
      const { data } = await api.get('/transactions');
      setTransactions(data);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // Prevent duplicate submissions

    // Compute final category to save:
    const categoryToSave =
      formData.category === '__other__'
        ? (formData.customCategory ?? '').trim()
        : (formData.category ?? '').trim();

    if (!categoryToSave) {
      alert('Please provide a category.');
      return;
    }

    // Build payload
    const payload = {
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: categoryToSave,
      description: formData.description,
      date: formData.date,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
      } else {
        await api.post('/transactions', payload);
      }

      // Close modal & reset form
      setShowModal(false);
      setEditingId(null);
      setFormData({
        amount: '',
        type: 'expense',
        category: '',
        customCategory: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });

      // Refresh list
      await fetchTransactions();
    } catch (error) {
      console.error('Failed to save transaction', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (error) {
      console.error('Failed to delete transaction', error);
    }
  };

  const handleEdit = (t) => {
    setEditingId(t._id);
    setLockedType(null);

    // Determine whether category is a default option or a custom one
    const isDefaultCategory = defaultCategories[t.type || 'expense'].includes(t.category);

    setFormData({
      amount: t.amount,
      type: t.type,
      category: isDefaultCategory ? t.category : '__other__',
      customCategory: isDefaultCategory ? '' : t.category,
      description: t.description || '',
      date: new Date(t.date).toISOString().split('T')[0],
    });

    setShowModal(true);
  };

  // Filter transactions for display
  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filter.type ? t.type === filter.type : true;

    const search = (filter.search ?? '').trim().toLowerCase();
    const matchesSearch =
      !search ||
      (t.description && t.description.toLowerCase().includes(search)) ||
      (t.category && t.category.toLowerCase().includes(search));

    const matchesMonth = filter.month
      ? (() => {
        try {
          const tMonth = new Date(t.date).toISOString().slice(0, 7); // YYYY-MM
          return tMonth === filter.month;
        } catch (err) {
          return typeof t.date === 'string' && t.date.startsWith(filter.month);
        }
      })()
      : true;

    return matchesType && matchesSearch && matchesMonth;
  }).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateB - dateA !== 0) return dateB - dateA;

    // If dates are same, sort by createdAt (newest first)
    const createdA = new Date(a.createdAt || 0);
    const createdB = new Date(b.createdAt || 0);
    return createdB - createdA;
  });

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      className: 'w-[210px]',
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-100 rounded-lg text-text-muted group-hover:bg-white group-hover:text-primary group-hover:shadow-sm transition-all">
            <Calendar size={18} />
          </div>
          <span className="font-medium text-sm whitespace-nowrap text-text">
            {new Date(t.date).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}, {new Date(t.date).toLocaleDateString('en-GB').replace(/\//g, '-')}
          </span>
        </div>
      )
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (t) => <span className="font-medium text-text truncate max-w-[240px] block">{t.description}</span>
    },
    {
      header: 'Category',
      accessor: 'category',
      className: 'w-[180px]',
      render: (t) => (
        <Badge variant="outline" className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-50 border-neutral-200 text-text-secondary">
          {t.category}
        </Badge>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      className: 'w-[180px]',
      render: (t) => (
        <span
          className={clsx(
            'flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border',
            t.type === 'income'
              ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
              : 'text-rose-700 bg-rose-50 border-rose-100'
          )}
        >
          {t.type === 'income' ? <ArrowUpRight size={16} strokeWidth={2.5} /> : <ArrowDownRight size={16} strokeWidth={2.5} />}
          {formatCurrency(t.amount)}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'text-right w-[120px]',
      render: (t) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(t); }} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
            <Edit2 size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteDialog({ isOpen: true, id: t._id }); }} className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-all">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  const renderMobileItem = (t) => (
    <Card className="p-3 sm:p-4 bg-surface border-border shadow-sm">
      <div className="flex flex-col gap-2 sm:gap-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-text text-sm sm:text-base truncate max-w-[140px] sm:max-w-[200px]">{t.description || t.category}</p>
            <p className="text-[10px] sm:text-xs text-text-muted flex items-center gap-1 mt-1 font-medium">
              <Calendar size={12} className="text-primary/60" />
              {new Date(t.date).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}, {new Date(t.date).toLocaleDateString('en-GB').replace(/\//g, '-')}
            </p>
          </div>
          <span
            className={clsx(
              'font-bold text-sm sm:text-base flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg shrink-0',
              t.type === 'income' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
            )}
          >
            {t.type === 'income' ? '+' : '-'}
            {formatCurrency(t.amount)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border/50">
          <Badge variant="outline" className="bg-neutral-50 border-neutral-200 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs">
            {t.category}
          </Badge>
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); handleEdit(t); }} className="p-1.5 sm:p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
              <Edit2 size={14} className="sm:w-4 sm:h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setDeleteDialog({ isOpen: true, id: t._id }); }} className="p-1.5 sm:p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
              <Trash2 size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-surface/40 backdrop-blur-md p-3 sm:p-4 rounded-3xl border border-white/20 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold text-text tracking-tight">Transactions</h2>
          <p className="text-text-muted mt-1 font-medium text-xs sm:text-base">Manage your financial records</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            onClick={() => {
              setEditingId(null);
              setLockedType('income');
              setFormData({
                amount: '',
                type: 'income',
                category: '',
                customCategory: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
              });
              setShowModal(true);
            }}
            className="flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-1 py-2 sm:px-4 sm:py-2 text-sm font-bold shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-600 dark:bg-none dark:bg-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white border-none transition-all hover:-translate-y-0.5"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            Add Income
          </Button>
          <Button
            onClick={() => {
              setEditingId(null);
              setLockedType('expense');
              setFormData({
                amount: '',
                type: 'expense',
                category: '',
                customCategory: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
              });
              setShowModal(true);
            }}
            className="flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-1 py-2 sm:px-4 sm:py-2 text-sm font-bold shadow-lg shadow-rose-500/20 bg-gradient-to-r from-rose-500 to-pink-600 dark:bg-none dark:bg-rose-600 hover:from-rose-600 hover:to-pink-700 text-white border-none transition-all hover:-translate-y-0.5"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 bg-surface/30 p-2 rounded-2xl border border-white/40 shadow-sm">
        <div className="relative flex-1 group w-full sm:w-auto">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full pl-9 sm:pl-11 pr-4 py-2 sm:py-3 text-sm rounded-xl border-none bg-surface/50 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/10 shadow-sm transition-all placeholder:text-text-muted/70 text-text"
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-row gap-2 w-full sm:w-auto">
          {/* Month filter */}
          <div className="relative flex-1 sm:flex-none">
            <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
            <input
              type="month"
              className="pl-9 sm:pl-11 pr-2 sm:pr-4 py-2 sm:py-3 rounded-xl border-none bg-surface/50 
                 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/10 
                 shadow-sm transition-all cursor-pointer text-xs sm:text-sm font-medium text-text w-full sm:w-auto min-w-0"
              value={filter.month}
              onChange={(e) => setFilter({ ...filter, month: e.target.value })}
              onKeyDown={(e) => e.preventDefault()}
            />
          </div>

          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
            <select
              className="pl-9 sm:pl-11 pr-8 sm:pr-10 py-2 sm:py-3 rounded-xl border-none bg-surface/50 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/10 shadow-sm transition-all cursor-pointer text-xs sm:text-sm font-medium text-text appearance-none w-full sm:w-auto min-w-0"
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-currentColor"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <TableResponsive
        columns={columns}
        data={filteredTransactions}
        renderMobileItem={renderMobileItem}
        keyExtractor={(item) => item._id}
        emptyMessage="No transactions found. Try adjusting your filters or add a new one."
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Transaction' : lockedType === 'income' ? 'Add Income' : lockedType === 'expense' ? 'Add Expense' : 'Add Transaction'}
      >
        <div className="pt-0 sm:pt-2">
          <p className="text-text-muted text-xs sm:text-sm mb-4 sm:mb-6">Enter the details below</p>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* TYPE SELECTOR - Only show if not locked */}
            {!lockedType && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 p-1 bg-neutral-50 rounded-2xl border border-neutral-100">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={formData.type === 'expense'}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value, category: '', customCategory: '' }))
                    }
                    className="hidden peer"
                  />
                  <div className="text-center py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold text-text-muted transition-all peer-checked:bg-white peer-checked:text-rose-600 peer-checked:shadow-sm">
                    Expense
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    checked={formData.type === 'income'}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value, category: '', customCategory: '' }))
                    }
                    className="hidden peer"
                  />
                  <div className="text-center py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold text-text-muted transition-all peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm">
                    Income
                  </div>
                </label>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              {/* AMOUNT */}
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Amount</label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="text-base sm:text-lg font-bold py-2.5 sm:py-3"
                />
              </div>

              {/* CATEGORY FIELD */}
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Category</label>
                {formData.category === '__other__' ? (
                  <input
                    type="text"
                    placeholder="Enter custom category"
                    value={formData.customCategory}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customCategory: e.target.value,
                        category: '__other__',
                      }))
                    }
                    onBlur={() => {
                      setFormData((prev) => {
                        if ((prev.customCategory ?? '').trim() !== '') {
                          return { ...prev, category: '__other__' };
                        } else {
                          return { ...prev, category: '', customCategory: '' };
                        }
                      });
                    }}
                    required
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  />
                ) : (
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'Other') {
                          setFormData((prev) => ({ ...prev, category: '__other__', customCategory: '' }));
                        } else {
                          setFormData((prev) => ({ ...prev, category: value, customCategory: '' }));
                        }
                      }}
                      required
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer text-sm font-medium appearance-none"
                    >
                      <option value="">Select Category</option>
                      {(formData.type === 'expense' ? defaultCategories.expense : defaultCategories.income).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-currentColor"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Description</label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="What was this for?"
                  className="py-2.5 sm:py-3 text-sm sm:text-base"
                />
              </div>

              {/* DATE */}
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  required
                  className="py-2.5 sm:py-3 text-sm sm:text-base"
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-3 sm:py-4 text-sm sm:text-base font-bold shadow-lg shadow-primary/25 mt-3 sm:mt-4 rounded-xl hover:scale-[1.02] transition-transform">
              {editingId ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </form>
        </div>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null })}
        onConfirm={() => handleDelete(deleteDialog.id)}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div >
  );
}
