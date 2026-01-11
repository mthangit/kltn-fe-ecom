'use client';

import { ReactNode, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Footer } from '../Footer';
import { useAuthStore } from '@/lib/store/auth-store';

// Dynamic import with ssr: false to avoid hydration issues with usePathname
const Navbar = dynamic(() => import('../Navbar').then((mod) => mod.Navbar), {
  ssr: false,
  loading: () => (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <span className="text-2xl">🌾</span>
            </div>
            <span className="text-2xl font-bold text-green-600">Nông Sản Xanh</span>
          </div>
        </div>
      </div>
    </nav>
  ),
});

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

