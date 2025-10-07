"use client"

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { checkPaymentStatus, PaymentStatusResponse } from '@/lib/payment';
import { GradientBackground } from '@/components/gradient-background';

function PaymentSuccessContent() {
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
  }, [router, transactionId]);

  if (isVerifying) {
    return (
      <GradientBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Verifying your payment...</p>
          </div>
        </div>
      </GradientBackground>
    );
  }

  if (verificationStatus === 'failed' || !paymentDetails) {
    return null;
  }

  return (
    <GradientBackground>
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="max-w-2xl w-full bg-white shadow-2xl p-8" style={{ borderRadius: '65px' }}>
        {/* Success Icon */}
        <div className="flex justify-center mb-2">
          <Image 
            src="/success.svg" 
            alt="Success" 
            width={80} 
            height={80}
          />
        </div>

        {/* Success Message */}
        <h1 className="text-center mb-2 font-bold flex items-center justify-center gap-6" style={{ 
          fontSize: '50px', 
          fontWeight: '700',
          background: 'linear-gradient(269.64deg, #4248FF -10.48%, #370094 107.55%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          <Image src="/congrats-L.svg" alt="Congrats" width={50} height={50} />
          Congrats!
          <Image src="/congrats-R.svg" alt="Congrats" width={50} height={50} />
        </h1>
        
        <p className="text-center mb-6" style={{ color: '#11002E', fontSize: '20px', fontWeight: '400' }}>
          now you are a <span className="font-bold">{paymentDetails.subscription_type}</span> member! enjoy your 13,000 Points.
        </p>

        {/* Payment Details */}
        <div className="max-w-md mx-auto p-5 mb-4 space-y-3" style={{ backgroundColor: '#D9D9D94D', borderRadius: '20px' }}>
          <div className="flex justify-between items-center">
            <span style={{ fontWeight: '400', fontSize: '14px', color: 'black' }}>Subscription:</span>
            <span style={{ fontWeight: '400', fontSize: '14px', color: 'black' }}>{paymentDetails.subscription_type}</span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ fontWeight: '400', fontSize: '14px', color: 'black' }}>Amount:</span>
            <span style={{ fontWeight: '400', fontSize: '14px', color: 'black' }}><span style={{ fontWeight: '600' }}>{paymentDetails.amount}</span> <span style={{ fontWeight: '400', fontSize: '14px', color: 'black' }}>{paymentDetails.currency}</span></span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ fontWeight: '400', fontSize: '14px', color: 'black' }}>Transaction ID:</span>
            <span style={{ fontWeight: '400', fontSize: '14px', color: 'black' }}>{paymentDetails.transaction_id.slice(0, 16)}...</span>
          </div>
        </div>

        {/* View Transactions Link */}
        <div className="text-center mb-6">
          <div 
            className="max-w-md mx-auto px-4 py-2 cursor-pointer"
            style={{ 
              backgroundColor: '#D9D9D94D', 
              borderRadius: '50px', 
              fontWeight: '400', 
              fontSize: '14px', 
              color: 'black' 
            }}
          >
            View Transactions History
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Link 
            href="/chat"
            className="flex-1 text-center text-white py-3.5 font-semibold hover:shadow-lg transition-all"
            style={{ borderRadius: '30px', background: 'linear-gradient(90.02deg, #4248FF 0.02%, #FF4A19 103.19%)', fontSize: '20px', fontWeight: '800' }}
          >
            Start Generation
          </Link>
          
          <Link 
            href="/profile"
            className="flex-1 text-center text-white py-3.5 font-semibold hover:bg-blue-600 transition-all"
            style={{ borderRadius: '30px', background: 'linear-gradient(90deg, #4248FF -4.15%, #7FCAFE 108.3%)', fontSize: '20px', fontWeight: '800' }}
          >
            Complete your profile
          </Link>
        </div>
        </div>
      </div>
    </GradientBackground>
  );
}

export default function PaymentSuccessPage() {
  return <PaymentSuccessContent />;
}


