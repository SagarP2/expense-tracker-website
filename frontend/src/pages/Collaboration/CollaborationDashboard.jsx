import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { TableResponsive } from '../../components/ui/TableResponsive';
import {
  getCollaboration,
  getCollabTransactions,
  addCollabTransaction,
  deleteCollabTransaction,
  updateCollabTransaction,
  getBalanceSummary,
  settlePayment,
  requestDeletion,
  acceptDeletion,
  rejectDeletion,
  requestSettlement,
  acceptSettlementRequest,
  rejectSettlementRequest
} from '../../services/collabApi';
import { AlertModal } from '../../components/ui/AlertModal';
import { PaymentModal } from '../../components/PaymentModal';
import { MiniStatsStrip, WeeklyActivityWidget, CategoryHighlightWidget, IncomeExpenseBreakdownWidget, CategoryRadialWidget, SpendingPatternWidget } from '../../components/DashboardWidgets';
import { Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie } from 'recharts';
import { getCategoryHighlight } from '../../utils/dashboardUtils';

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

// ... (inside component)


import { formatCurrency } from '../../utils/format';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { getMiniStats } from '../../utils/dashboardUtils';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ArrowLeft,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Wallet
} from 'lucide-react';
// Recharts import consolidated at the top
import clsx from 'clsx';

const computeSettlement = (userA, userB, settlements = { userA_paid: 0, userA_received: 0, userB_paid: 0, userB_received: 0 }) => {
  const totalExpense = userA.total_expense + userB.total_expense;
  const splitAmount = totalExpense / 2;

  // Base balance from shared expenses
  let userABalance = userA.total_expense - splitAmount;

  // Apply settlements
  // If User A paid settlement, they reduced their debt (add to balance)
  // If User A received settlement, they were paid back (subtract from balance)
  userABalance = userABalance + settlements.userA_paid - settlements.userA_received;

  // Round balances to 2 decimal places for comparison
  userABalance = Math.round(userABalance * 100) / 100;

  let final_statement = 'Both are settled';
  let owedAmount = 0;
  let payer = null;
  let receiver = null;

  // Use 0.01 threshold for balance comparison
  if (Math.abs(userABalance) > 0.01) {
    if (userABalance > 0) {
      // User A paid more than split (or settled debt), so B owes A
      payer = 'userB';
      receiver = 'userA';
      owedAmount = Math.abs(userABalance);
    } else {
      // User A paid less than split, so A owes B
      payer = 'userA';
      receiver = 'userB';
      owedAmount = Math.abs(userABalance);
    }

    // Name formatting logic
    const cleanName = (name) => name ? name.trim().split(/\s+/) : ['', ''];
    // Identify payer/receiver objects
    const payerObj = payer === 'userA' ? userA : userB;
    const receiverObj = receiver === 'userA' ? userA : userB;

    const [payerFirst, ...payerRest] = cleanName(payerObj.name);
    const payerSurname = payerRest.join(' ');

    const [receiverFirst, ...receiverRest] = cleanName(receiverObj.name);
    const receiverSurname = receiverRest.join(' ');

    let displayPayer = payerFirst;
    let displayReceiver = receiverFirst;

    // Check for first name collision
    if (payerFirst.toLowerCase() === receiverFirst.toLowerCase()) {
      const hasPayerSurname = payerSurname.length > 0;
      const hasReceiverSurname = receiverSurname.length > 0;

      if (!hasPayerSurname && !hasReceiverSurname) {
        displayPayer = payerObj.name;
        displayReceiver = receiverObj.name;
      } else {
        const pLen = hasPayerSurname ? payerSurname.length : Number.MAX_SAFE_INTEGER;
        const rLen = hasReceiverSurname ? receiverSurname.length : Number.MAX_SAFE_INTEGER;

        if (pLen < rLen) {
          displayPayer = payerSurname;
          displayReceiver = receiverFirst;
        } else if (rLen < pLen) {
          displayReceiver = receiverSurname;
          displayPayer = payerFirst; // Ensure other user shows first name
        } else {
          // Fallback for equality
          displayPayer = payerObj.name;
          displayReceiver = receiverObj.name;
        }
      }
    }

    final_statement = `${displayPayer} Paid To ${displayReceiver} ₹${formatCurrency(owedAmount).replace('₹', '')}`;
  }

  return {
    final_statement,
    owedAmount,
    payer, // 'userA' or 'userB' string
    receiver, // 'userA' or 'userB' string
    split_amount: splitAmount,
    total_expense: totalExpense
  };
};

