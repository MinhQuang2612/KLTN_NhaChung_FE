"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  FaHome,
  FaClipboardCheck,
  FaDoorOpen,
  FaFileAlt,
  FaClipboardList,
  FaBuilding,
  FaMoneyBillWave,
  FaChartBar,
  FaTimes,
  FaChevronDown,
  FaChevronRight,
  FaUserEdit
} from "react-icons/fa";

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: MenuItem[];
}

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ isOpen: externalIsOpen, onClose }: DashboardSidebarProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  // Menu items based on role
  const getMenuItems = (): MenuItem[] => {
    if (user?.role === 'landlord') {
      return [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: <FaHome />
        },
        {
          title: "Bài đăng của tôi",
          href: "/my-posts",
          icon: <FaFileAlt />
        },
        {
          title: "Quản lý",
          href: "#",
          icon: <FaBuilding />,
          children: [
            {
              title: "Yêu cầu thuê",
              href: "/landlord",
              icon: <FaClipboardList />
            },
            {
              title: "Quản lý tòa nhà",
              href: "/landlord/buildings",
              icon: <FaBuilding />
            },
            {
              title: "Tính tiền & Hóa đơn",
              href: "/landlord/billing",
              icon: <FaMoneyBillWave />
            },
            {
              title: "Thống kê",
              href: "/landlord/dashboard",
              icon: <FaChartBar />
            }
          ]
        }
      ];
    } else {
      return [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: <FaHome />
        },
        // Menu items theo thứ tự trong hình ảnh
        {
          title: "Bài đăng của tôi",
          href: "/my-posts",
          icon: <FaFileAlt />
        },
        {
          title: "Đăng ký thuê và thanh toán",
          href: "/my-rentals",
          icon: <FaClipboardCheck />
        },
        {
          title: "Phòng của tôi",
          href: "/my-rooms",
          icon: <FaDoorOpen />
        },
        {
          title: "Hồ sơ khảo sát",
          href: "/profile/survey?role=user",
          icon: <FaUserEdit />
        },
      ];
    }
  };

  const menuItems = getMenuItems();

  // Check if any child is active
  const isChildActive = (item: MenuItem): boolean => {
    if (!item.children || item.children.length === 0) return false;
    return item.children.some(child => {
      if (child.href === "#") return false;
      // Exact match for specific routes
      if (child.href === "/landlord") {
        return pathname === "/landlord" || pathname === "/landlord/";
      }
      // For other routes, check if pathname starts with child href and is not a parent route
      if (pathname === child.href || pathname.startsWith(child.href + "/")) {
        return true;
      }
      return false;
    });
  };

  const isActive = (href: string, item?: MenuItem): boolean => {
    if (href === "#") return false;
    
    // Remove query params from href for comparison
    const hrefPath = href.split('?')[0];
    const currentPath = pathname.split('?')[0];
    
    // Special case for dashboard - exact match only
    if (hrefPath === "/dashboard") {
      return currentPath === "/dashboard";
    }
    
    // Special case for /landlord - exact match only (not /landlord/buildings, etc.)
    if (hrefPath === "/landlord") {
      return currentPath === "/landlord" || currentPath === "/landlord/";
    }
    
    // Special case for profile/survey - match exact path regardless of query params
    if (hrefPath === "/profile/survey") {
      return currentPath === "/profile/survey";
    }
    
    // For other routes, check exact match or if it's a child path
    if (currentPath === hrefPath) {
      return true;
    }
    
    // Check if pathname starts with href + "/" (to avoid matching parent routes)
    if (currentPath.startsWith(hrefPath + "/")) {
      return true;
    }
    
    // If item has children, check if any child is active
    if (item && item.children && item.children.length > 0) {
      return isChildActive(item);
    }
    
    return false;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = isActive(item.href, item);
    const childActive = hasChildren ? isChildActive(item) : false;

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpanded(item.title)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              childActive
                ? "bg-teal-50 text-teal-700 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            style={{ paddingLeft: `${0.75 + level * 1}rem` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span>{item.title}</span>
            </div>
            {isExpanded ? (
              <FaChevronDown className="text-xs" />
            ) : (
              <FaChevronRight className="text-xs" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.title}
        href={item.href}
        onClick={handleClose}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          active
            ? "bg-teal-50 text-teal-700 font-semibold"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${0.75 + level * 1}rem` }}
      >
        <span className="text-lg">{item.icon}</span>
        <span>{item.title}</span>
        {item.badge && (
          <span className="ml-auto bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 top-16 md:top-20 bg-black/50"
          style={{ zIndex: 35 }}
          onClick={handleClose}
        />
      )}

      {/* Mobile Sidebar - Fixed overlay */}
      <aside
        className={`lg:hidden fixed top-16 md:top-20 left-0 bg-white border-r border-gray-200 transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-64`}
        style={{ 
          height: 'calc(100vh - 4rem)',
          maxHeight: 'calc(100vh - 4rem)',
          zIndex: 50,
          bottom: 0
        }}
      >
        <div className="flex flex-col h-full">
          {/* Close button only */}
          <div className="flex items-center justify-end px-6 py-4 border-b border-gray-200">
            <button
              onClick={handleClose}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto px-3 pt-6 pb-4 space-y-1">
            {menuItems.map(item => renderMenuItem(item))}
          </nav>
          {user && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-16 md:top-20 left-0 w-64 bg-white border-r border-gray-200 z-40 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
        <div className="flex flex-col w-full h-full overflow-hidden">
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map(item => renderMenuItem(item))}
          </nav>
          {user && (
            <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

