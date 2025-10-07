// src/components/PaymentButton.tsx

"use client"

import React, { useState } from 'react';
import { processPayment } from '@/lib/payment';
import { useRouter } from 'next/navigation';

interface PaymentButtonProps {
  subscriptionTypeId: string;
  billingPeriod: 'monthly' | 'yearly';
  buttonText?: string;
  className?: string;
}

/**
 * PaymentButton Component with Double-Click Protection
 * 
 * Features:
 * - Prevents double-click/multiple payment initiations
 * - Shows loading state during payment processing
 * - Opens payment in popup window
 * - Handles errors gracefully
 * - Auto-resets after timeout for retry capability
 */
export const PaymentButton: React.FC<PaymentButtonProps> = ({
  subscriptionTypeId,
  billingPeriod,
  buttonText = 'Upgrade',
  className = '',
}) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    // ✅ PROTECTION: Prevent double-click
    if (isProcessing) {
      console.log('⚠️  Payment already in progress, ignoring click');
      return;
    }

    setIsProcessing(true);
    setError(null);

    await processPayment(
      subscriptionTypeId,
      billingPeriod,
      (transactionId) => {
        // Payment successful
        console.log('✅ Payment successful:', transactionId);
        setIsProcessing(false);
        
        // Redirect to success page
        router.push(`/payment/success?transaction_id=${transactionId}`);
      },
      (errorMsg) => {
        // Payment failed
        console.error('❌ Payment failed:', errorMsg);
        setError(errorMsg);
        
        // ✅ Reset after 3 seconds to allow retry
        setTimeout(() => {
          setIsProcessing(false);
        }, 3000);
      },
      () => {
        // Payment cancelled
        console.log('⚠️  Payment cancelled by user');
        
        // ✅ Reset after 2 seconds
        setTimeout(() => {
          setIsProcessing(false);
        }, 2000);
      }
    );
  };

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`w-full text-white py-3 font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={{
          background: isProcessing 
            ? 'linear-gradient(90deg, #9CA3AF 0%, #6B7280 100%)'
            : 'linear-gradient(90deg, #4248FF 0%, rgba(66, 72, 255, 0.57) 49.12%, #4248FF 100%)',
          borderRadius: '50px',
          fontWeight: 700,
          fontSize: '28px',
        }}
        aria-busy={isProcessing}
        aria-label={isProcessing ? 'Processing payment...' : buttonText}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : buttonText}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
};
