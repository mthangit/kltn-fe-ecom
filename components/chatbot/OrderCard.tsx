'use client';

import Link from 'next/link';
import { Package, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface ChatOrderCardProps {
  order: Order;
}

export function ChatOrderCard({ order }: ChatOrderCardProps) {
  const statusIcons = {
    pending: Clock,
    confirmed: CheckCircle,
    shipping: Package,
    delivered: CheckCircle,
    cancelled: XCircle,
  };

  const statusColors = {
    pending: 'warning',
    confirmed: 'info',
    shipping: 'info',
    delivered: 'success',
    cancelled: 'default',
  } as const;

  const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  };

  const Icon = statusIcons[order.status] || Package;
  const statusColor = statusColors[order.status] || 'default';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden my-2">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-600" />
            <div>
              <h4 className="font-extrabold text-sm text-gray-900">
                Đơn hàng #{order.order_number}
              </h4>
              <p className="text-xs text-gray-600">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>
          <Badge variant={statusColor}>
            {statusLabels[order.status]}
          </Badge>
        </div>

        {order.order_items && order.order_items.length > 0 && (
          <div className="mb-3 pb-3 border-b border-gray-100">
            <p className="text-xs text-gray-600 mb-1 font-semibold">Sản phẩm:</p>
            <div className="space-y-1">
              {order.order_items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-gray-700">
                    {item.product_name} <span className="text-green-600">x{item.quantity}</span>
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(item.total_price)}
                  </span>
                </div>
              ))}
              {order.order_items.length > 3 && (
                <p className="text-xs text-gray-500 italic">
                  +{order.order_items.length - 3} sản phẩm khác
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 font-semibold">Tổng tiền:</p>
            <p className="text-lg font-extrabold text-green-600">
              {formatPrice(order.total_amount)}
            </p>
          </div>
          <Link
            href="/orders"
            className="text-xs font-semibold text-green-600 hover:text-green-700 underline"
          >
            Xem chi tiết →
          </Link>
        </div>
      </div>
    </div>
  );
}

