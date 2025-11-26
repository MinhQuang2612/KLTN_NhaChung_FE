"use client";

import { useAuth } from "@/contexts/AuthContext";
import DashboardCard from "./DashboardCard";
import Footer from "@/components/common/Footer";
import { 
  FaClipboardList, 
  FaBuilding, 
  FaDoorOpen, 
  FaMoneyBillWave, 
  FaChartBar, 
  FaCog, 
  FaFileAlt, 
  FaUser,
  FaSearch,
  FaHome,
  FaCreditCard,
  FaHeart,
  FaPen,
  FaClipboardCheck,
  FaLock
} from "react-icons/fa";
import { ReactNode } from "react";

interface MenuItem {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  color: "teal" | "blue" | "purple" | "orange" | "green" | "pink" | "indigo" | "red";
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  // Menu cho chủ nhà (Landlord)
  const landlordMenuItems: MenuItem[] = [
    {
      title: "Yêu cầu thuê",
      description: "Xem và quản lý các yêu cầu thuê phòng từ người dùng",
      icon: <FaClipboardList />,
      href: "/landlord",
      color: "teal"
    },
    {
      title: "Quản lý tòa nhà",
      description: "Thêm, chỉnh sửa và quản lý các tòa nhà của bạn",
      icon: <FaBuilding />,
      href: "/landlord/buildings",
      color: "blue"
    },
    {
      title: "Yêu thích",
      description: "Xem danh sách phòng và bài đăng bạn đã lưu",
      icon: <FaHeart />,
      href: "/favorites",
      color: "purple"
    },
    {
      title: "Tính tiền & Hóa đơn",
      description: "Tạo hóa đơn, tính tiền điện nước cho khách thuê",
      icon: <FaMoneyBillWave />,
      href: "/landlord/billing",
      color: "green"
    },
    {
      title: "Thống kê",
      description: "Xem báo cáo doanh thu, hợp đồng và trạng thái phòng",
      icon: <FaChartBar />,
      href: "/landlord/stats",
      color: "orange"
    },
    {
      title: "Đăng tin cho thuê",
      description: "Tạo bài đăng cho thuê phòng, căn hộ nhanh chóng",
      icon: <FaPen />,
      href: "/post",
      color: "indigo"
    },
    {
      title: "Bài đăng của tôi",
      description: "Quản lý các bài đăng tìm người thuê, tìm người ở ghép",
      icon: <FaFileAlt />,
      href: "/my-posts",
      color: "pink"
    },
    {
      title: "Hồ sơ cá nhân",
      description: "Cập nhật thông tin cá nhân và xác thực tài khoản",
      icon: <FaUser />,
      href: "/profile",
      color: "teal"
    }
  ];

  // Menu cho người thuê (Tenant/Renter)
  const tenantMenuItems: MenuItem[] = [
    {
      title: "Tìm phòng",
      description: "Tìm kiếm phòng trọ và tìm người ở ghép phù hợp",
      icon: <FaSearch />,
      href: "/find_share",
      color: "teal"
    },
    {
      title: "Đăng ký thuê và thanh toán",
      description: "Xem các yêu cầu thuê phòng, yêu cầu ở ghép và hóa đơn thanh toán của bạn",
      icon: <FaClipboardCheck />,
      href: "/my-rentals",
      color: "blue"
    },
    {
      title: "Phòng của tôi",
      description: "Quản lý các phòng bạn đang thuê và hợp đồng",
      icon: <FaHome />,
      href: "/my-rooms",
      color: "purple"
    },
    {
      title: "Yêu thích",
      description: "Xem danh sách phòng và bài đăng bạn đã lưu",
      icon: <FaHeart />,
      href: "/favorites",
      color: "red"
    },
    {
      title: "Bài đăng của tôi",
      description: "Quản lý các bài đăng tìm phòng, tìm người ở ghép",
      icon: <FaFileAlt />,
      href: "/my-posts",
      color: "pink"
    },
    {
      title: "Hồ sơ cá nhân",
      description: "Cập nhật thông tin cá nhân và xác thực tài khoản",
      icon: <FaUser />,
      href: "/profile",
      color: "indigo"
    }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-6 text-6xl text-gray-400">
            <FaLock className="inline-block" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h1>
          <p className="text-gray-600 mb-8">Bạn cần đăng nhập để truy cập Dashboard</p>
          <a 
            href="/login" 
            className="inline-block px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
          >
            Đăng nhập ngay
          </a>
        </div>
      </div>
    );
  }

  // Select menu items based on role
  const menuItems = user.role === 'landlord' ? landlordMenuItems : tenantMenuItems;
  const roleLabel = user.role === 'landlord' ? 'Chủ nhà' : 'Người thuê';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-4 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-700">
            {roleLabel}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Xin chào, <span className="text-teal-600">{user.name}</span>! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Chọn chức năng chính bạn muốn truy cập bên dưới
          </p>
        </div>

        {/* Menu Grid */}
        <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${user.role === 'landlord' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {menuItems.map((item) => (
            <DashboardCard
              key={item.title}
              title={item.title}
              description={item.description}
              icon={item.icon}
              href={item.href}
              color={item.color}
            />
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-600">
              💡 <span className="font-medium">Mẹo:</span> Bấm vào bất kỳ card nào để truy cập nhanh chức năng đó
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

