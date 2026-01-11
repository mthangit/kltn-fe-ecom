'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports with ssr: false to avoid hydration issues
const ToastContainer = dynamic(
  () => import('@/components/ui/Toast').then((mod) => ({ default: mod.ToastContainer })),
  { ssr: false }
);

const ChatContainer = dynamic(
  () => import('@/components/chatbot').then((mod) => ({ default: mod.ChatContainer })),
  { ssr: false }
);

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <>
      {children}
      <ToastContainer />
      <ChatContainer />
    </>
  );
}

