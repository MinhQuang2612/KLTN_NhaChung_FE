"use client";

import React from "react";

export default function StatsHeader({
  title = "Quản lý yêu cầu",
  subtitle = "Xem và xử lý các yêu cầu thuê phòng và ở ghép từ người dùng",
  activeTab,
  onChangeTab,
  rentalStats,
  sharingStats,
}: {
  title?: string;
  subtitle?: string;
  activeTab: "rental" | "sharing";
  onChangeTab: (tab: "rental" | "sharing") => void;
  rentalStats: { total: number; pending: number; approved: number; rejected: number };
  sharingStats: { total: number; pending: number; approved: number; rejected: number };
}) {
  const current = activeTab === "rental" ? rentalStats : sharingStats;
  return (
    <div className="mb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => onChangeTab("rental")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "rental"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Yêu cầu thuê ({rentalStats.total})
            </button>
            <button
              onClick={() => onChangeTab("sharing")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "sharing"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Yêu cầu ở ghép ({sharingStats.total})
            </button>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="doc" label="Tổng yêu cầu" value={current.total} color="blue" />
        <StatCard icon="clock" label="Chờ duyệt" value={current.pending} color="yellow" />
        <StatCard icon="check" label="Đã duyệt" value={current.approved} color="green" />
        <StatCard icon="x" label="Đã từ chối" value={current.rejected} color="red" />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: "doc" | "clock" | "check" | "x";
  label: string;
  value: number;
  color: "blue" | "yellow" | "green" | "red";
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };
  const Icon = () => {
    switch (icon) {
      case "clock":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "check":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "x":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center">
        <div className={`p-2 rounded-full ${colorMap[color]}`}>
          <Icon />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

