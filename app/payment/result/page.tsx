'use client';

import dynamic from 'next/dynamic';
import { PaymentLoading } from '@/components/payment/PaymentLoading';

// Dynamic import with ssr: false to avoid hydration issues with useSearchParams
const PaymentResultContent = dynamic(
  () => import('@/components/payment/PaymentResultPage'),
  {
    ssr: false,
    loading: () => <PaymentLoading message="Đang tải..." />,
  }
);

export default function PaymentResultPage() {
  return <PaymentResultContent />;
}
