import { useState,useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import { acceptSettlementRequest,getCollaboration } from '../services/collabApi';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CheckCircle,AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function SettlementPay() {
    const { id } = useParams(); // This is the settlementId / collabId
    const navigate = useNavigate();
    const [loading,setLoading] = useState(false);
    const [status,setStatus] = useState('pending'); // pending, success, error
    const [error,setError] = useState(null);
    const [details,setDetails] = useState(null);

    useEffect(() => {
        // Optional: Fetch details to show amount
        const fetchDetails = async () => {
            try {
                const data = await getCollaboration(id);
                setDetails(data);
                // Auto-redirect if already settled? Maybe not to avoid confusion.
            } catch (err) {
                console.error(err);
            }
        };
        fetchDetails();
    },[id]);

    const handlePay = async () => {
        setLoading(true);
        try {
            await acceptSettlementRequest(id);
            setStatus('success');
            setTimeout(() => {
                navigate(`/collaborations/${id}`);
            },2000);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setError(err.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="max-w-md w-full p-8 text-center space-y-4">
                    <div className="flex justify-center text-success">
                        <CheckCircle size={48} />
                    </div>
                    <h2 className="text-2xl font-bold">Payment Successful!</h2>
                    <p className="text-text-muted">Settlement request accepted.</p>
                    <p className="text-sm">Redirecting to dashboard...</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="max-w-md w-full p-8 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Settlement Request</h1>
                    <p className="text-text-muted">
                        Confirm settlement payment for collaboration.
                    </p>
                    {details?.settlementRequest?.amount && (
                        <div className="text-3xl font-bold text-primary py-4">
                            {formatCurrency(details.settlementRequest.amount)}
                        </div>
                    )}
                </div>

                {status === 'error' && (
                    <div className="bg-danger/10 text-danger p-3 rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={handlePay}
                        disabled={loading}
                        className="w-full bg-success hover:bg-success-hover text-white py-6 text-lg"
                    >
                        {loading ? 'Processing...' : `Pay Now`}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => navigate(`/collaborations/${id}`)}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </div>
            </Card>
        </div>
    );
}
