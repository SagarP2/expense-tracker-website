import api from '../utils/axiosInstance';

// Send collaboration invite
export const sendCollabInvite = async (email) => {
    const { data } = await api.post('/collab/invite',{ email });
    return data;
};

// Accept collaboration invite
export const acceptCollabInvite = async (id) => {
    const { data } = await api.post(`/collab/${id}/accept`);
    return data;
};

// Reject collaboration invite
export const rejectCollabInvite = async (id) => {
    const { data } = await api.post(`/collab/${id}/reject`);
    return data;
};

// Get all collaborations
export const getMyCollaborations = async () => {
    const { data } = await api.get('/collab/my-groups');
    return data;
};

// Get single collaboration
export const getCollaboration = async (id) => {
    const { data } = await api.get(`/collab/${id}`);
    return data;
};

// Add transaction to collaboration
export const addCollabTransaction = async (id,transactionData) => {
    const { data } = await api.post(`/collab/${id}/transactions`,transactionData);
    return data;
};

// Get collaboration transactions
export const getCollabTransactions = async (id,params) => {
    const { data } = await api.get(`/collab/${id}/transactions`,{ params });
    return data;
};

// Update collaboration transaction
export const updateCollabTransaction = async (collabId,transactionId,transactionData) => {
    const { data } = await api.put(`/collab/${collabId}/transactions/${transactionId}`,transactionData);
    return data;
};

// Delete collaboration transaction
export const deleteCollabTransaction = async (collabId,transactionId) => {
    const { data } = await api.delete(`/collab/${collabId}/transactions/${transactionId}`);
    return data;
};

// Get balance summary
export const getBalanceSummary = async (id,params) => {
    const { data } = await api.get(`/collab/${id}/balance-summary`,{ params });
    return data;
};

// Settle payment (Direct Pay)
export const settlePayment = async (id,paymentData) => {
    const response = await api.post(`/collab/${id}/settlement/pay`,paymentData);
    return response.data;
};

// Request payment
export const requestSettlement = async (id,paymentData) => {
    const response = await api.post(`/collab/${id}/settlement/request`,paymentData);
    return response.data;
};

// Accept settlement request
export const acceptSettlementRequest = async (id) => {
    const response = await api.post(`/collab/${id}/settlement/accept`);
    return response.data;
};

// Reject settlement request
export const rejectSettlementRequest = async (id) => {
    const response = await api.post(`/collab/${id}/settlement/reject`);
    return response.data;
};

// Deletion workflow
export const requestDeletion = async (id) => {
    const response = await api.post(`/collab/${id}/request-deletion`);
    return response.data;
};

export const acceptDeletion = async (id) => {
    const response = await api.post(`/collab/${id}/accept-deletion`);
    return response.data;
};

export const rejectDeletion = async (id) => {
    const response = await api.post(`/collab/${id}/reject-deletion`);
    return response.data;
};
