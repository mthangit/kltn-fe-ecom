'use client';

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PaymentStatus } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PaymentResultProps {
  status: 'success' | 'failed' | 'pending';
  paymentData?: PaymentStatus;
  onViewOrder?: () => void;
  onRetry?: () => void;
  onBackToHome?: () => void;
}

export function PaymentResult({
  status,
  paymentData,
  onViewOrder,
  onRetry,
  onBackToHome,
}: PaymentResultProps) {
  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Thanh toán thành công!</h1>

          <p className="text-gray-600">
            Đơn hàng của bạn đã được thanh toán và đang được xử lý
          </p>

          {paymentData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mã giao dịch:</span>
                <span className="font-medium text-gray-900">{paymentData.transaction_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Số tiền:</span>
                <span className="font-medium text-green-600">
                  {formatPrice(paymentData.amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phương thức:</span>
                <span className="font-medium text-gray-900 uppercase">{paymentData.payment_method}</span>
              </div>
              {paymentData.paid_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(paymentData.paid_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 pt-4">
            {onViewOrder && (
              <Button onClick={onViewOrder} className="w-full">
                Xem đơn hàng
              </Button>
            )}
            {onBackToHome && (
              <Button onClick={onBackToHome} variant="outline" className="w-full">
                Về trang chủ
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Thanh toán thất bại</h1>

          <p className="text-gray-600">
            {paymentData?.failed_reason || 'Đã có lỗi xảy ra trong quá trình thanh toán'}
          </p>

          {paymentData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-medium text-gray-900">#{paymentData.order_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Số tiền:</span>
                <span className="font-medium text-gray-900">{formatPrice(paymentData.amount)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-4">
            {onRetry && (
              <Button onClick={onRetry} className="w-full">
                Thử lại
              </Button>
            )}
            {onBackToHome && (
              <Button onClick={onBackToHome} variant="outline" className="w-full">
                Về trang chủ
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pending state
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <AlertCircle className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Đang xử lý thanh toán</h1>

        <p className="text-gray-600">
          Giao dịch của bạn đang được xử lý. Vui lòng kiểm tra lại sau ít phút hoặc xem trong mục đơn hàng.
        </p>

        {paymentData && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Mã đơn hàng:</span>
              <span className="font-medium text-gray-900">#{paymentData.order_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Số tiền:</span>
              <span className="font-medium text-gray-900">{formatPrice(paymentData.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Trạng thái:</span>
              <span className="font-medium text-blue-600">Đang xử lý</span>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <p className="text-sm text-blue-800 font-medium">
            💡 <strong>Lưu ý:</strong> Nếu bạn đã thanh toán thành công trên cổng thanh toán, 
            đơn hàng sẽ được cập nhật trong vài phút. Bạn có thể kiểm tra trong mục "Đơn hàng của tôi".
          </p>
        </div>

        <div className="space-y-2 pt-4">
          {onViewOrder && (
            <Button onClick={onViewOrder} className="w-full">
              Xem đơn hàng của tôi
            </Button>
          )}
          {onBackToHome && (
            <Button onClick={onBackToHome} variant="outline" className="w-full">
              Về trang chủ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

