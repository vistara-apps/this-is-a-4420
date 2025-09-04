import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

function PayButton({ amount, onPayment, disabled, variant = 'microtransaction' }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    if (disabled || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onPayment();
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (variant === 'processing') {
    return (
      <button
        disabled
        className="w-full bg-white/10 text-white/50 px-6 py-3 rounded-lg 
                 font-semibold cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        Processing Payment...
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`
        w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2
        transition-colors shadow-card hover:shadow-dropdown
        ${disabled
          ? 'bg-white/10 text-white/50 cursor-not-allowed'
          : isProcessing
          ? 'bg-accent/70 text-white cursor-wait'
          : 'bg-accent hover:bg-accent/90 text-white'
        }
      `}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          Pay ${amount.toFixed(3)} - Generate Ads
        </>
      )}
    </button>
  );
}

export default PayButton;