// src/lib/payment.ts

/**
 * Payment Integration Library for Paymob
 * Handles subscription payment flow in Vizzy Frontend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_period: 'monthly' | 'yearly' | 'one-time';
  max_projects: number | null;
  max_ai_images: number | null;
  max_ai_videos: number | null;
  max_ai_text_generations: number | null;
  features: Record<string, unknown>;
  is_active: boolean;
}

export interface PaymentInitiateResponse {
  success: boolean;
  message: string;
  data: {
    transaction_id: string;
    payment_url: string;
    amount: number;
    currency: string;
    subscription_type: string;
  } | null;
}

export interface PaymentStatusResponse {
  success: boolean;
  message: string;
  data: {
    transaction_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
    amount: number;
    currency: string;
    created_at: string;
    completed_at: string | null;
    subscription_type: string | null;
    failure_reason: string | null;
  } | null;
}

export interface TransactionHistory {
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
  subscription_type: string | null;
  payment_method: string;
  created_at: string;
  completed_at: string | null;
}

/**
 * Get authorization token from localStorage
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

/**
 * Initiate payment process for subscription
 */
export async function initiatePayment(
  subscriptionTypeId: string,
  billingPeriod: 'monthly' | 'yearly' = 'monthly'
): Promise<PaymentInitiateResponse> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/payments/initiate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription_type_id: subscriptionTypeId,
        billing_period: billingPeriod,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initiate payment');
    }

    return await response.json();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
    console.error('Payment initiation error:', error);
    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(
  transactionId: string
): Promise<PaymentStatusResponse> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/payments/status/${transactionId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check payment status');
    }

    return await response.json();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to check payment status';
    console.error('Payment status check error:', error);
    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
}

/**
 * Get user's transaction history
 */
export async function getTransactionHistory(): Promise<{
  success: boolean;
  message: string;
  data: TransactionHistory[] | null;
}> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/payments/transactions/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get transaction history');
    }

    return await response.json();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get transaction history';
    console.error('Transaction history error:', error);
    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
}

/**
 * Open Paymob payment iframe in a popup
 */
export function openPaymentPopup(paymentUrl: string, onClose?: () => void): Window | null {
  if (typeof window === 'undefined') return null;

  try {
    const width = 600;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
      paymentUrl,
      'PaymentWindow',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    // Check if popup was blocked
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      console.error('Popup was blocked by browser');
      return null;
    }

    // Try to focus the popup
    try {
      popup.focus();
    } catch {
      console.warn('Could not focus popup');
    }

    // Listen for popup close
    if (onClose) {
      const checkPopup = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkPopup);
            onClose();
          }
        } catch {
          // Popup might be cross-origin, can't access .closed
          clearInterval(checkPopup);
        }
      }, 500);
    }

    return popup;
  } catch (error) {
    console.error('Error opening popup:', error);
    return null;
  }
}

/**
 * Handle payment process flow
 * Opens payment popup and monitors status
 */
export async function processPayment(
  subscriptionTypeId: string,
  billingPeriod: 'monthly' | 'yearly' = 'monthly',
  onSuccess?: (transactionId: string) => void,
  onFailure?: (error: string) => void,
  onCancel?: () => void
): Promise<void> {
  let popup: Window | null = null;

  try {
    // CRITICAL: Open popup BEFORE async call to avoid popup blocker
    // We'll update the URL after we get the payment_url
    popup = window.open('about:blank', 'PaymentWindow', 
      'width=600,height=800,scrollbars=yes,resizable=yes'
    );

    // Check if popup was blocked
    if (!popup) {
      throw new Error(
        'Failed to open payment window. Please allow popups for this site and try again.'
      );
    }

    // Show loading message in popup
    popup.document.write(`
      <html>
        <head>
          <title>Processing Payment...</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .loader {
              text-align: center;
            }
            .spinner {
              border: 4px solid rgba(255,255,255,0.3);
              border-top: 4px solid white;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <h2>Preparing Payment...</h2>
            <p>Please wait while we redirect you to the payment page.</p>
          </div>
        </body>
      </html>
    `);

    // Step 1: Initiate payment
    const initiateResponse = await initiatePayment(subscriptionTypeId, billingPeriod);

    if (!initiateResponse.success || !initiateResponse.data) {
      popup.close();
      throw new Error(initiateResponse.message);
    }

    const { transaction_id, payment_url } = initiateResponse.data;

    // Step 2: Redirect popup to payment URL
    popup.location.href = payment_url;

    // Step 3: Monitor popup close
    const checkPopup = setInterval(async () => {
      try {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          
          // Check payment status when popup closes
          const statusResponse = await checkPaymentStatus(transaction_id);

          if (statusResponse.success && statusResponse.data) {
            const { status } = statusResponse.data;

            if (status === 'completed') {
              onSuccess?.(transaction_id);
            } else if (status === 'failed') {
              onFailure?.(statusResponse.data.failure_reason || 'Payment failed');
            } else if (status === 'pending' || status === 'processing') {
              // Still processing - user might have closed popup early
              onCancel?.();
            } else {
              onFailure?.('Payment was cancelled');
            }
          } else {
            onFailure?.(statusResponse.message);
          }
        }
      } catch {
        // Popup might be cross-origin
        clearInterval(checkPopup);
      }
    }, 500);
  } catch (error: unknown) {
    // Close popup if it's still open
    if (popup && !popup.closed) {
      try {
        popup.close();
      } catch {
        // Ignore errors when closing popup
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
    console.error('Payment process error:', error);
    onFailure?.(errorMessage);
  }
}

/**
 * Poll payment status until completed or failed
 * Useful for background status checking
 */
export async function pollPaymentStatus(
  transactionId: string,
  onStatusChange: (status: string) => void,
  maxAttempts: number = 60,
  interval: number = 5000
): Promise<void> {
  let attempts = 0;

  const checkStatus = async () => {
    if (attempts >= maxAttempts) {
      onStatusChange('timeout');
      return;
    }

    const response = await checkPaymentStatus(transactionId);

    if (response.success && response.data) {
      const { status } = response.data;
      onStatusChange(status);

      // Stop polling if payment is completed or failed
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        return;
      }
    }

    attempts++;
    setTimeout(checkStatus, interval);
  };

  checkStatus();
}
