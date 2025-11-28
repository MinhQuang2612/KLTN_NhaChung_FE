"use client";

import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    isPositive: boolean;
  };
  icon: ReactNode;
  iconBg?: string;
  trend?: {
    label: string;
    percentage: number;
  };
}

export default function StatsCard({
  title,
  value,
  change,
  icon,
  iconBg = "bg-teal-100",
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">{title}</p>
          <div className="flex items-baseline gap-2 mb-3">
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
            {change && (
              <span
                className={`text-xs md:text-sm font-bold px-2 py-1 rounded-full ${
                  change.isPositive 
                    ? "bg-green-50 text-green-700" 
                    : "bg-red-50 text-red-700"
                }`}
              >
                {change.isPositive ? "▲" : "▼"}
                {change.value}
              </span>
            )}
          </div>
          {trend && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">{trend.label}</span>
                <span className="text-xs font-bold text-gray-700">{trend.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(trend.percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        <div className={`${iconBg} p-3 md:p-4 rounded-xl flex-shrink-0 flex items-center justify-center`}>
          <div className="text-lg md:text-2xl">{icon}</div>
        </div>
      </div>
    </div>
  );
}




