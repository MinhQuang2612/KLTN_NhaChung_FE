"use client";

import React from "react";

export default function StatsHeader({
  title = "Quản lý yêu cầu",
  subtitle = "Xem và xử lý các yêu cầu thuê phòng và ở ghép từ người dùng",
  activeTab,
  onChangeTab,
  rentalStats,
  sharingStats,
  historyStats,
  contractStats,
  terminationStats,
}: {
  title?: string;
  subtitle?: string;
  activeTab: "rental" | "sharing" | "history" | "contracts" | "terminations";
  onChangeTab: (tab: "rental" | "sharing" | "history" | "contracts" | "terminations") => void;
  rentalStats: { total: number; pending: number; approved: number; rejected: number };
  sharingStats: { total: number; pending: number; approved: number; rejected: number };
  historyStats: { total: number; terminated: number; expired: number };
  contractStats: { total: number; active: number; expired: number; terminated: number };
  terminationStats: { total: number; pending: number; approved: number; rejected: number };
}) {
  return (
    <div className="mb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-y-2">
            <button
              onClick={() => onChangeTab("rental")}
              className={`py-2 px-3 border-b-2 font-medium text-sm ${
                activeTab === "rental"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Yêu cầu thuê ({rentalStats.total})
            </button>
            <button
              onClick={() => onChangeTab("sharing")}
              className={`py-2 px-3 border-b-2 font-medium text-sm ${
                activeTab === "sharing"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Yêu cầu ở ghép ({sharingStats.total})
            </button>
            <button
              onClick={() => onChangeTab("history")}
              className={`py-2 px-3 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Lịch sử thuê ({historyStats.total})
            </button>
            <button
              onClick={() => onChangeTab("contracts")}
              className={`py-2 px-3 border-b-2 font-medium text-sm ${
                activeTab === "contracts"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Hợp đồng ({contractStats.total})
            </button>
            <button
              onClick={() => onChangeTab("terminations")}
              className={`py-2 px-3 border-b-2 font-medium text-sm ${
                activeTab === "terminations"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Yêu cầu huỷ HĐ ({terminationStats.total})
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
