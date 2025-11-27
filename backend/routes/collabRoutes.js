const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    sendInvite,
    acceptInvite,
    rejectInvite,
    getMyCollaborations,
    getCollaboration,
    addTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    getBalanceSummary
} = require('../controllers/collabController');

// Collaboration routes
router.post('/invite',protect,sendInvite);
router.post('/:id/accept',protect,acceptInvite);
router.post('/:id/reject',protect,rejectInvite);
router.get('/my-groups',protect,getMyCollaborations);
router.get('/:id',protect,getCollaboration);

// Transaction routes
router.post('/:id/transactions',protect,addTransaction);
router.get('/:id/transactions',protect,getTransactions);
router.put('/:id/transactions/:transactionId',protect,updateTransaction);
router.delete('/:id/transactions/:transactionId',protect,deleteTransaction);

// Balance summary
router.get('/:id/balance-summary',protect,getBalanceSummary);

module.exports = router;
