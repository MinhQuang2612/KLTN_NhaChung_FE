import Link from "next/link";
import { ReactNode } from "react";
import { FaArrowRight } from "react-icons/fa";

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
      hover: "hover:border-teal-400 hover:shadow-lg hover:shadow-teal-100",
      iconBg: "bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-600",
      arrow: "text-teal-600 group-hover:text-teal-700",
    },
    blue: {
      border: "border-blue-200",
      hover: "hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100",
      iconBg: "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600",
      arrow: "text-blue-600 group-hover:text-blue-700",
    },
    purple: {
      border: "border-purple-200",
      hover: "hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100",
      iconBg: "bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600",
      arrow: "text-purple-600 group-hover:text-purple-700",
    },
    orange: {
      border: "border-orange-200",
      hover: "hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100",
      iconBg: "bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600",
      arrow: "text-orange-600 group-hover:text-orange-700",
    },
    green: {
      border: "border-green-200",
      hover: "hover:border-green-400 hover:shadow-lg hover:shadow-green-100",
      iconBg: "bg-gradient-to-br from-green-100 to-emerald-100 text-green-600",
      arrow: "text-green-600 group-hover:text-green-700",
    },
    pink: {
      border: "border-pink-200",
      hover: "hover:border-pink-400 hover:shadow-lg hover:shadow-pink-100",
      iconBg: "bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600",
      arrow: "text-pink-600 group-hover:text-pink-700",
    },
    indigo: {
      border: "border-indigo-200",
      hover: "hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100",
      iconBg: "bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-600",
      arrow: "text-indigo-600 group-hover:text-indigo-700",
    },
    red: {
      border: "border-red-200",
      hover: "hover:border-red-400 hover:shadow-lg hover:shadow-red-100",
      iconBg: "bg-gradient-to-br from-red-100 to-pink-100 text-red-600",
      arrow: "text-red-600 group-hover:text-red-700",
    },
  } as const;

  const palette = palettes[color] ?? palettes.teal;

  const Content = () => (
    <div
      className={`group relative flex h-full flex-col rounded-2xl bg-white p-6 md:p-7 shadow-sm border transition-all duration-300 ${palette.border} ${palette.hover} hover:-translate-y-1.5`}
    >
      <div className="flex items-start gap-4 md:gap-5">
        <div className={`flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl ${palette.iconBg} flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
          <span className="text-2xl md:text-3xl">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight">{title}</h3>
          <p className="mt-2 text-sm md:text-base text-gray-600 leading-relaxed line-clamp-2">{description}</p>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <div className={`inline-flex items-center text-sm md:text-base font-semibold ${palette.arrow} transition-all duration-300`}>
          <span>Truy cập</span>
          <FaArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 transform transition-all duration-300 group-hover:translate-x-1.5" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 rounded-2xl">
        <Content />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block h-full w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 rounded-2xl">
      <Content />
    </button>
  );
}

