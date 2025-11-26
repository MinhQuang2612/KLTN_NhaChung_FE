import Link from "next/link";
import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href?: string;
  color?: "teal" | "blue" | "purple" | "orange" | "green" | "pink" | "indigo" | "red";
  onClick?: () => void;
}

export default function DashboardCard({
  title,
  description,
  icon,
  href,
  color = "teal",
  onClick,
}: DashboardCardProps) {
  const palettes = {
    teal: {
      border: "border-teal-200",
      hover: "hover:border-teal-300 hover:bg-teal-50",
      iconBg: "bg-teal-100 text-teal-600",
      arrow: "text-teal-500 group-hover:text-teal-700",
    },
    blue: {
      border: "border-blue-200",
      hover: "hover:border-blue-300 hover:bg-blue-50",
      iconBg: "bg-blue-100 text-blue-600",
      arrow: "text-blue-500 group-hover:text-blue-700",
    },
    purple: {
      border: "border-purple-200",
      hover: "hover:border-purple-300 hover:bg-purple-50",
      iconBg: "bg-purple-100 text-purple-600",
      arrow: "text-purple-500 group-hover:text-purple-700",
    },
    orange: {
      border: "border-orange-200",
      hover: "hover:border-orange-300 hover:bg-orange-50",
      iconBg: "bg-orange-100 text-orange-600",
      arrow: "text-orange-500 group-hover:text-orange-700",
    },
    green: {
      border: "border-green-200",
      hover: "hover:border-green-300 hover:bg-green-50",
      iconBg: "bg-green-100 text-green-600",
      arrow: "text-green-500 group-hover:text-green-700",
    },
    pink: {
      border: "border-pink-200",
      hover: "hover:border-pink-300 hover:bg-pink-50",
      iconBg: "bg-pink-100 text-pink-600",
      arrow: "text-pink-500 group-hover:text-pink-700",
    },
    indigo: {
      border: "border-indigo-200",
      hover: "hover:border-indigo-300 hover:bg-indigo-50",
      iconBg: "bg-indigo-100 text-indigo-600",
      arrow: "text-indigo-500 group-hover:text-indigo-700",
    },
    red: {
      border: "border-red-200",
      hover: "hover:border-red-300 hover:bg-red-50",
      iconBg: "bg-red-100 text-red-600",
      arrow: "text-red-500 group-hover:text-red-700",
    },
  } as const;

  const palette = palettes[color] ?? palettes.teal;

  const Content = () => (
    <div
      className={`group relative flex h-full flex-col rounded-2xl bg-white/95 p-6 shadow-sm transition-all duration-200 border ${palette.border} ${palette.hover}`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${palette.iconBg}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className={`flex items-center text-sm font-medium ${palette.arrow}`}>
          <span>Truy cập</span>
          <svg
            className="ml-2 h-5 w-5 transform transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        <Content />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block h-full w-full text-left focus:outline-none">
      <Content />
    </button>
  );
}

