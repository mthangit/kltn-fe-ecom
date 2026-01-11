'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { paymentAPI } from '../api/payment';
import { PaymentMethod, InitPaymentResponse } from '../types';
import { getErrorMessage } from '../error-handler';

interface UsePaymentOptions {
  onSuccess?: (response: InitPaymentResponse) => void;
  onError?: (error: string) => void;
}

export function usePayment(options?: UsePaymentOptions) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Process payment for an order
   * For MoMo/VNPay: redirects to payment gateway
   * For COD: completes the order directly
   */
  const processPayment = async (orderId: number, method: PaymentMethod) => {
    setLoading(true);
    setError(null);

    let isRedirecting = false;

    try {
      const returnUrl = `${window.location.origin}/payment/result`;
      const cancelUrl = `${window.location.origin}/payment/cancel`;

      const result = await paymentAPI.initPayment({
        order_id: orderId,
        payment_method: method,
        return_url: returnUrl,
        cancel_url: cancelUrl,
      });

      if (!result.success) {
        throw new Error(result.message || 'Payment initialization failed');
      }

      // Save payment_id for later status check
      sessionStorage.setItem('payment_id', result.payment_id.toString());
      sessionStorage.setItem('order_id', orderId.toString());

      // Handle COD - no redirect needed
      if (method === 'cod') {
        options?.onSuccess?.(result);
        router.push(`/orders/${orderId}`);
        return;
      }

      // Handle online payment - redirect to payment gateway
      if (result.payment_url) {
        isRedirecting = true;
        options?.onSuccess?.(result);

        // Check if mobile and has deep link (for MoMo app)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // Small delay to let React finish rendering before redirect
        await new Promise(resolve => setTimeout(resolve, 100));

        if (isMobile && method === 'momo' && result.deep_link) {
          // Try to open MoMo app first
          window.location.href = result.deep_link;

          // Fallback to web URL after 2 seconds if app not installed
          setTimeout(() => {
            if (document.hidden) return; // App was opened
            window.location.href = result.payment_url!;
          }, 2000);
        } else {
          // Redirect to payment gateway
          window.location.href = result.payment_url;
        }
      } else {
        throw new Error('Payment URL not provided');
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      options?.onError?.(errorMessage);
      setLoading(false);
    } finally {
      // Don't set loading to false if redirecting - component will unmount
      if (!isRedirecting) {
        setLoading(false);
      }
    }
  };

  /**
   * Check payment status by ID
   */
  const checkPaymentStatus = async (paymentId: number) => {
    setLoading(true);
    setError(null);

    try {
      const status = await paymentAPI.getPaymentStatus(paymentId);
      return status;
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check payment status with retry logic
   * Useful for polling until payment is confirmed
   */
  const checkPaymentWithRetry = async (
    paymentId: number,
    maxRetries: number = 5
  ) => {
    setLoading(true);
    setError(null);

    try {
      const status = await paymentAPI.checkPaymentWithRetry(paymentId, maxRetries);
      return status;
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    processPayment,
    checkPaymentStatus,
    checkPaymentWithRetry,
  };
}

