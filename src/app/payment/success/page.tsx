"use client"

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { checkPaymentStatus, PaymentStatusResponse } from '@/lib/payment';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [paymentDetails, setPaymentDetails] = useState<PaymentStatusResponse['data']>(null);

  useEffect(() => {
    if (!transactionId) {
      router.push('/pricing');
      return;
    }

    // Verify payment status
    const verifyPayment = async () => {
      try {
        const response = await checkPaymentStatus(transactionId);
        
        if (response.success && response.data) {
          if (response.data.status === 'completed') {
            setVerificationStatus('success');
            setPaymentDetails(response.data);
          } else if (response.data.status === 'failed') {
            setVerificationStatus('failed');
          } else {
            setVerificationStatus('pending');
          }
        } else {
          setVerificationStatus('failed');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setVerificationStatus('failed');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [transactionId, router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'failed') {
    router.push(`/payment/failure${transactionId ? `?transaction_id=${transactionId}` : ''}`);
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <Image 
              src="/success-icon.svg" 
              alt="Success" 
              width={64} 
              height={64}
              className="text-green-500"
            />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          Payment Successful! 🎉
        </h1>
        
        <p className="text-gray-600 text-center mb-6">
          Your subscription has been activated successfully. You can now enjoy all the premium features!
        </p>

        {/* Payment Details */}
        {paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subscription:</span>
              <span className="font-semibold text-gray-800">{paymentDetails.subscription_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-gray-800">{paymentDetails.amount} {paymentDetails.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-xs text-gray-600">{paymentDetails.transaction_id.slice(0, 16)}...</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link 
            href="/chat"
            className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Start Creating
          </Link>
          
          <Link 
            href="/payments/transactions"
            className="block w-full text-center border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            View Transaction History
          </Link>
        </div>
      </div>
    </div>
  );
}
