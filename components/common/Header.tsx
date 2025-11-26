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
  FaChartBar,
  FaComments,
  FaBars,
  FaTimes
} from "react-icons/fa";
import { useChat } from "../../contexts/ChatContext";

export default function Header() {
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { openModal } = useChat();
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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
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
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
        {/* Logo and Location */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:flex-shrink-0">
          <Link href="/" className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <img 
              src="/home/logo.webp" 
              alt="Nhà Chung Logo" 
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl shadow-lg"
            />
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Nhà Chung
            </span>
          </Link>
          
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button 
              onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white text-xs sm:text-sm flex items-center gap-1 sm:gap-2 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-teal-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="hidden md:inline">{selectedCity}</span>
              <span className="md:hidden text-xs">{selectedCity.length > 15 ? selectedCity.substring(0, 12) + '...' : selectedCity}</span>
              <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 flex-shrink-0 ${isAreaDropdownOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            <AreaDropdown 
              isOpen={isAreaDropdownOpen} 
              onClose={() => setIsAreaDropdownOpen(false)} 
            />
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
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

        {/* Right Side - User Menu or Login Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {user ? (
            <>
              {/* Desktop User Menu */}
              <div className="relative hidden lg:block" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30"
                >
                  <img
                    src={user.avatar || '/home/avt1.png'}
                    alt={user.name}
                    className="w-7 h-7 xl:w-8 xl:h-8 rounded-full object-cover border-2 border-white/30"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/home/avt1.png') {
                        target.src = '/home/avt1.png';
                      }
                    }}
                  />
                  <span className="hidden xl:block font-medium">{user.name}</span>
                  <svg className={`w-3 h-3 xl:w-4 xl:h-4 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
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

                {/* Dashboard */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 bg-teal-50 border-b border-gray-200 hover:bg-teal-100 transition-colors group"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <FaHome className="text-teal-600 text-lg" />
                  <span className="text-sm font-semibold text-teal-700 group-hover:text-teal-800">Dashboard</span>
                </Link>

                {/* Logout */}
                <div className="pt-2 pb-2">
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

              {/* Mobile User Avatar Button */}
              <Link
                href="/dashboard"
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                <img
                  src={user.avatar || '/home/avt1.png'}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/home/avt1.png') {
                      target.src = '/home/avt1.png';
                    }
                  }}
                />
              </Link>
            </>
          ) : (
            <>
              {/* Desktop Login Button */}
              <Link
                href="/login"
                className="hidden lg:block px-4 xl:px-6 py-2 xl:py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold text-sm xl:text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Đăng nhập
              </Link>
              {/* Mobile Login Button */}
              <Link
                href="/login"
                className="lg:hidden px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold text-xs sm:text-sm transition-all duration-300 shadow-lg"
              >
                Đăng nhập
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 border border-white/20"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <FaTimes className="w-5 h-5" />
            ) : (
              <FaBars className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 top-[4rem] bg-black/50 backdrop-blur-sm z-40" 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ overscrollBehavior: 'contain' }}
        >
          <div 
            ref={mobileMenuRef}
            className="bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl overflow-y-auto max-h-[calc(100vh-4rem)] overscroll-contain"
            onClick={(e) => e.stopPropagation()}
            style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
          >
            {/* Mobile Location Selector */}
            <div className="px-4 pt-2 pb-3 border-b border-white/10">
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white text-sm flex items-center justify-between hover:bg-white/20 transition-all duration-300 border border-white/20"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>{selectedCity}</span>
                  </div>
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

            {/* Mobile Navigation Links */}
            <nav className="px-4 py-4 space-y-2">
              {menuItems.map((item) => (
                <Link 
                  key={item.id}
                  className={`block px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                    getCurrentPage() === item.id 
                      ? 'bg-teal-500/20 text-white border-l-4 border-teal-400' 
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`} 
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile User Menu - Dashboard, Messages, and Logout */}
            {user && (
              <div className="px-4 py-4 border-t border-white/10 space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-500/20 text-white hover:bg-teal-500/30 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaHome className="text-teal-400 text-lg" />
                  <span className="font-semibold">Dashboard</span>
                </Link>

                <button
                  onClick={() => {
                    openModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-colors w-full text-left"
                >
                  <FaComments className="text-white/70 w-5" />
                  <span>Tin nhắn</span>
                </button>

                <div className="border-t border-white/10 pt-2 mt-2">
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors w-full text-left"
                  >
                    <FaSignOutAlt className="text-red-400 w-5" />
                    <span className="font-medium">Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Login Button */}
            {!user && (
              <div className="px-4 py-4 border-t border-white/10">
                <Link
                  href="/login"
                  className="block w-full px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold text-center transition-all duration-300 shadow-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
