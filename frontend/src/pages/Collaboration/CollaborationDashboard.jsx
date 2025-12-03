import { useState,useEffect,useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams,useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
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
  rejectDeletion
} from '../../services/collabApi';
import { AlertModal } from '../../components/ui/AlertModal';
import { PaymentModal } from '../../components/PaymentModal';

// ... (inside component)


import { formatCurrency } from '../../utils/format';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
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
  X
} from 'lucide-react';
import { PieChart,Pie,Cell,ResponsiveContainer,Tooltip } from 'recharts';
import clsx from 'clsx';

const computeSettlement = (userA,userB,settlements = { userA_paid: 0,userA_received: 0,userB_paid: 0,userB_received: 0 }) => {
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
      final_statement = `${userB.name} Paid To ${userA.name} ₹${formatCurrency(owedAmount).replace('₹','')}`;
    } else {
      // User A paid less than split, so A owes B
      payer = 'userA';
      receiver = 'userB';
      owedAmount = Math.abs(userABalance);
      final_statement = `${userA.name} Paid To ${userB.name} ₹${formatCurrency(owedAmount).replace('₹','')}`;
    }
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
  const { user } = useAuth();

  // Refs must be declared before useState hooks
  const userASettlementRef = useRef(null);
  const userBSettlementRef = useRef(null);

  const [collaboration,setCollaboration] = useState(null);
  const [transactions,setTransactions] = useState([]);
  const [balance,setBalance] = useState(null);
  const [error,setError] = useState(null);
  const [loading,setLoading] = useState(true);
  const [showModal,setShowModal] = useState(false);
  const [editingId,setEditingId] = useState(null);
  const [lockedType,setLockedType] = useState(null);
  const [deleteDialog,setDeleteDialog] = useState({ isOpen: false,id: null });
  const [showPaymentModal,setShowPaymentModal] = useState(false);
  const [paymentLoading,setPaymentLoading] = useState(false);
  const [filter,setFilter] = useState({
    userId: '',
    search: '',
    type: '',
    month: new Date().toISOString().slice(0,7),
    year: new Date().getFullYear().toString(),
    viewMode: 'month' // 'month' or 'year'
  });
  const [currentPage,setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  const [formData,setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    customCategory: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [alertState,setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' // 'success', 'error', 'info'
  });

  const defaultCategories = {
    expense: ['Food','Rent','Bill','Traveling','Personal','Other'],
    income: ['Salary','Home','Other']
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { month: filter.month };
      const [collabData,transactionsData,balanceData] = await Promise.all([
        getCollaboration(id),
        getCollabTransactions(id,params),
        getBalanceSummary(id,params)
      ]);
      setCollaboration(collabData);
      setTransactions(transactionsData);
      setBalance(balanceData);
    } catch (error) {
      console.error('Failed to fetch data',error);
      // If collaboration not found (deleted), navigate back to list
      if (error.response?.status === 404) {
        navigate('/collaborations');
      } else {
        setError('Failed to load collaboration data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  },[id,filter.month]);

  // Poll for collaboration status when deletion is requested
  useEffect(() => {
    if (!collaboration?.deletionRequest?.requestedBy) return;

    const interval = setInterval(() => {
      fetchData();
    },3000); // Check every 3 seconds

    return () => clearInterval(interval);
  },[collaboration?.deletionRequest?.requestedBy]);

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
        await updateCollabTransaction(id,editingId,payload);
      } else {
        await addCollabTransaction(id,payload);
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
      console.error('Failed to save transaction',error);
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
      setDeleteDialog({ isOpen: false,id: null });
      return;
    }

    if (transaction && transaction.userId._id !== user._id) {
      setAlertState({
        isOpen: true,
        title: 'Permission Denied',
        message: "You can't delete collaborator data",
        type: 'error'
      });
      setDeleteDialog({ isOpen: false,id: null });
      return;
    }

    try {
      await deleteCollabTransaction(id,transactionId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete transaction',error);
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

  const handlePayment = async (paymentMethod,customAmount) => {
    if (!displayBalance || displayBalance.owedAmount === 0) return;

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
        method: paymentMethod
      };

      const response = await settlePayment(id,paymentData);

      // Show success message
      setAlertState({
        isOpen: true,
        title: 'Payment Successful',
        message: `Payment of ${formatCurrency(customAmount || displayBalance.owedAmount)} settled successfully!`,
        type: 'success'
      });

      // Update state immediately with returned data
      if (response.balance) {
        setBalance(response.balance);
      }

      if (response.transactions && response.transactions.length > 0) {
        setTransactions(prev => [...response.transactions,...prev]);
      }

      // Auto reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      },2000);

      setShowPaymentModal(false);
    } catch (error) {
      console.error('Failed to settle payment',error);
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
    try {
      await requestDeletion(id);
      setAlertState({
        isOpen: true,
        title: 'Deletion Requested',
        message: 'Deletion request sent. Waiting for other user to accept.',
        type: 'success'
      });
      // Refresh collaboration data
      fetchData();
    } catch (error) {
      console.error('Failed to request deletion',error);
      setAlertState({
        isOpen: true,
        title: 'Request Failed',
        message: error.response?.data?.message || 'Failed to request deletion.',
        type: 'error'
      });
    }
  };

  const handleAcceptDeletion = async () => {
    try {
      await acceptDeletion(id);
      setAlertState({
        isOpen: true,
        title: 'Collaboration Deleted',
        message: 'Collaboration has been deleted successfully.',
        type: 'success'
      });
      // Navigate back to collaborations list
      setTimeout(() => navigate('/collaborations'),2000);
    } catch (error) {
      console.error('Failed to accept deletion',error);
      setAlertState({
        isOpen: true,
        title: 'Action Failed',
        message: error.response?.data?.message || 'Failed to delete collaboration.',
        type: 'error'
      });
    }
  };

  const handleRejectDeletion = async () => {
    try {
      await rejectDeletion(id);
      setAlertState({
        isOpen: true,
        title: 'Deletion Rejected',
        message: 'Deletion request has been rejected.',
        type: 'success'
      });
      // Refresh collaboration data
      fetchData();
    } catch (error) {
      console.error('Failed to reject deletion',error);
      setAlertState({
        isOpen: true,
        title: 'Action Failed',
        message: error.response?.data?.message || 'Failed to reject deletion.',
        type: 'error'
      });
    }
  };

  // Compute settlement

  const filteredTransactions = transactions.filter(t => {
    const matchesUser = filter.userId ? (t.userId?._id === filter.userId || t.userId === filter.userId) : true;
    const matchesType = filter.type ? t.type === filter.type : true;
    const matchesMonth = filter.month ? (t.date?.startsWith ? t.date.startsWith(filter.month) : new Date(t.date).toISOString().slice(0,7) === filter.month) : true;
    const search = (filter.search ?? '').toLowerCase().trim();
    const matchesSearch = !search ||
      (t.description?.toLowerCase().includes(search)) ||
      (t.category?.toLowerCase().includes(search));
    return matchesUser && matchesType && matchesMonth && matchesSearch;
  }).sort((a,b) => {
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
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction,indexOfLastTransaction);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  },[filter.search,filter.userId,filter.month,filter.type]);

  // Auto-scroll settlement lists to bottom to show latest settlements
  useEffect(() => {
    if (userASettlementRef.current) {
      userASettlementRef.current.scrollTop = userASettlementRef.current.scrollHeight;
    }
    if (userBSettlementRef.current) {
      userBSettlementRef.current.scrollTop = userBSettlementRef.current.scrollHeight;
    }
  },[transactions,filter.month]); // Trigger when transactions or month changes

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
      const matchesMonth = filter.month ? (t.date?.startsWith ? t.date.startsWith(filter.month) : tDate.toISOString().slice(0,7) === filter.month) : true;
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
      .reduce((sum,t) => sum + t.amount,0);

    const totalIncome = monthTransactions
      .filter(t => t.type === 'income' && t.category !== 'Settlement Received')
      .reduce((sum,t) => sum + t.amount,0);

    const totalSavings = totalIncome - totalExpense;

    const userAId = balance.userA.id;
    const userBId = balance.userB.id;

    // Separate Shared Expenses/Income from Settlements
    const userAExpense = monthTransactions
      .filter(t => t.userId._id === userAId && t.type === 'expense' && t.category !== 'Settlement')
      .reduce((sum,t) => sum + t.amount,0);

    const userAIncome = monthTransactions
      .filter(t => t.userId._id === userAId && t.type === 'income' && t.category !== 'Settlement Received')
      .reduce((sum,t) => sum + t.amount,0);

    const userASettledPaid = monthTransactions
      .filter(t => t.userId._id === userAId && t.type === 'expense' && t.category === 'Settlement')
      .reduce((sum,t) => sum + t.amount,0);

    const userASettledReceived = monthTransactions
      .filter(t => t.userId._id === userAId && t.type === 'income' && t.category === 'Settlement Received')
      .reduce((sum,t) => sum + t.amount,0);

    const userBExpense = monthTransactions
      .filter(t => t.userId._id === userBId && t.type === 'expense' && t.category !== 'Settlement')
      .reduce((sum,t) => sum + t.amount,0);

    const userBIncome = monthTransactions
      .filter(t => t.userId._id === userBId && t.type === 'income' && t.category !== 'Settlement Received')
      .reduce((sum,t) => sum + t.amount,0);

    const userBSettledPaid = monthTransactions
      .filter(t => t.userId._id === userBId && t.type === 'expense' && t.category === 'Settlement')
      .reduce((sum,t) => sum + t.amount,0);

    const userBSettledReceived = monthTransactions
      .filter(t => t.userId._id === userBId && t.type === 'income' && t.category === 'Settlement Received')
      .reduce((sum,t) => sum + t.amount,0);

    // Get individual settlement transactions for breakdown
    // Get individual settlement transactions for breakdown
    const userASettlements = monthTransactions
      .filter(t => t.userId._id === userAId && (t.category === 'Settlement' || t.category === 'Settlement Received'))
      .sort((a,b) => new Date(a.date) - new Date(b.date));

    const userBSettlements = monthTransactions
      .filter(t => t.userId._id === userBId && (t.category === 'Settlement' || t.category === 'Settlement Received'))
      .sort((a,b) => new Date(a.date) - new Date(b.date));

    // Savings (Gross)
    const userASavings = (userAIncome + userASettledReceived) - (userAExpense + userASettledPaid);
    const userBSavings = (userBIncome + userBSettledReceived) - (userBExpense + userBSettledPaid);

    // Settlement Logic using pure function
    const settlement = computeSettlement(
      { name: balance.userA.name,total_expense: userAExpense },
      { name: balance.userB.name,total_expense: userBExpense },
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

  // Chart Data (Expense Distribution) - Optional, but if we keep it, use month data
  const chartData = [
    { name: balance.userA.name,value: displayBalance.userA.total_expense,color: '#2563eb' },
    { name: balance.userB.name,value: displayBalance.userB.total_expense,color: '#ef4444' }
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
            <div className="flex items-center gap-2 mt-1 text-text-muted">
              <p>{otherUser?.email}</p>
              {otherUser?.mobileNumber && (
                <p className="flex items-center ml-5">• {otherUser?.mobileNumber}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
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
          }} className="flex items-center gap-2 shadow-glow bg-success hover:bg-success/90 text-white">
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
          }} className="flex items-center gap-2 shadow-glow bg-danger hover:bg-danger/90 text-white">
            <Plus size={20} />
            Add Expense
          </Button>
          {/* Delete Collaboration Button */}
          {!collaboration.deletionRequest?.requestedBy && (
            <div className="flex justify-end">
              <Button
                onClick={handleRequestDeletion}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 size={18} />
                Delete Collaboration
              </Button>
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



      {/* 1. Income Summary Cards - Only show if there is income */}
      {displayBalance.total_income > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-success to-green-600 text-white border-none shadow-glow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-100 font-medium">Total Income</p>
              <TrendingUp size={20} className="text-green-100" />
            </div>
            <h3 className="text-3xl font-bold">{formatCurrency(displayBalance.total_income)}</h3>
          </Card>

          <Card hover className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-text-muted font-medium">{displayBalance.userA.name}'s Income</p>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                {displayBalance.userA.name.charAt(0)}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text">{formatCurrency(displayBalance.userA.total_income)}</h3>
          </Card>

          <Card hover className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-text-muted font-medium">{displayBalance.userB.name}'s Income</p>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                {displayBalance.userB.name.charAt(0)}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text">{formatCurrency(displayBalance.userB.total_income)}</h3>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-none shadow-glow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-indigo-100 font-medium">Total Savings</p>
              <PieChartIcon size={20} className="text-indigo-100" />
            </div>
            <h3 className="text-3xl font-bold">{formatCurrency(displayBalance.total_savings)}</h3>
            <p className="text-sm text-indigo-100 mt-2">Income - Expenses</p>
          </Card>
        </div>
      )}

      {/* 2. Expense Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-danger to-danger text-white border-none shadow-glow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100 font-medium">Total Expenses</p>
            <TrendingDown size={20} className="text-blue-100" />
          </div>
          <h3 className="text-3xl font-bold">{formatCurrency(displayBalance.total_expense)}</h3>
          <p className="text-sm text-blue-100 mt-2">Split equally: {formatCurrency(displayBalance.amount_each_should_pay)}</p>
        </Card>

        <Card hover className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-muted font-medium">{displayBalance.userA.name}'s Expense</p>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              {displayBalance.userA.name.charAt(0)}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-text">{formatCurrency(displayBalance.userA.total_expense)}</h3>
          <p className={clsx(
            "text-sm mt-2 font-medium",
            displayBalance.userA.balance > 0 ? "text-success" : displayBalance.userA.balance < 0 ? "text-danger" : "text-text-muted"
          )}>
            {displayBalance.userA.balance > 0 ? `Gets back ${formatCurrency(Math.abs(displayBalance.userA.balance))}` :
              displayBalance.userA.balance < 0 ? `Pays ${formatCurrency(Math.abs(displayBalance.userA.balance))}` :
                'Settled'}
          </p>
        </Card>

        <Card hover className="border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-muted font-medium">{displayBalance.userB.name}'s Expense</p>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              {displayBalance.userB.name.charAt(0)}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-text">{formatCurrency(displayBalance.userB.total_expense)}</h3>
          <p className={clsx(
            "text-sm mt-2 font-medium",
            displayBalance.userB.balance > 0 ? "text-success" : displayBalance.userB.balance < 0 ? "text-danger" : "text-text-muted"
          )}>
            {displayBalance.userB.balance > 0 ? `Gets back ${formatCurrency(Math.abs(displayBalance.userB.balance))}` :
              displayBalance.userB.balance < 0 ? `Pays ${formatCurrency(Math.abs(displayBalance.userB.balance))}` :
                'Settled'}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-glow relative overflow-hidden">
          <div className="absolute top-5 right-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="m11 17 2 2a1 1 0 1 0 3-3" />
              <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
              <path d="m21 3 1 11h-2" />
              <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
              <path d="M3 4h8" />
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 font-medium mb-2">Settlement</p>
            <p className="text-lg font-bold text-white leading-tight">
              {displayBalance.final_statement}
            </p>
            {displayBalance.owedAmount > 0 && (
              <div className="flex items-center gap-5" >
                <p className="text-blue-100 mt-2">
                  Amount: {formatCurrency(displayBalance.owedAmount)}
                </p>
                {/* Show Pay button only if current user is the payer */}
                {user && displayBalance.payer && displayBalance.payer.id === user._id && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="mt-1 px-3 py-1 bg-white text-primary font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-md"
                  >
                    Pay Now
                  </button>
                )}

                {/* Show Request Payment button only if current user is the receiver */}
                {user && displayBalance.receiver && displayBalance.receiver.id === user._id && (
                  <button
                    onClick={() => setAlertState({
                      isOpen: true,
                      title: 'Request Sent',
                      message: `Payment request sent to ${displayBalance.payer.name}`,
                      type: 'success'
                    })}
                    className="mt-1 px-3 py-1 bg-white text-primary font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-md"
                  >
                    Request
                  </button>
                )}
              </div>
            )}
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
        onClose={() => setAlertState(prev => ({ ...prev,isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />

      {/* 3. Savings Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {displayBalance.userA.settlements.map((s,index) => (
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
              {displayBalance.userB.settlements.map((s,index) => (
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
        {/* Collaboration Transactions */}
        <Card className="w-full flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              Collaboration Transactions
            </h3>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-xl border border-gray-100 mb-6">
            <div className="flex flex-wrap gap-3 flex-1">
              {/* User Filter */}
              <select
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                value={filter.userId}
                onChange={(e) => setFilter({ ...filter,userId: e.target.value })}
              >
                <option value="">All Users</option>
                {collaboration.users.map(u => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                value={filter.type}
                onChange={(e) => setFilter({ ...filter,type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              {/* View Mode Toggle & Date Filter */}
              <div className="flex items-center gap-2 bg-white/50 p-1 rounded-lg border border-gray-200">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => setFilter(prev => ({ ...prev,viewMode: 'month' }))}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter.viewMode === 'month' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'}`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setFilter(prev => ({ ...prev,viewMode: 'year' }))}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter.viewMode === 'year' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'}`}
                  >
                    Year
                  </button>
                </div>

                {/* Month Filter */}
                {filter.viewMode === 'month' && (
                  <input
                    type="month"
                    className="px-2 py-1 bg-transparent text-sm focus:outline-none cursor-pointer"
                    value={filter.month}
                    onChange={(e) => setFilter({ ...filter,month: e.target.value })}
                    onKeyDown={(e) => e.preventDefault()}
                  />
                )}

                {/* Year Filter */}
                {filter.viewMode === 'year' && (
                  <select
                    className="px-2 py-1 bg-transparent text-sm focus:outline-none cursor-pointer"
                    value={filter.year}
                    onChange={(e) => setFilter({ ...filter,year: e.target.value })}
                  >
                    {Array.from({ length: 5 },(_,i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter,search: e.target.value })}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="text-left py-3.5 px-4 text-sm font-semibold text-text-muted uppercase tracking-wider w-[180px]">Date</th>
                    <th className="text-left py-3.5 px-4 text-sm font-semibold text-text-muted uppercase tracking-wider">Description</th>
                    <th className="text-left py-3.5 px-4 text-sm font-semibold text-text-muted uppercase tracking-wider w-[180px]">Category</th>
                    <th className="text-left py-3.5 px-4 text-sm font-semibold text-text-muted uppercase tracking-wider w-[160px]">Amount</th>
                    <th className="text-left py-3.5 px-4 text-sm font-semibold text-text-muted uppercase tracking-wider w-[160px]">Paid By</th>
                    <th className="text-right py-3.5 px-4 text-sm font-semibold text-text-muted uppercase tracking-wider w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentTransactions.map((t) => {
                    const displayCategory = t.category === '__other__' ? (t.customCategory ?? t.category) : t.category;
                    return (
                      <tr key={t._id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="py-3.5 px-4 text-base text-text-muted">
                          <div className="flex items-center gap-4">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-sm font-medium whitespace-nowrap">
                              {new Date(t.date).toLocaleDateString('en-GB',{ weekday: 'short' }).toUpperCase()}, {new Date(t.date).toLocaleDateString('en-GB').replace(/\//g,'-')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-base font-medium text-text truncate max-w-[220px]">
                          {t.description || displayCategory}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg text-sm bg-gray-50 border border-gray-200 font-medium text-text-muted">
                            {displayCategory}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-base font-bold">
                          <span className={clsx(
                            "flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg text-sm",
                            t.type === 'income' ? 'text-success bg-green-50' : 'text-danger bg-red-50'
                          )}>
                            {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {formatCurrency(t.amount)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-text-muted font-medium">
                          {t.userId?.name}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2 transition-opacity">
                            {t.category !== 'Settlement' && t.category !== 'Settlement Received' && (
                              <>
                                <button onClick={() => handleEdit(t)} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                  <Edit size={16} />
                                </button>
                                <button onClick={() => setDeleteDialog({ isOpen: true,id: t._id })} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-3">
              {currentTransactions.map((t) => {
                const displayCategory = t.category === '__other__' ? (t.customCategory ?? t.category) : t.category;
                return (
                  <div key={t._id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                        t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      )}>
                        {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-text text-sm">{t.description || displayCategory}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{displayCategory}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-text-muted flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(t.date).toLocaleDateString('en-GB',{ weekday: 'short' }).toUpperCase()}, {new Date(t.date).toLocaleDateString('en-GB').replace(/\//g,'-')}
                          </p>
                          <p className="text-[10px] text-text-muted">by {t.userId?.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "font-bold text-sm",
                        t.type === 'income' ? 'text-success' : 'text-danger'
                      )}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.category !== 'Settlement' && t.category !== 'Settlement Received' && (
                          <>
                            <button
                              onClick={() => handleEdit(t)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteDialog({ isOpen: true,id: t._id })}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredTransactions.length === 0 && (
              <div className="flex items-center justify-center h-48 text-text-muted">
                <div className="text-center">
                  <Calendar size={48} className="mx-auto mb-2 opacity-20" />
                  <p>No transactions found</p>
                </div>
              </div>
            )}

          </div>

          {/* Pagination Controls */}
          {filteredTransactions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-gray-100 bg-gray-50/30">
              <div className="text-sm text-text-muted">
                Showing {indexOfFirstTransaction + 1} to {Math.min(indexOfLastTransaction,filteredTransactions.length)} of {filteredTransactions.length} transactions
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1,1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-text hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages },(_,i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={clsx(
                        "min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-sm",
                        currentPage === page
                          ? "bg-primary text-white shadow-md"
                          : "border border-gray-300 bg-white text-text hover:bg-gray-50"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1,totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-text hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      </div >

      {/* Modal */}
      {
        showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <Card className="w-full max-w-md relative animate-slide-up shadow-2xl border-none rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-purple-600"></div>
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-text p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-6 pt-8">
                <h3 className="text-2xl font-bold mb-1 text-text">
                  {editingId ? 'Edit Transaction' : lockedType === 'income' ? 'Add Income' : lockedType === 'expense' ? 'Add Expense' : 'Add Transaction'}
                </h3>
                <p className="text-text-muted text-sm mb-6">Enter the details below</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* TYPE SELECTOR - Only show if not locked */}
                  {!lockedType && (
                    <div className="grid grid-cols-2 gap-4 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value="expense"
                          checked={formData.type === 'expense'}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev,type: e.target.value,category: '',customCategory: '' }))
                          }
                          className="hidden peer"
                        />
                        <div className="text-center py-3 rounded-xl text-sm font-bold text-gray-500 transition-all peer-checked:bg-white peer-checked:text-rose-600 peer-checked:shadow-sm">
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
                            setFormData((prev) => ({ ...prev,type: e.target.value,category: '',customCategory: '' }))
                          }
                          className="hidden peer"
                        />
                        <div className="text-center py-3 rounded-xl text-sm font-bold text-gray-500 transition-all peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm">
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
                        onChange={(e) => setFormData((prev) => ({ ...prev,amount: e.target.value }))}
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
                                return { ...prev,category: '__other__' };
                              } else {
                                return { ...prev,category: '',customCategory: '' };
                              }
                            });
                          }}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                        />
                      ) : (
                        <div className="relative">
                          <select
                            value={formData.category}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === 'Other') {
                                setFormData((prev) => ({ ...prev,category: '__other__',customCategory: '' }));
                              } else {
                                setFormData((prev) => ({ ...prev,category: value,customCategory: '' }));
                              }
                            }}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer text-sm font-medium appearance-none"
                          >
                            <option value="">Select Category</option>
                            {(formData.type === 'expense' ? defaultCategories.expense : defaultCategories.income).map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
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
                        onChange={(e) => setFormData((prev) => ({ ...prev,description: e.target.value }))}
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
                        onChange={(e) => setFormData((prev) => ({ ...prev,date: e.target.value }))}
                        required
                        className="py-3"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full py-4 text-base font-bold shadow-lg shadow-primary/25 mt-4 rounded-xl hover:scale-[1.02] transition-transform">
                    {editingId ? 'Save Changes' : 'Add Transaction'}
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        )
      }

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false,id: null })}
        onConfirm={() => handleDelete(deleteDialog.id)}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div >
  );
}
