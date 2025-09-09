"use client";

import { usePathname } from 'next/navigation';
import Header from '../components/common/Header';
import { FavoritesProvider } from '../contexts/FavoritesContext';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <FavoritesProvider>
      <div className="min-h-screen">
        {!isLoginPage && <Header />}
        <main className={isLoginPage ? '' : 'pt-20'}>
          {children}
        </main>
      </div>
    </FavoritesProvider>
  );
}
