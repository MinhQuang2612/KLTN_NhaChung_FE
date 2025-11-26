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
    </div>
  );
}
