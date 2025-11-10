import Link from "next/link";
import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: ReactNode; // React Icon component
  href: string;
  color?: string; // Màu chủ đạo của card
}

export default function DashboardCard({ 
  title, 
  description, 
  icon, 
  href,
  color = "teal"
}: DashboardCardProps) {
  // Map màu với Tailwind classes
  const colorClasses = {
    teal: "from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700",
    blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    purple: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
    orange: "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
    green: "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    pink: "from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700",
    indigo: "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
    red: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
  };

  const gradientClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.teal;

  return (
    <Link 
      href={href}
      className="group block"
    >
      <div className={`
        relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass}
        p-6 shadow-lg transition-all duration-300 
        hover:shadow-2xl hover:scale-105 h-full
      `}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="mb-4 text-5xl text-white/90">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>
          <p className="text-white/90 text-sm leading-relaxed">
            {description}
          </p>
          
          {/* Arrow icon */}
          <div className="mt-4 flex items-center text-white/80 group-hover:text-white transition-colors">
            <span className="text-sm font-medium mr-2">Truy cập</span>
            <svg 
              className="w-5 h-5 transform transition-transform group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

