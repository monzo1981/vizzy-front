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
    setIsProcessing(true);
    setError(null);

    await processPayment(
      subscriptionTypeId,
      billingPeriod,
      (transactionId) => {
        // Payment successful
        console.log('Payment successful:', transactionId);
        setIsProcessing(false);
        
        // Redirect to success page
        router.push(`/payment/success?transaction_id=${transactionId}`);
      },
      (errorMsg) => {
        // Payment failed
        console.error('Payment failed:', errorMsg);
        setError(errorMsg);
        setIsProcessing(false);
      },
      () => {
        // Payment cancelled
        console.log('Payment cancelled');
        setIsProcessing(false);
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
      >
        {isProcessing ? 'Processing...' : buttonText}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
};
