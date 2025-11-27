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
export const getCollabTransactions = async (id) => {
    const { data } = await api.get(`/collab/${id}/transactions`);
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
export const getBalanceSummary = async (id) => {
    const { data } = await api.get(`/collab/${id}/balance-summary`);
    return data;
};
