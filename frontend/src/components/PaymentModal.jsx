import { useState,useEffect } from 'react';
import { CreditCard,Wallet } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { formatCurrency } from '../utils/format';

export const PaymentModal = ({
    isOpen,
    onClose,
    payer,
    receiver,
    amount,
    onConfirm
}) => {
    const [paymentMethod,setPaymentMethod] = useState('UPI');
    const [isLoading,setIsLoading] = useState(false);
    const [paymentAmount,setPaymentAmount] = useState(amount);
    const [amountError,setAmountError] = useState('');
    const [paymentReason,setPaymentReason] = useState('');
    const [reasonError,setReasonError] = useState('');

    // Update paymentAmount when amount prop changes
    useEffect(() => {
        setPaymentAmount(amount);
        setAmountError('');
    },[amount]);

    const handleAmountChange = (e) => {
        const value = e.target.value;

        // Allow empty string for user to clear and retype
        if (value === '') {
            setPaymentAmount('');
            setAmountError('Amount is required');
            return;
        }

        const numValue = parseFloat(value);

        // Validate numeric
        if (isNaN(numValue)) {
            setAmountError('Please enter a valid number');
            return;
        }

        // Validate positive
        if (numValue <= 0) {
            setAmountError('Amount must be greater than 0');
            setPaymentAmount(value);
            return;
        }

        // Validate not exceeding max
        if (numValue > amount) {
            setAmountError(`Amount cannot exceed ${formatCurrency(amount)}`);
            setPaymentAmount(value);
            return;
        }

        // Valid amount
        setPaymentAmount(value);
        setAmountError('');
    };

    // Check if partial payment
    const isPartialPayment = paymentAmount && parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) < amount;

    const isValidAmount = paymentAmount && !amountError && parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) <= amount;
    const isValidReason = !isPartialPayment || (paymentReason && paymentReason.trim().length > 0);
    const canConfirm = isValidAmount && isValidReason;

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!isValidAmount) return;

        setIsLoading(true);
        try {
            await onConfirm(paymentMethod,parseFloat(paymentAmount),paymentReason);
            onClose();
        } catch (error) {
            // Error handling is done in parent component
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Settle Payment"
            description="Choose your payment method to complete the settlement"
        >
            {/* Payment Details */}
            <div className="bg-surface-highlight/30 rounded-2xl p-4 mb-6 border border-primary/10">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-text-muted text-sm font-medium">From</span>
                        <span className="font-bold text-text">{payer}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-text-muted text-sm font-medium">To</span>
                        <span className="font-bold text-text">{receiver}</span>
                    </div>
                    <div className="h-px bg-border my-2"></div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-text-muted text-sm font-medium">Payment Amount</span>
                            <span className="text-xs text-text-muted bg-surface px-2 py-0.5 rounded-md border border-border">Max: {formatCurrency(amount)}</span>
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-lg">₹</span>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={handleAmountChange}
                                disabled={isLoading}
                                step="0.01"
                                min="0"
                                max={amount}
                                className={`w-full pl-10 pr-4 py-3 text-xl font-bold rounded-xl border-2 transition-all ${amountError
                                    ? 'border-danger/30 bg-danger/5 text-danger focus:border-danger focus:ring-4 focus:ring-danger/10'
                                    : 'border-border bg-surface text-primary focus:border-primary focus:ring-4 focus:ring-primary/10'
                                    } outline-none`}
                                placeholder="0.00"
                            />
                        </div>
                        {amountError && (
                            <p className="text-xs text-danger font-medium mt-1 ml-1">{amountError}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-8">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-3 ml-1">Payment Method</label>
                <div className="space-y-3">
                    {/* UPI Option */}
                    <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'UPI'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-surface hover:border-primary/30 hover:bg-surface-highlight'
                        }`}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="UPI"
                            checked={paymentMethod === 'UPI'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            disabled={isLoading}
                            className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <div className="ml-4 flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${paymentMethod === 'UPI' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-neutral-100 text-text-muted'
                                }`}>
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-text text-base">UPI</div>
                                <div className="text-xs text-text-muted font-medium mt-0.5">Google Pay, PhonePe, Paytm</div>
                            </div>
                        </div>
                    </label>

                    {/* Cash Option */}
                    <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'Cash'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-surface hover:border-primary/30 hover:bg-surface-highlight'
                        }`}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="Cash"
                            checked={paymentMethod === 'Cash'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            disabled={isLoading}
                            className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <div className="ml-4 flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${paymentMethod === 'Cash' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-neutral-100 text-text-muted'
                                }`}>
                                <Wallet size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-text text-base">Cash</div>
                                <div className="text-xs text-text-muted font-medium mt-0.5">Physical currency</div>
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Reason for Partial Payment */}
            {isPartialPayment && (
                <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
                        Reason for partial payment <span className="text-danger">*</span>
                    </label>
                    <textarea
                        value={paymentReason}
                        onChange={(e) => {
                            setPaymentReason(e.target.value);
                            if (e.target.value.trim().length > 0) setReasonError('');
                        }}
                        className={`w-full p-3 rounded-xl border-2 bg-surface text-text resize-none h-24 transition-all outline-none ${reasonError
                            ? 'border-danger focus:border-danger ring-danger/10'
                            : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'
                            }`}
                        placeholder="Please explain why you are paying less..."
                    />
                    {reasonError && (
                        <p className="text-xs text-danger font-medium mt-1 ml-1">{reasonError}</p>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <Button
                onClick={() => {
                    if (isPartialPayment && !paymentReason.trim()) {
                        setReasonError('Reason is required for partial payments');
                        return;
                    }
                    handleConfirm();
                }}
                disabled={isLoading || !canConfirm}
                className="w-full py-4 text-base font-bold shadow-lg shadow-primary/25 rounded-xl hover:scale-[1.02] transition-transform"
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                    </div>
                ) : (
                    `Confirm Payment`
                )}
            </Button>
        </Modal>
    );
};