export default function CollaborationDashboard() {

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { socket } = useNotifications();

  // Refs must be declared before useState hooks
  const userASettlementRef = useRef(null);
  const userBSettlementRef = useRef(null);

  const [collaboration, setCollaboration] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [lockedType, setLockedType] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [dashboardView, setDashboardView] = useState('overview'); // 'overview' or 'transactions'
  const [filter, setFilter] = useState({
    userId: '',
    search: '',
    type: '',
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear().toString(),
    viewMode: 'month' // 'month' or 'year'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    customCategory: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' // 'success', 'error', 'info'
  });

  const [categoryColors, setCategoryColors] = useState(() => {
    try {
      const saved = localStorage.getItem('expenseTracker_categoryColors');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
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

  const defaultCategories = {
    expense: ['Food', 'Rent', 'Bill', 'Traveling', 'Personal', 'Other'],
    income: ['Salary', 'Home', 'Other']
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { month: filter.month };
      const [collabData, transactionsData, balanceData] = await Promise.all([
        getCollaboration(id),
        getCollabTransactions(id, params),
        getBalanceSummary(id, params)
      ]);
      setCollaboration(collabData);
      setTransactions(transactionsData);
      setBalance(balanceData);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch data', error);
      // If collaboration not found (deleted), navigate back to list
      if (error.response?.status === 404) {
        navigate('/collaborations');
      } else {
        setError('Failed to load collaboration data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, filter.month, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll for collaboration status when deletion is requested
  useEffect(() => {
    if (!collaboration?.deletionRequest?.requestedBy) return;

    const interval = setInterval(() => {
      fetchData();
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [collaboration?.deletionRequest?.requestedBy, fetchData]);

  // Check for navigation state to open Payment Modal
  useEffect(() => {
    if (location.state?.openPaymentModal) {
      setShowPaymentModal(true);
      // Clean up state to prevent reopening on refresh (optional, but good practice)
      // navigate(location.pathname, { replace: true, state: {} });
      // Actually, clearing state might be tricky if we want to keep other state.
      // For now, just opening it is enough.

      // Clear the state without reloading
      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // compute final category: if user is in "other" input mode, use customCategory value
    const categoryToSave = formData.category === '__other__'
      ? (formData.customCategory ?? '').trim()
      : (formData.category ?? '').trim();

    if (!categoryToSave) {
      setAlertState({
        isOpen: true,
        title: 'Missing Category',
        message: 'Please provide a category.',
        type: 'error'
      });
      return;
    }

    // Build payload with sanitized values
    const payload = {
      amount: parseFloat(formData.amount) || 0,
      type: formData.type,
      category: categoryToSave,
      description: formData.description ?? '',
      date: formData.date,
    };

    try {
      if (editingId) {
        await updateCollabTransaction(id, editingId, payload);
      } else {
        await addCollabTransaction(id, payload);
      }

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
      fetchData();
    } catch (error) {
      console.error('Failed to save transaction', error);
    }
  };

  const handleDelete = async (transactionId) => {
    const transaction = transactions.find(t => t._id === transactionId);

    // Prevent deletion of settlement transactions
    if (transaction && (transaction.category === 'Settlement' || transaction.category === 'Settlement Received')) {
      setAlertState({
        isOpen: true,
        title: 'Action Not Allowed',
        message: "Settlement transactions cannot be deleted.",
        type: 'error'
      });
      setDeleteDialog({ isOpen: false, id: null });
      return;
    }

    if (transaction && transaction.userId._id !== user._id) {
      setAlertState({
        isOpen: true,
        title: 'Permission Denied',
        message: "You can't delete collaborator data",
        type: 'error'
      });
      setDeleteDialog({ isOpen: false, id: null });
      return;
    }

    try {
      await deleteCollabTransaction(id, transactionId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete transaction', error);
    }
  };

  const handleEdit = (t) => {
    setEditingId(t._id);
    setLockedType(null);

    // Determine whether category is a default option or custom
    const type = t.type || 'expense';
    const isDefaultCategory = defaultCategories[type]?.includes(t.category);

    setFormData({
      amount: t.amount,
      type: t.type || 'expense',
      category: isDefaultCategory ? t.category : '__other__', // show input if custom
      customCategory: isDefaultCategory ? '' : (t.category ?? ''),
      description: t.description ?? '',
      date: new Date(t.date).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handlePayment = async (paymentMethod, customAmount, paymentReason) => {
    if (!displayBalance || displayBalance.owedAmount === 0) return;
    if (paymentLoading) return; // Prevent duplicate submissions

    setPaymentLoading(true);
    try {
      // Use the explicit payer and receiver objects from displayBalance
      const payerUser = displayBalance.payer;
      const receiverUser = displayBalance.receiver;

      if (!payerUser || !receiverUser) {
        throw new Error("Could not identify payer or receiver");
      }

      const paymentData = {
        payerId: payerUser.id,
        receiverId: receiverUser.id,
        amount: customAmount || displayBalance.owedAmount, // Use custom amount if provided
        method: paymentMethod,
        reason: paymentReason // Add reason for partial payments
      };

      const response = await settlePayment(id, paymentData);

      // Close modal first
      setShowPaymentModal(false);

      // Show success message
      setAlertState({
        isOpen: true,
        title: 'Payment Successful',
        message: `Payment of ${formatCurrency(customAmount || displayBalance.owedAmount)} settled successfully!`,
        type: 'success'
      });

      // Refresh data instead of reloading page
      await fetchData();
    } catch (error) {
      console.error('Failed to settle payment', error);
      setAlertState({
        isOpen: true,
        title: 'Payment Failed',
        message: error.response?.data?.message || 'Failed to settle payment. Please try again.',
        type: 'error'
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Deletion workflow handlers
  const handleRequestDeletion = async () => {
    if (deletionLoading) return; // Prevent duplicate requests

    setDeletionLoading(true);
    try {
      await requestDeletion(id);
      setAlertState({
        isOpen: true,
        title: 'Deletion Requested',
        message: 'Deletion request sent. Waiting for other user to accept.',
        type: 'success'
      });
      // Refresh collaboration data
      await fetchData();
    } catch (error) {
      console.error('Failed to request deletion', error);
      setAlertState({
        isOpen: true,
        title: 'Request Failed',
        message: error.response?.data?.message || 'Failed to request deletion.',
        type: 'error'
      });
    } finally {
      setDeletionLoading(false);
    }
  };

  const handleAcceptDeletion = async () => {
    if (deletionLoading) return; // Prevent duplicate requests

    setDeletionLoading(true);
    try {
      await acceptDeletion(id);
      setAlertState({
        isOpen: true,
        title: 'Collaboration Deleted',
        message: 'Collaboration has been deleted successfully. Redirecting...',
        type: 'success'
      });
      setTimeout(() => navigate('/collaborations'), 2000);
    } catch (error) {
      console.error('Failed to accept deletion', error);
      setAlertState({
        isOpen: true,
        title: 'Action Failed',
        message: error.response?.data?.message || 'Failed to delete collaboration capture.',
        type: 'error'
      });
    } finally {
      setDeletionLoading(false);
    }
  };

  const handleRejectDeletion = async () => {
    if (deletionLoading) return; // Prevent duplicate requests

    setDeletionLoading(true);
    try {
      await rejectDeletion(id);
      setAlertState({
        isOpen: true,
        title: 'Deletion Rejected',
        message: 'Deletion request has been rejected.',
        type: 'success'
      });
      // Refresh collaboration data
      await fetchData();
    } catch (error) {
      console.error('Failed to reject deletion', error);
      setAlertState({
        isOpen: true,
        title: 'Action Failed',
        message: error.response?.data?.message || 'Failed to reject deletion.',
        type: 'error'
      });
    } finally {
      setDeletionLoading(false);
    }
  };

  // Settlement Request Handlers
  const handleRequestSettlement = async () => {
    if (!displayBalance || displayBalance.owedAmount <= 0) return;
    setLoading(true);
    try {
      await requestSettlement(id, {
        amount: displayBalance.owedAmount,
        method: 'UPI' // Default or allow selection if needed
      });
      setAlertState({
        isOpen: true,
        title: 'Request Sent',
        message: `Payment request of ${formatCurrency(displayBalance.owedAmount)} sent successfully.`,
        type: 'success'
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to request settlement', error);
      setAlertState({
        isOpen: true,
        title: 'Request Failed',
        message: error.response?.data?.message || 'Failed to send request.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSettlement = async () => {
    setLoading(true);
    try {
      await acceptSettlementRequest(id);
      setAlertState({
        isOpen: true,
        title: 'Payment Successful',
        message: 'Settlement request accepted and payment recorded.',
        type: 'success'
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to accept settlement', error);
      setAlertState({
        isOpen: true,
        title: 'Payment Failed',
        message: error.response?.data?.message || 'Failed to process payment.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Compute settlement

  const filteredTransactions = transactions.filter(t => {
    const matchesUser = filter.userId ? (t.userId?._id === filter.userId || t.userId === filter.userId) : true;
    const matchesType = filter.type ? t.type === filter.type : true;
    const matchesMonth = filter.month ? (t.date?.startsWith ? t.date.startsWith(filter.month) : new Date(t.date).toISOString().slice(0, 7) === filter.month) : true;
    const search = (filter.search ?? '').toLowerCase().trim();
    const matchesSearch = !search ||
      (t.description?.toLowerCase().includes(search)) ||
      (t.category?.toLowerCase().includes(search));
    return matchesUser && matchesType && matchesMonth && matchesSearch;
  }).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateB - dateA !== 0) return dateB - dateA;

    // If dates are same, sort by createdAt (newest first)
    const createdA = new Date(a.createdAt || 0);
    const createdB = new Date(b.createdAt || 0);
    return createdB - createdA;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter.search, filter.userId, filter.month, filter.type]);

  // Auto-scroll settlement lists to bottom to show latest settlements
  useEffect(() => {
    if (userASettlementRef.current) {
      userASettlementRef.current.scrollTop = userASettlementRef.current.scrollHeight;
    }
    if (userBSettlementRef.current) {
      userBSettlementRef.current.scrollTop = userBSettlementRef.current.scrollHeight;
    }
  }, [transactions, filter.month]); // Trigger when transactions or month changes

  // Columns for TableResponsive
  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      className: 'text-left pl-6',
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-100 rounded-lg text-text-muted">
            <Calendar size={16} />
          </div>
          <span className="text-sm font-medium text-text">
            {new Date(t.date).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}, {new Date(t.date).toLocaleDateString('en-GB').replace(/\//g, '-')}
          </span>
        </div>
      )
    },
    {
      header: 'Description',
      accessor: 'description',
      className: 'text-left',
      render: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-text truncate max-w-[200px]">{t.description || (t.category === '__other__' ? (t.customCategory ?? t.category) : t.category)}</span>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      className: 'text-left',
      render: (t) => {
        const displayCategory = t.category === '__other__' ? (t.customCategory ?? t.category) : t.category;
        return (
          <Badge variant="secondary" className="bg-neutral-50 text-text-muted border-neutral-200">
            {displayCategory}
          </Badge>
        );
      }
    },
    {
      header: 'Amount',
      accessor: 'amount',
      className: 'text-left',
      render: (t) => (
        <span className={clsx(
          "flex items-center gap-1 font-bold",
          t.type === 'income' ? 'text-success' : 'text-danger'
        )}>
          {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {formatCurrency(t.amount)}
        </span>
      )
    },
    {
      header: 'Paid By',
      accessor: 'userId.name',
      className: 'text-left',
      render: (t) => (
        <span className="text-sm text-text-muted font-medium">
          {t.userId?.name}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'text-right pr-6',
      render: (t) => (
        <div className="flex items-center justify-end gap-2">
          {t.category !== 'Settlement' && t.category !== 'Settlement Received' && (
            <>
              <Button variant="ghost" size="icon" onClick={() => handleEdit(t)} className="h-8 w-8 text-text-muted hover:text-primary hover:bg-primary/10">
                <Edit size={16} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ isOpen: true, id: t._id })} className="h-8 w-8 text-text-muted hover:text-danger hover:bg-danger/10">
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const renderMobileItem = (t) => {
    const displayCategory = t.category === '__other__' ? (t.customCategory ?? t.category) : t.category;
    return (
      <Card className="p-4 mb-3 hover:bg-neutral-50/50 transition-colors border-neutral-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
            )}>
              {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
            <div>
              <p className="font-semibold text-text text-sm">{t.description || displayCategory}</p>
              <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                <Calendar size={10} />
                {new Date(t.date).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}, {new Date(t.date).toLocaleDateString('en-GB').replace(/\//g, '-')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={clsx(
              "font-bold text-sm block",
              t.type === 'income' ? 'text-success' : 'text-danger'
            )}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </span>
            <span className="text-xs text-text-muted block mt-0.5">by {t.userId?.name}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <Badge variant="outline" className="text-xs font-normal bg-neutral-50 text-text-muted border-neutral-200">
            {displayCategory}
          </Badge>
          <div className="flex gap-2">
            {t.category !== 'Settlement' && t.category !== 'Settlement Received' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(t)} className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50">
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ isOpen: true, id: t._id })} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // Listen for deletion event
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notif) => {
      if (notif.type === 'COLLAB_DELETED' && notif.payload.collabId === id) {
        setAlertState({
          isOpen: true,
          title: 'Collaboration Deleted',
          message: 'This collaboration was deleted by the other user.',
          type: 'info'
        });
        setTimeout(() => navigate('/collaborations'), 2000);
      }
    };

    socket.on('notification:new', handleNotification);

    return () => {
      socket.off('notification:new', handleNotification);
    };
  }, [socket, id, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-danger text-lg mb-4">{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    </div>
  );

  if (!collaboration) return null;

  const otherUser = collaboration.users.find(u => u._id !== user?._id);

  // 1. Filter for Summary (based on View Mode)
  const monthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);

    if (filter.viewMode === 'month') {
      const matchesMonth = filter.month ? (t.date?.startsWith ? t.date.startsWith(filter.month) : tDate.toISOString().slice(0, 7) === filter.month) : true;
      return matchesMonth;
    } else {
      // Year View
      if (!filter.year) return true;
      const tYear = tDate.getFullYear().toString();
      return tYear === filter.year;
    }
  });

  // 2. Calculate Summary based on Month Data
  const calculateSummary = () => {
    // Totals (Gross)
    const totalExpense = monthTransactions
      .filter(t => t.type === 'expense' && t.category !== 'Settlement')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = monthTransactions
      .filter(t => t.type === 'income' && t.category !== 'Settlement Received')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSavings = totalIncome - totalExpense;

    const userAId = balance.userA.id;
    const userBId = balance.userB.id;

    // Separate Shared Expenses/Income from Settlements
    const userAExpense = monthTransactions
      .filter(t => t.userId._id === userAId && t.type === 'expense' && t.category !== 'Settlement')
      .reduce((sum, t) => sum + t.amount, 0);

    const userAIncome = monthTransactions
      .filter(t => t.userId._id === userAId && t.type === 'income' && t.category !== 'Settlement Received')
      .reduce((sum, t) => sum + t.amount, 0);

    const userASettledPaid = monthTransactions
      .filter(t => t.userId._id === userAId && t.type === 'expense' && t.category === 'Settlement')
      .reduce((sum, t) => sum + t.amount, 0);

    const userASettledReceived = monthTransactions
      .filter(t => t.userId._id === userAId && t.type === 'income' && t.category === 'Settlement Received')
      .reduce((sum, t) => sum + t.amount, 0);

    const userBExpense = monthTransactions
      .filter(t => t.userId._id === userBId && t.type === 'expense' && t.category !== 'Settlement')
      .reduce((sum, t) => sum + t.amount, 0);

    const userBIncome = monthTransactions
      .filter(t => t.userId._id === userBId && t.type === 'income' && t.category !== 'Settlement Received')
      .reduce((sum, t) => sum + t.amount, 0);

    const userBSettledPaid = monthTransactions
      .filter(t => t.userId._id === userBId && t.type === 'expense' && t.category === 'Settlement')
      .reduce((sum, t) => sum + t.amount, 0);

    const userBSettledReceived = monthTransactions
      .filter(t => t.userId._id === userBId && t.type === 'income' && t.category === 'Settlement Received')
      .reduce((sum, t) => sum + t.amount, 0);

    // Get individual settlement transactions for breakdown
    // Get individual settlement transactions for breakdown
    const userASettlements = monthTransactions
      .filter(t => t.userId._id === userAId && (t.category === 'Settlement' || t.category === 'Settlement Received'))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const userBSettlements = monthTransactions
      .filter(t => t.userId._id === userBId && (t.category === 'Settlement' || t.category === 'Settlement Received'))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Savings (Gross)
    const userASavings = (userAIncome + userASettledReceived) - (userAExpense + userASettledPaid);
    const userBSavings = (userBIncome + userBSettledReceived) - (userBExpense + userBSettledPaid);

    // Settlement Logic using pure function
    const settlement = computeSettlement(
      { name: balance.userA.name, total_expense: userAExpense },
      { name: balance.userB.name, total_expense: userBExpense },
      {
        userA_paid: userASettledPaid,
        userA_received: userASettledReceived,
        userB_paid: userBSettledPaid,
        userB_received: userBSettledReceived
      }
    );

    // Map 'userA'/'userB' strings back to actual user objects
    const payer = settlement.payer === 'userA' ? balance.userA : (settlement.payer === 'userB' ? balance.userB : null);
    const receiver = settlement.receiver === 'userA' ? balance.userA : (settlement.receiver === 'userB' ? balance.userB : null);

    // Calculate balances for individual cards (for "Owes/Gets back" display)
    // Note: This display usually reflects the *current* standing, so it should match the settlement logic
    // userABalance in the card should be the final balance after settlements
    const amountEachShouldPay = settlement.split_amount;

    // Recalculate individual balances to include settlements for display
    let userABalance = (userAExpense - amountEachShouldPay) + userASettledPaid - userASettledReceived;
    let userBBalance = (userBExpense - amountEachShouldPay) + userBSettledPaid - userBSettledReceived;

    userABalance = Math.round(userABalance * 100) / 100;
    userBBalance = Math.round(userBBalance * 100) / 100;

    return {
      total_expense: totalExpense,
      total_income: totalIncome,
      total_savings: totalSavings,
      amount_each_should_pay: amountEachShouldPay,
      userA: {
        id: userAId,
        name: balance.userA.name,
        total_expense: userAExpense, // Shared expense only
        total_income: userAIncome,
        savings: userASavings,
        balance: userABalance,
        settlements: userASettlements
      },
      userB: {
        id: userBId,
        name: balance.userB.name,
        total_expense: userBExpense, // Shared expense only
        total_income: userBIncome,
        savings: userBSavings,
        balance: userBBalance,
        settlements: userBSettlements
      },
      final_statement: settlement.final_statement,
      owedAmount: settlement.owedAmount,
      payer,
      receiver
    };
  };

  const displayBalance = calculateSummary();

  // Process data for charts
  const categoryData = filteredTransactions
    .filter(t => t.type === 'expense' && t.category !== 'Settlement')
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

  const categoryHighlight = getCategoryHighlight(filteredTransactions);

  // Chart Data (Expense Distribution) - Optional, but if we keep it, use month data
  const chartData = [
    { name: balance.userA.name, value: displayBalance.userA.total_expense, color: '#2563eb' },
    { name: balance.userB.name, value: displayBalance.userB.total_expense, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Calculate mini stats for the strip widget
  const miniStats = getMiniStats(filteredTransactions, displayBalance.total_expense);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-surface/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/collaborations')}
            className="rounded-full hover:bg-surface-highlight"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Users size={24} />
              </div>
              Shared with {otherUser?.name}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-text-muted text-sm sm:text-base">
              <p className="bg-surface/50">{otherUser?.email}</p>
            </div>
          </div>
        </div>



        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-xl border border-border shadow-sm w-full sm:w-auto">
          <div className="flex bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setFilter(prev => ({ ...prev, viewMode: 'month' }))}
              className={clsx(
                "flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                filter.viewMode === 'month' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
              )}
            >
              Month
            </button>
            <button
              onClick={() => setFilter(prev => ({ ...prev, viewMode: 'year' }))}
              className={clsx(
                "flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                filter.viewMode === 'year' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
              )}
            >
              Year
            </button>
          </div>

          <div className="h-6 w-px bg-border mx-1"></div>

          {/* Date Selection */}

          {filter.viewMode === 'month' ? (
            <div className="relative flex items-center">
              <Calendar size={16} className="absolute left-2 text-text-muted pointer-events-none" />
              <input
                type="month"
                className="pl-7 pr-2 py-1 bg-transparent text-sm font-medium text-text focus:outline-none cursor-pointer w-full sm:w-auto"
                value={filter.month}
                onChange={(e) => setFilter({ ...filter, month: e.target.value })}
                onKeyDown={(e) => e.preventDefault()}
              />
            </div>
          ) : (
            <div className="relative flex items-center">
              <Calendar size={16} className="absolute left-2 text-text-muted pointer-events-none" />
              <select
                className="pl-7 pr-2 py-1 bg-transparent text-sm font-medium text-text focus:outline-none cursor-pointer w-full sm:w-auto"
                value={filter.year}
                onChange={(e) => setFilter({ ...filter, year: e.target.value })}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

            </div>
          )}
        </div>
      </div>

      {/* Pending Deletion Alert */}
      {collaboration.deletionRequest?.requestedBy && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-600" size={24} />
              <div>
                <h3 className="font-semibold text-yellow-900">Deletion Requested</h3>
                <p className="text-sm text-yellow-700">
                  {collaboration.deletionRequest.requestedBy._id === user?._id
                    ? 'You have requested to delete this collaboration. Waiting for approval.'
                    : `${collaboration.deletionRequest.requestedBy.name} has requested to delete this collaboration.`}
                </p>
              </div>
            </div>
            {collaboration.deletionRequest.requestedBy._id !== user?._id && (
              <div className="flex gap-2">
                <Button
                  onClick={handleAcceptDeletion}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Accept & Delete
                </Button>
                <Button
                  onClick={handleRejectDeletion}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Mini Stats Strip */}
      <MiniStatsStrip data={miniStats} />





      {/* 1. Income Summary Cards - Only show if there is income */}
      {displayBalance.total_income > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 dark:bg-none dark:bg-surface text-white dark:text-text border-none dark:border dark:border-border shadow-glow dark:shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <TrendingUp size={64} />
            </div>
            <div className="flex flex-col justify-between h-full relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-white/20 dark:bg-surface-highlight rounded-lg backdrop-blur-sm">
                  <TrendingUp size={20} className="text-white dark:text-emerald-500" />
                </div>
                <p className="text-emerald-50 dark:text-text-muted font-medium">Total Income</p>
              </div>
              <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(displayBalance.total_income)}</h3>
            </div>
          </Card>

          <Card hover className="border-l-4 border-l-emerald-500 bg-surface">
            <div className="flex items-center justify-between mb-4">
              <p className="text-text-muted font-medium text-sm">{displayBalance.userA.name}'s Income</p>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                {displayBalance.userA.name.charAt(0)}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text">{formatCurrency(displayBalance.userA.total_income)}</h3>
          </Card>

          <Card hover className="border-l-4 border-l-emerald-500 bg-surface">
            <div className="flex items-center justify-between mb-4">
              <p className="text-text-muted font-medium text-sm">{displayBalance.userB.name}'s Income</p>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                {displayBalance.userB.name.charAt(0)}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text">{formatCurrency(displayBalance.userB.total_income)}</h3>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 dark:bg-none dark:bg-surface text-white dark:text-text border-none dark:border dark:border-border shadow-glow dark:shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <PieChartIcon size={64} />
            </div>
            <div className="flex flex-col justify-between h-full relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-white/20 dark:bg-surface-highlight rounded-lg backdrop-blur-sm">
                  <PieChartIcon size={20} className="text-white dark:text-violet-500" />
                </div>
                <p className="text-violet-100 dark:text-text-muted font-medium">Total Savings</p>
              </div>
              <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(displayBalance.total_savings)}</h3>
              <p className="text-xs text-violet-100 dark:text-text-muted mt-1 opacity-80">Income - Expenses</p>
            </div>
          </Card>
        </div>
      )}

      {/* 2. Expense Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-rose-500 to-pink-600 dark:bg-none dark:bg-surface text-white dark:text-text border-none dark:border dark:border-border shadow-glow dark:shadow-sm relative overflow-hidden p-5">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <TrendingDown size={64} />
          </div>
          <div className="flex flex-col justify-between h-full relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/20 dark:bg-surface-highlight rounded-lg backdrop-blur-sm">
                <TrendingDown size={18} className="text-white dark:text-rose-500" />
              </div>
              <p className="text-rose-100 dark:text-text-muted font-medium">Total Expenses</p>
            </div>
            <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(displayBalance.total_expense)}</h3>
            <p className="text-xs text-rose-100 dark:text-text-muted mt-1 opacity-80">Split equally: {formatCurrency(displayBalance.amount_each_should_pay)}</p>
          </div>
        </Card>

        <Card hover className="border-l-4 border-l-blue-500 bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-text-muted font-medium text-sm">{displayBalance.userA.name}'s Expense</p>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {displayBalance.userA.name.charAt(0)}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-text">{formatCurrency(displayBalance.userA.total_expense)}</h3>
          <p className={clsx(
            "text-xs mt-2 font-medium px-2 py-1 rounded-lg w-fit",
            displayBalance.userA.balance > 0 ? "text-success bg-success/10" : displayBalance.userA.balance < 0 ? "text-danger bg-danger/10" : "text-text-muted bg-neutral-100"
          )}>
            {displayBalance.userA.balance > 0 ? `Gets back ${formatCurrency(Math.abs(displayBalance.userA.balance))}` :
              displayBalance.userA.balance < 0 ? `Pays ${formatCurrency(Math.abs(displayBalance.userA.balance))}` :
                'Settled'}
          </p>
        </Card>

        <Card hover className="border-l-4 border-l-rose-500 bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-text-muted font-medium text-sm">{displayBalance.userB.name}'s Expense</p>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm">
              {displayBalance.userB.name.charAt(0)}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-text">{formatCurrency(displayBalance.userB.total_expense)}</h3>
          <p className={clsx(
            "text-xs mt-2 font-medium px-2 py-1 rounded-lg w-fit",
            displayBalance.userB.balance > 0 ? "text-success bg-success/10" : displayBalance.userB.balance < 0 ? "text-danger bg-danger/10" : "text-text-muted bg-neutral-100"
          )}>
            {displayBalance.userB.balance > 0 ? `Gets back ${formatCurrency(Math.abs(displayBalance.userB.balance))}` :
              displayBalance.userB.balance < 0 ? `Pays ${formatCurrency(Math.abs(displayBalance.userB.balance))}` :
                'Settled'}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:bg-none dark:bg-surface text-white dark:text-text border-none dark:border dark:border-border shadow-glow dark:shadow-sm relative overflow-hidden p-5">
          <div className="absolute top-5 right-5 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="m11 17 2 2a1 1 0 1 0 3-3" />
              <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
              <path d="m21 3 1 11h-2" />
              <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
              <path d="M3 4h8" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <p className="text-blue-100 dark:text-text-muted font-medium mb-1.5">Settlement</p>
              <p className="text-xl font-bold text-white dark:text-text leading-tight">
                {displayBalance.final_statement}
              </p>
            </div>
            <div className="flex flex-col">
              {displayBalance.owedAmount > 0 && (
                <div className="mt-4 flex gap-4 w-full justify-between">
                  {/* Pending Request Status */}
                  {collaboration.settlementRequest?.requestedBy && (
                    <p className="text-xs text-blue-200 mb-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Request Pending:<br></br> {formatCurrency(collaboration.settlementRequest.amount)}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end ml-auto">
                    {/* Pay Now Button */}
                    {user && displayBalance.payer && displayBalance.payer.id === user._id && (
                      <Button
                        onClick={() => setShowPaymentModal(true)}
                        size="sm"
                        className="w-fit bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm shadow-sm"
                      >
                        <Wallet size={14} className="mr-1" />
                        Pay Now
                      </Button>
                    )}

                    {/* Request Payment Button */}
                    {user && displayBalance.receiver && displayBalance.receiver.id === user._id && (
                      <Button
                        onClick={handleRequestSettlement}
                        size="sm"
                        disabled={collaboration.settlementRequest?.requestedBy && Math.abs(collaboration.settlementRequest.amount - displayBalance.owedAmount) < 0.01}
                        className={`w-fit bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm shadow-sm ${collaboration.settlementRequest?.requestedBy && Math.abs(collaboration.settlementRequest.amount - displayBalance.owedAmount) < 0.01
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                          }`}
                      >
                        {collaboration.settlementRequest?.requestedBy && Math.abs(collaboration.settlementRequest.amount - displayBalance.owedAmount) < 0.01
                          ? 'Requested'
                          : <>
                            <Wallet size={14} className="mr-1" />
                            Request
                          </>}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        payer={displayBalance?.payer?.name || ''}
        receiver={displayBalance?.receiver?.name || ''}
        amount={displayBalance?.owedAmount || 0}
        onConfirm={handlePayment}
      />

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />

      {/* 3. Savings Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        <Card className="p-4 border border-gray-100">
          <h4 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
            <div className="w-1 h-5 bg-primary rounded-full"></div>
            {displayBalance.userA.name}'s Savings Breakdown
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Income</span>
              <span className="text-success font-medium">+{formatCurrency(displayBalance.userA.total_income)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Expense</span>
              <span className="text-danger font-medium">-{formatCurrency(displayBalance.userA.total_expense)}</span>
            </div>

            {/* Settlements */}
            <div ref={userASettlementRef} className="max-h-[80px] overflow-y-auto pr-1 custom-scrollbar space-y-2">
              {displayBalance.userA.settlements.map((s, index) => (
                <div key={s._id} className="flex justify-between text-sm">
                  <span className="text-text-muted">Settlement {index + 1}</span>
                  <span className={s.type === 'income' ? "text-success font-medium" : "text-danger font-medium"}>
                    {s.type === 'income' ? '+' : '-'}{formatCurrency(s.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="h-px bg-gray-100 my-2"></div>
            <div className="flex justify-between font-bold">
              <span className="text-text">Net Savings</span>
              <span className={displayBalance.userA.savings >= 0 ? "text-success" : "text-danger"}>
                {formatCurrency(displayBalance.userA.savings)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-gray-100">
          <h4 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
            <div className="w-1 h-5 bg-red-500 rounded-full"></div>
            {displayBalance.userB.name}'s Savings Breakdown
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Income</span>
              <span className="text-success font-medium">+{formatCurrency(displayBalance.userB.total_income)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Expense</span>
              <span className="text-danger font-medium">-{formatCurrency(displayBalance.userB.total_expense)}</span>
            </div>

            {/* Settlements */}
            <div ref={userBSettlementRef} className="max-h-[80px] overflow-y-auto pr-1 custom-scrollbar space-y-2">
              {displayBalance.userB.settlements.map((s, index) => (
                <div key={s._id} className="flex justify-between text-sm">
                  <span className="text-text-muted">Settlement {index + 1}</span>
                  <span className={s.type === 'income' ? "text-success font-medium" : "text-danger font-medium"}>
                    {s.type === 'income' ? '+' : '-'}{formatCurrency(s.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="h-px bg-gray-100 my-2"></div>
            <div className="flex justify-between font-bold">
              <span className="text-text">Net Savings</span>
              <span className={displayBalance.userB.savings >= 0 ? "text-success" : "text-danger"}>
                {formatCurrency(displayBalance.userB.savings)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions */}
      <div className="w-full">
        <Card className="w-full flex flex-col bg-surface border-border shadow-card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-text">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              {dashboardView === 'overview' ? 'Collaboration Overview' : 'Collaboration Transactions'}
            </h3>
            {/* View Toggle */}
            <div className="flex bg-neutral-100 rounded-lg p-1 self-start sm:self-auto">
              <button
                onClick={() => setDashboardView('overview')}
                className={clsx(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2",
                  dashboardView === 'overview' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
                )}
              >
                <PieChartIcon size={14} />
                Overview
              </button>
              <button
                onClick={() => setDashboardView('transactions')}
                className={clsx(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2",
                  dashboardView === 'transactions' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
                )}
              >
                <Wallet size={14} />
                Transactions
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-surface-highlight/30 p-4 rounded-2xl border border-border mb-6">
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 w-full xl:w-auto">
              {/* Search */}
              <div className="relative w-full xl:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-surface focus:bg-surface-highlight focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                />
              </div>
              {/* User Filter */}
              <div className="relative w-full sm:w-auto col-span-1">
                <select
                  className="w-full sm:w-auto pl-4 pr-10 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium appearance-none cursor-pointer hover:border-primary/50"
                  value={filter.userId}
                  onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
                >
                  <option value="">All Users</option>
                  {collaboration.users.map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <Filter size={14} />
                </div>
              </div>

              {/* Type Filter */}
              <div className="relative w-full sm:w-auto col-span-1">
                <select
                  className="w-full sm:w-auto pl-4 pr-10 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium appearance-none cursor-pointer hover:border-primary/50"
                  value={filter.type}
                  onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <Filter size={14} />
                </div>
              </div>
            </div>



            <div className="flex flex-wrap gap-3 w-full xl:w-auto">
              <Button onClick={() => {
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
              }} className="flex-1 xl:flex-none items-center justify-center gap-2 shadow-glow bg-success hover:bg-success/90 text-white border-none">
                <Plus size={20} />
                Add Income
              </Button>
              <Button onClick={() => {
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
              }} className="flex-1 xl:flex-none items-center justify-center gap-2 shadow-glow bg-danger hover:bg-danger/90 text-white border-none">
                <Plus size={20} />
                Add Expense
              </Button>
              {/* Pay / Request Buttons (Moved from Settlement Card) */}
              {/* Buttons moved to Settlement Widget */}
            </div>
          </div>

          {dashboardView === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 animate-slide-up pb-2">
              <div className="lg:col-span-2">
                <IncomeExpenseBreakdownWidget
                  totalIncome={filteredTransactions
                    .filter(t => t.type === 'income' && t.category !== 'Settlement Received')
                    .reduce((sum, t) => sum + t.amount, 0)}
                  totalExpense={filteredTransactions
                    .filter(t => t.type === 'expense' && t.category !== 'Settlement')
                    .reduce((sum, t) => sum + t.amount, 0)}
                  categoryData={categoryData}
                />
              </div>
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[200px]">
                  <SpendingPatternWidget data={categoryData} />
                  <CategoryHighlightWidget category={categoryHighlight} />
                </div>
                <div className="flex-1 min-h-[200px]">
                  <WeeklyActivityWidget
                    transactions={filteredTransactions}
                    selectedMonth={filter.month}
                    selectedYear={filter.year}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <TableResponsive
                columns={columns}
                data={currentTransactions}
                renderMobileItem={renderMobileItem}
                emptyMessage="No transactions found matching your filters."
              />

              {/* Pagination Controls */}
              {filteredTransactions.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 mt-4 border-t border-border">
                  <div className="text-sm text-text-muted font-medium">
                    Showing <span className="text-text font-bold">{indexOfFirstTransaction + 1}</span> to <span className="text-text font-bold">{Math.min(indexOfLastTransaction, filteredTransactions.length)}</span> of <span className="text-text font-bold">{filteredTransactions.length}</span> transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="gap-1"
                    >
                      <ChevronLeft size={16} /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                          pageNum = currentPage - 2 + i;
                          if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                        }
                        if (pageNum < 1) pageNum = 1;
                        if (pageNum > totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={clsx(
                              "w-8 h-8 rounded-lg text-sm font-bold transition-all",
                              currentPage === pageNum
                                ? "bg-primary text-white shadow-md"
                                : "text-text-muted hover:bg-neutral-100"
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="gap-1"
                    >
                      Next <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div >

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Transaction' : lockedType === 'income' ? 'Add Income' : lockedType === 'expense' ? 'Add Expense' : 'Add Transaction'}
        description="Enter the details below"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* TYPE SELECTOR - Only show if not locked */}
          {!lockedType && (
            <div className="grid grid-cols-2 gap-4 p-1.5 bg-neutral-50 rounded-2xl border border-neutral-100">
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
                <div className="text-center py-3 rounded-xl text-sm font-bold text-text-muted transition-all peer-checked:bg-white peer-checked:text-danger peer-checked:shadow-sm">
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
                <div className="text-center py-3 rounded-xl text-sm font-bold text-text-muted transition-all peer-checked:bg-white peer-checked:text-success peer-checked:shadow-sm">
                  Income
                </div>
              </label>
            </div>
          )}

          <div className="space-y-4">
            {/* AMOUNT */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Amount</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="text-lg font-bold py-3"
              />
            </div>

            {/* CATEGORY FIELD */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Category</label>
              {formData.category === '__other__' ? (
                <Input
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
                  className="py-3"
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
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer text-sm font-medium appearance-none"
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Description</label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What was this for?"
                className="py-3"
              />
            </div>

            {/* DATE */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Date</label>
              <Input
                type="date"
                value={formData.date}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
                className="py-3"
              />
            </div>
          </div>

          <Button type="submit" className="w-full py-4 text-base font-bold shadow-lg shadow-primary/25 mt-4 rounded-xl hover:scale-[1.02] transition-transform">
            {editingId ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </form>
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
