"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import AreaDropdown from "../home/AreaDropdown";

export default function Header() {
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const postMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Auto detect current page based on pathname
  const getCurrentPage = () => {
    if (pathname === "/") return "trang-chu";
    if (pathname === "/find_share" || pathname.startsWith("/room_details")) return "tim-phong";
    if (pathname === "/post" || pathname === "/post/rent" || pathname === "/post/roommate") return "dang-tin";
    if (pathname === "/blog") return "blog";
    if (pathname === "/support") return "ho-tro";
    return "trang-chu";
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAreaDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) {
        setIsPostMenuOpen(false);
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
    { id: "dang-tin", label: "Đăng tin", href: "/post", hasDropdown: true },
    { id: "blog", label: "Blog", href: "/blog" },
    { id: "ho-tro", label: "Hỗ trợ", href: "/support" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="w-full px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo and Location */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/home/logo.webp" 
              alt="Nhà Chung Logo" 
              className="w-10 h-10 rounded-xl shadow-lg"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Nhà Chung
            </span>
          </Link>
          
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
            item.hasDropdown ? (
              <div key={item.id} className="relative" ref={postMenuRef}>
                <button
                  onClick={() => setIsPostMenuOpen(!isPostMenuOpen)}
                  className={`transition-all duration-300 font-medium relative group flex items-center gap-1 ${
                    getCurrentPage() === item.id 
                      ? 'text-white font-bold' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {item.label}
                  <svg className={`w-4 h-4 transition-transform duration-300 ${isPostMenuOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-teal-400 transition-all duration-300 ${
                    getCurrentPage() === item.id ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </button>

                {/* Post Dropdown Menu */}
                {isPostMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <Link
                      href="/post/rent"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsPostMenuOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Cho thuê phòng</p>
                          <p className="text-xs text-gray-500">Đăng tin cho thuê</p>
                        </div>
                      </div>
                    </Link>
                    <Link
                      href="/post/roommate"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsPostMenuOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Tìm ở ghép</p>
                          <p className="text-xs text-gray-500">Tìm người ở ghép với mình</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Link 
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
              </Link>
            )
          ))}
        </nav>

        {/* User Menu or Login Button */}
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30"
            >
              <img
                src={user.avatar || '/home/avt1.png'}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
              />
              <span className="hidden sm:block font-medium">{user.name}</span>
              <svg className={`w-4 h-4 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Thông tin cá nhân
                </Link>
                <Link
                  href="/my-posts"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Bài đăng của tôi
                </Link>
                <Link
                  href="/favorites"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Yêu thích
                </Link>
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
