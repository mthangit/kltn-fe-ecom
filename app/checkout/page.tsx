'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { PaymentMethodButton } from '@/components/payment/PaymentMethodButton';
import { useCartStore } from '@/lib/store/cart-store';
import { ordersAPI } from '@/lib/api/orders';
import { usePayment } from '@/lib/hooks/usePayment';
import { formatPrice } from '@/lib/utils';
import { getErrorMessage } from '@/lib/error-handler';
import { PaymentMethod } from '@/lib/types';

const checkoutSchema = z.object({
  customer_name: z.string().optional(),
  customer_phone: z
    .string()
    .min(10, 'Số điện thoại phải có ít nhất 10 số')
    .regex(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ'),
  customer_email: z
    .string()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
  shipping_address: z.string().min(10, 'Địa chỉ phải có ít nhất 10 ký tự'),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cod');
  const { processPayment, loading: paymentLoading } = usePayment({
    onError: (errorMsg) => {
      setError(errorMsg);
      setIsRedirecting(false);
      setIsProcessingPayment(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      setIsLoading(true);
      setIsProcessingPayment(true);
      setError(null);

      // Create order first
      const orderData = {
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || undefined,
        customer_name: data.customer_name || undefined,
        shipping_address: data.shipping_address,
        notes: data.notes,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      const order = await ordersAPI.createOrder(orderData);
      
      // For online payment methods, show redirecting overlay
      if (selectedPaymentMethod !== 'cod') {
        setIsRedirecting(true);
      }

      // Clear cart after order is created (after setting isProcessingPayment to prevent redirect)
      clearCart();

      // Process payment based on selected method
      await processPayment(order.id, selectedPaymentMethod);

      // For COD, show success message and redirect
      if (selectedPaymentMethod === 'cod') {
        router.push('/orders');
      }
      // For online payments, user will be redirected to payment gateway
    } catch (err: any) {
      setError(getErrorMessage(err));
      setIsRedirecting(false);
      setIsProcessingPayment(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Only redirect to cart if not processing payment
  // (cart is cleared during payment processing, so we need to check isProcessingPayment)
  if (items.length === 0 && !isProcessingPayment && !isRedirecting) {
    router.push('/cart');
    return null;
  }

  const loading = isLoading || paymentLoading;

  return (
    <MainLayout>
      {/* Full screen loading overlay when redirecting to payment gateway */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
              Đang chuyển đến cổng thanh toán...
            </h2>
            <p className="text-gray-600 font-medium mb-4">
              Vui lòng không đóng trình duyệt. Bạn sẽ được chuyển đến{' '}
              <span className="font-bold text-green-600 uppercase">
                {selectedPaymentMethod}
              </span>{' '}
              trong giây lát.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xử lý...</span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-900">Thanh Toán</h1>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Shipping Information */}
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-extrabold text-gray-900">Thông tin khách hàng</h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} id="checkout-form" className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Họ và tên"
                      placeholder="Nguyễn Văn A"
                      error={errors.customer_name?.message}
                      {...register('customer_name')}
                      className="font-medium"
                    />
                    
                    <Input
                      label="Số điện thoại *"
                      placeholder="0901234567"
                      error={errors.customer_phone?.message}
                      {...register('customer_phone')}
                      className="font-medium"
                    />
                  </div>

                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@example.com"
                    error={errors.customer_email?.message}
                    {...register('customer_email')}
                    className="font-medium"
                  />

                  <div className="border-t pt-5 mt-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Địa chỉ giao hàng</h3>
                    <Input
                      label="Địa chỉ nhận hàng *"
                      placeholder="Số nhà, đường, phường, quận, thành phố"
                      error={errors.shipping_address?.message}
                      {...register('shipping_address')}
                      className="font-medium"
                    />
                  </div>

                  <Textarea
                    label="Ghi chú đơn hàng"
                    placeholder="Ví dụ: Giao hàng trước 5 giờ chiều"
                    rows={4}
                    error={errors.notes?.message}
                    {...register('notes')}
                    className="font-medium"
                  />
                </form>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-extrabold text-gray-900">Phương thức thanh toán</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <PaymentMethodButton
                  method="momo"
                  onSelect={setSelectedPaymentMethod}
                  selected={selectedPaymentMethod === 'momo'}
                  disabled={loading}
                />
                <PaymentMethodButton
                  method="stripe"
                  onSelect={setSelectedPaymentMethod}
                  selected={selectedPaymentMethod === 'stripe'}
                  disabled={loading}
                />
                <PaymentMethodButton
                  method="cod"
                  onSelect={setSelectedPaymentMethod}
                  selected={selectedPaymentMethod === 'cod'}
                  disabled={loading}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              form="checkout-form"
              className="w-full font-bold text-lg py-6"
              isLoading={loading}
              disabled={loading}
            >
              {selectedPaymentMethod === 'cod' 
                ? '🛒 Đặt hàng' 
                : `💳 Thanh toán qua ${selectedPaymentMethod.toUpperCase()}`}
            </Button>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-extrabold text-gray-900">Đơn hàng của bạn</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm border-b pb-2">
                      <span className="font-semibold text-gray-900">
                        {item.product.product_name} <span className="text-green-600">x {item.quantity}</span>
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatPrice(item.product.current_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-900 font-bold text-base">
                    <span>Tạm tính:</span>
                    <span className="font-extrabold">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-bold text-base">
                    <span>Phí vận chuyển:</span>
                    <span className="text-green-600 font-extrabold">Miễn phí</span>
                  </div>
                  <div className="border-t-2 pt-3">
                    <div className="flex justify-between text-2xl font-extrabold">
                      <span className="text-gray-900">Tổng cộng:</span>
                      <span className="text-green-600">{formatPrice(getTotalPrice())}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <p className="font-bold mb-2 text-blue-900 text-base">📌 Lưu ý:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 font-medium">
                    <li>Kiểm tra kỹ thông tin trước khi đặt hàng</li>
                    <li>Miễn phí vận chuyển cho đơn hàng</li>
                    <li>Hỗ trợ nhiều phương thức thanh toán</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

