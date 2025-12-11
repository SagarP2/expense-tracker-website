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
    getBalanceSummary,
    settlePayment,
    requestSettlement,
    acceptSettlementRequest,
    rejectSettlementRequest,
    requestDeletion,
    acceptDeletion,
    rejectDeletion
} = require('../controllers/collabController');

const asyncHandler = require('../utils/asyncHandler');

// Collaboration routes
router.post('/invite',protect,asyncHandler(sendInvite));
router.post('/:id/accept',protect,asyncHandler(acceptInvite));
router.post('/:id/reject',protect,asyncHandler(rejectInvite));
router.get('/my-groups',protect,asyncHandler(getMyCollaborations));
router.get('/:id',protect,asyncHandler(getCollaboration));

// Transaction routes
router.post('/:id/transactions',protect,asyncHandler(addTransaction));
router.get('/:id/transactions',protect,asyncHandler(getTransactions));
router.put('/:id/transactions/:transactionId',protect,asyncHandler(updateTransaction));
router.delete('/:id/transactions/:transactionId',protect,asyncHandler(deleteTransaction));

// Balance summary
router.get('/:id/balance-summary',protect,asyncHandler(getBalanceSummary));

// Settlement payment
router.post('/:id/settlement/pay',protect,asyncHandler(settlePayment));
router.post('/:id/settlement/request',protect,asyncHandler(requestSettlement));
router.post('/:id/settlement/accept',protect,asyncHandler(acceptSettlementRequest));
router.post('/:id/settlement/reject',protect,asyncHandler(rejectSettlementRequest));

// Deletion workflow
router.post('/:id/request-deletion',protect,asyncHandler(requestDeletion));
router.post('/:id/accept-deletion',protect,asyncHandler(acceptDeletion));
router.post('/:id/reject-deletion',protect,asyncHandler(rejectDeletion));

module.exports = router;
