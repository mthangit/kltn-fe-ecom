import { apiClient } from '../api-client';
import {
  InitPaymentRequest,
  InitPaymentResponse,
  PaymentStatus,
  PaymentHistoryResponse,
  PaymentStatusType,
} from '../types';

class PaymentService {
  /**
   * Initialize a payment for an order
   * Redirects user to payment gateway (MoMo/VNPay) or processes COD
   */
  async initPayment(data: InitPaymentRequest): Promise<InitPaymentResponse> {
    const response = await apiClient.post<InitPaymentResponse>('/payments/init', data);
    return response.data;
  }

  /**
   * Get payment status by payment ID
   * Used to check payment result after user returns from gateway
   */
  async getPaymentStatus(paymentId: number): Promise<PaymentStatus> {
    const response = await apiClient.get<PaymentStatus>(`/payments/${paymentId}/status`);
    return response.data;
  }

  /**
   * Get payment history with pagination and optional status filter
   */
  async getPaymentHistory(
    page: number = 1,
    limit: number = 20,
    status?: PaymentStatusType
  ): Promise<PaymentHistoryResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });

    const response = await apiClient.get<PaymentHistoryResponse>(
      `/payments/history?${params}`
    );
    return response.data;
  }

  /**
   * Check payment status with retry logic
   * Useful for polling payment status until it's no longer pending
   */
  async checkPaymentWithRetry(
    paymentId: number,
    maxRetries: number = 5,
    delayMs: number = 2000
  ): Promise<PaymentStatus> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const status = await this.getPaymentStatus(paymentId);

        // If payment is no longer pending, return the status
        if (status.status !== 'pending') {
          return status;
        }

        // Wait before next retry (except on last attempt)
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        // If it's the last retry, throw the error
        if (i === maxRetries - 1) throw error;
        // Otherwise, wait and retry
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error('Payment status check timeout');
  }
}

export const paymentAPI = new PaymentService();

