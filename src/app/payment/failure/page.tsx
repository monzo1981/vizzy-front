"use client"

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { checkPaymentStatus, PaymentStatusResponse } from '@/lib/payment';

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [failureReason, setFailureReason] = useState<string>('Payment failed. Please try again.');
  const [paymentDetails, setPaymentDetails] = useState<PaymentStatusResponse['data']>(null);

  useEffect(() => {
    if (!transactionId) {
      setIsLoading(false);
      return;
    }

    // Get payment details
    const getPaymentDetails = async () => {
      try {
        const response = await checkPaymentStatus(transactionId);
        
        if (response.success && response.data) {
          setPaymentDetails(response.data);
          if (response.data.failure_reason) {
            setFailureReason(response.data.failure_reason);
          }
        }
      } catch (error) {
        console.error('Error getting payment details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getPaymentDetails();
  }, [transactionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <Image 
              src="/error-icon.svg" 
              alt="Error" 
              width={64} 
              height={64}
              className="text-red-500"
            />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          Payment Failed
        </h1>
        
        <p className="text-gray-600 text-center mb-6">
          {failureReason}
        </p>

        {/* Payment Details */}
        {paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-semibold text-red-600 capitalize">{paymentDetails.status}</span>
            </div>
            {paymentDetails.subscription_type && (
              <div className="flex justify-between">
                <span className="text-gray-600">Subscription:</span>
                <span className="font-semibold text-gray-800">{paymentDetails.subscription_type}</span>
              </div>
            )}
            {paymentDetails.amount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-800">{paymentDetails.amount} {paymentDetails.currency}</span>
              </div>
            )}
          </div>
        )}

        {/* Common Reasons */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Common reasons for failure:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Insufficient funds</li>
            <li>• Incorrect card details</li>
            <li>• Card expired or blocked</li>
            <li>• Connection timeout</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link 
            href="/pricing"
            className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Try Again
          </Link>
          
          <Link 
            href="/contact"
            className="block w-full text-center border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            Contact Support
          </Link>
          
          <Link 
            href="/chat"
            className="block w-full text-center text-gray-600 py-2 hover:text-gray-800 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
