"use client";

import { usePathname } from 'next/navigation';
import Header from '../components/common/Header';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div className={isLoginPage ? 'min-h-screen' : 'pt-20'}>
      {!isLoginPage && <Header />}
      {children}
    </div>
  );
}
