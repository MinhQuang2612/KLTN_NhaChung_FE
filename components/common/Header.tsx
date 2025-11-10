"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import AreaDropdown from "../home/AreaDropdown";
import { 
  FaHome, 
  FaUser, 
  FaFileAlt, 
  FaClipboardCheck, 
  FaDoorOpen, 
  FaCreditCard, 
  FaHeart, 
  FaSignOutAlt,
  FaClipboardList,
  FaBuilding,
  FaMoneyBillWave,
  FaChartBar
} from "react-icons/fa";

export default function Header() {
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const [selectedCity, setSelectedCity] = useState<string>('TP. Hồ Chí Minh');

  // Auto detect current page based on pathname
  const getCurrentPage = () => {
    if (pathname === "/") return "trang-chu";
    if (pathname === "/find_share" || pathname.startsWith("/room_details")) return "tim-phong";
    if (pathname === "/post" || pathname === "/post/rent" || pathname === "/post/roommate") return "dang-tin";
    if (pathname === "/blog") return "blog";
    if (pathname === "/support") return "ho-tro";
    // For landlord pages, don't highlight any main navigation
    if (pathname.startsWith("/landlord")) return "";
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
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Lắng nghe thay đổi city từ AreaDropdown
  useEffect(() => {
    const syncCity = () => {
      if (typeof window === 'undefined') return;
      const city = localStorage.getItem('selectedCity') || (user as any)?.address?.city || (user as any)?.city || 'TP. Hồ Chí Minh';
      setSelectedCity(city);
    };
    syncCity();
    const onCityChanged = (e: any) => {
      const city = e?.detail?.city;
      if (city) setSelectedCity(city);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('app:cityChanged', onCityChanged as any);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('app:cityChanged', onCityChanged as any);
      }
    };
  }, [user]);

  const menuItems = [
    { id: "trang-chu", label: "Trang chủ", href: "/" },
    { id: "tim-phong", label: "Tìm phòng/Ở ghép", href: "/find_share" },
    { id: "dang-tin", label: "Đăng tin", href: "/post" },
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
              {selectedCity}
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
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/home/avt1.png') {
                    target.src = '/home/avt1.png';
                  }
                }}
              />
              <span className="hidden sm:block font-medium">{user.name}</span>
              <svg className={`w-4 h-4 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs text-teal-50 truncate">{user.email}</p>
                </div>

                {/* Dashboard - Highlighted */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 bg-teal-50 border-b border-gray-200 hover:bg-teal-100 transition-colors group"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <FaHome className="text-teal-600 text-lg" />
                  <span className="text-sm font-semibold text-teal-700 group-hover:text-teal-800">Dashboard</span>
                </Link>

                {/* Menu Items */}
                <div className="py-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <FaUser className="text-gray-400 w-4" />
                    <span>Thông tin cá nhân</span>
                  </Link>
                  
                  <Link
                    href="/my-posts"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <FaFileAlt className="text-gray-400 w-4" />
                    <span>Bài đăng của tôi</span>
                  </Link>

                  {user.role !== 'landlord' && (
                    <>
                      <Link
                        href="/my-rentals"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FaClipboardCheck className="text-gray-400 w-4" />
                        <span>Đăng ký thuê</span>
                      </Link>
                      
                      <Link
                        href="/my-rooms"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FaDoorOpen className="text-gray-400 w-4" />
                        <span>Phòng của tôi</span>
                      </Link>
                      
                      <Link
                        href="/payments"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FaCreditCard className="text-gray-400 w-4" />
                        <span>Hóa đơn thanh toán</span>
                      </Link>
                    </>
                  )}

                  <Link
                    href="/favorites"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <FaHeart className="text-gray-400 w-4" />
                    <span>Yêu thích</span>
                  </Link>

                  {user.role === 'landlord' && (
                    <>
                      <div className="my-2 border-t border-gray-100" />
                      <div className="px-4 py-1.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quản lý</p>
                      </div>
                      
                      <Link
                        href="/landlord"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FaClipboardList className="text-gray-400 w-4" />
                        <span>Yêu cầu thuê</span>
                      </Link>
                      
                      <Link
                        href="/landlord/buildings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FaBuilding className="text-gray-400 w-4" />
                        <span>Tòa nhà</span>
                      </Link>
                      
                      <Link
                        href="/landlord/billing"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FaMoneyBillWave className="text-gray-400 w-4" />
                        <span>Tính tiền</span>
                      </Link>
                      
                      <Link
                        href="/landlord/stats"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FaChartBar className="text-gray-400 w-4" />
                        <span>Thống kê</span>
                      </Link>
                    </>
                  )}
                </div>

                {/* Logout */}
                <div className="border-t border-gray-200 pt-2 pb-2">
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                  >
                    <FaSignOutAlt className="text-red-500 w-4" />
                    <span className="font-medium">Đăng xuất</span>
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
