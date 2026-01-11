'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PaymentResult } from '@/components/payment/PaymentResult';
import { PaymentLoading } from '@/components/payment/PaymentLoading';
import { Alert } from '@/components/ui/Alert';
import { usePayment } from '@/lib/hooks/usePayment';
import { PaymentStatus } from '@/lib/types';

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkPaymentStatus } = usePayment();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [paymentData, setPaymentData] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once
    if (hasChecked) return;

    const checkPayment = async () => {
      try {
        // Get payment_id from sessionStorage or URL params
        const paymentIdFromStorage = sessionStorage.getItem('payment_id');
        const paymentIdFromUrl = searchParams.get('payment_id');
        const paymentId = paymentIdFromStorage || paymentIdFromUrl;

        if (!paymentId) {
          console.error('No payment ID found');
          router.push('/');
          return;
        }

        // Check if user is authenticated
        const token = localStorage.getItem('access_token');
        if (!token) {
          // Token expired during payment - show message and redirect to login
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem kết quả thanh toán.');
          setStatus('failed');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push(`/auth/login?redirect=/payment/result&payment_id=${paymentId}`);
          }, 3000);
          return;
        }

        setHasChecked(true);

        // Check payment status once (no retry)
        const result = await checkPaymentStatus(parseInt(paymentId));
        setPaymentData(result);

        // Update status based on payment result
        if (result.status === 'paid') {
          setStatus('success');
          // Clean up sessionStorage
          sessionStorage.removeItem('payment_id');
          sessionStorage.removeItem('order_id');
        } else if (result.status === 'failed') {
          setStatus('failed');
        } else {
          // pending or other status - show processing UI
          setStatus('pending');
        }
      } catch (error: any) {
        console.error('Failed to check payment status:', error);
        
        // Check if it's 401 error
        if (error.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem kết quả thanh toán.');
          setStatus('failed');
        } else {
          // On error, show pending status instead of failed
          // Payment might still be processing
          setStatus('pending');
        }
      }
    };

    checkPayment();
  }, [searchParams, checkPaymentStatus, router, hasChecked]);

  const handleViewOrder = () => {
    if (paymentData?.order_id) {
      router.push(`/orders`);
    }
  };

  const handleRetry = () => {
    router.push('/checkout');
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        {error && (
          <Alert variant="error" className="mb-6 max-w-2xl mx-auto">
            {error}
          </Alert>
        )}
        
        {status === 'loading' ? (
          <PaymentLoading message="Đang kiểm tra trạng thái thanh toán..." />
        ) : (
          <PaymentResult
            status={status}
            paymentData={paymentData || undefined}
            onViewOrder={handleViewOrder}
            onRetry={handleRetry}
            onBackToHome={handleBackToHome}
          />
        )}
      </div>
    </MainLayout>
  );
}

