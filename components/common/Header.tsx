"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import AreaDropdown from "../home/AreaDropdown";

export default function Header() {
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto detect current page based on pathname
  const getCurrentPage = () => {
    if (pathname === "/") return "trang-chu";
    if (pathname === "/find_share" || pathname.startsWith("/room_details")) return "tim-phong";
    if (pathname === "/post") return "o-ghep";
    if (pathname === "/blog") return "dang-tin";
    if (pathname === "/support") return "ho-tro";
    return "trang-chu";
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAreaDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const menuItems = [
    { id: "trang-chu", label: "Trang chủ", href: "/" },
    { id: "tim-phong", label: "Tìm phòng/Ở ghép", href: "/find_share" },
    { id: "o-ghep", label: "Đăng tin", href: "/post" },
    { id: "dang-tin", label: "Blog", href: "/blog" },
    { id: "ho-tro", label: "Hỗ trợ", href: "/support" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="w-full px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo and Location */}
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Nhà Chung
            </span>
          </a>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
              className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white text-sm flex items-center gap-2 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30"
            >
              <svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              TP. Hồ Chí Minh
              <svg className={`w-4 h-4 transition-transform duration-300 ${isAreaDropdownOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            <AreaDropdown 
              isOpen={isAreaDropdownOpen} 
              onClose={() => setIsAreaDropdownOpen(false)} 
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {menuItems.map((item) => (
            <a 
              key={item.id}
              className={`transition-all duration-300 font-medium relative group ${
                getCurrentPage() === item.id 
                  ? 'text-white font-bold' 
                  : 'text-white/90 hover:text-white'
              }`} 
              href={item.href}
            >
              {item.label}
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-teal-400 transition-all duration-300 ${
                getCurrentPage() === item.id ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </a>
          ))}
        </nav>

        {/* Login Button */}
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
          Đăng nhập
        </button>
      </div>
    </header>
  );
}
