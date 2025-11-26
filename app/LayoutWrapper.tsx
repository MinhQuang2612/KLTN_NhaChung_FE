"use client";

import { usePathname } from 'next/navigation';
import Header from '../components/common/Header';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ChatProvider } from '../contexts/ChatContext';
import FloatingChatButton from '../components/chat/FloatingChatButton';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div suppressHydrationWarning={true}>
      <ToastProvider>
        <FavoritesProvider>
          <ChatProvider>
            <div className="min-h-screen">
              {!isLoginPage && <Header />}
              <main className={isLoginPage ? '' : 'pt-20'}>
                {children}
              </main>
              <FloatingChatButton />
            </div>
          </ChatProvider>
        </FavoritesProvider>
      </ToastProvider>
    </div>
  );
}
