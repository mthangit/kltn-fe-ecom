'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ChatProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ChatProductCard({ product, onAddToCart }: ChatProductCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden my-2">
      <div className="flex gap-3 p-3">
        <Link href={`/products/${product.id}`} className="flex-shrink-0">
          <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.image_alt || product.product_name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <span className="text-2xl">🌾</span>
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/products/${product.id}`}>
            <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 hover:text-green-600">
              {product.product_name}
            </h4>
          </Link>
          
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-extrabold text-green-600">
              {formatPrice(product.current_price)}
            </span>
            {product.original_price && product.original_price > product.current_price && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-600 mb-2">Đơn vị: {product.unit}</p>

          {onAddToCart && (
            <Button
              size="sm"
              onClick={() => onAddToCart(product)}
              className="w-full text-xs py-1.5"
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Thêm vào giỏ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

