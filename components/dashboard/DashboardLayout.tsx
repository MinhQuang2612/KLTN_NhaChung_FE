"use client";

import { useState, ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import { FaBars } from "react-icons/fa";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-gray-50 overflow-x-hidden">
      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-x-hidden">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-20 md:top-24 left-4 z-30 p-2 bg-white rounded-lg shadow-md text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <FaBars className="w-6 h-6" />
        </button>

        {/* Content */}
        <main className="w-full max-w-full pt-16 md:pt-20 pb-6 px-4 lg:pl-4 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

