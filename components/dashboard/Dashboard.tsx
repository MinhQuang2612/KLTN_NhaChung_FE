"use client";

import { useAuth } from "@/contexts/AuthContext";
import StatsCard from "./StatsCard";
import DashboardCard from "./DashboardCard";
import { useState, useEffect, ReactNode } from "react";
import { getUserRooms } from "@/services/rooms";
import { getUserRentalRequests } from "@/services/rentalRequests";
import { getUserFavorites } from "@/services/favorites";
import { getUserPosts } from "@/services/posts";
import { getLandlordDashboardSummary } from "@/services/landlordDashboard";
import { getBuildings } from "@/services/buildings";
import { 
  FaClipboardList, 
  FaBuilding, 
  FaDoorOpen, 
  FaMoneyBillWave, 
  FaChartBar, 
  FaFileAlt, 
  FaUser,
  FaSearch,
  FaHome,
  FaHeart,
  FaPen,
  FaClipboardCheck,
  FaLightbulb
} from "react-icons/fa";

interface MenuItem {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  color: "teal" | "blue" | "purple" | "orange" | "green" | "pink" | "indigo" | "red";
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch stats data from API
  useEffect(() => {
    const loadStats = async () => {
      if (!user || isLoading) return;
      
      setLoadingStats(true);
      try {
        if (user.role === 'landlord') {
          // Load landlord stats
          const [summary, buildingsRes] = await Promise.all([
            getLandlordDashboardSummary(),
            getBuildings().catch(() => ({ buildings: [], total: 0 }))
          ]);
          const activeContracts = summary.contracts.active || 0;
          const totalRevenue = summary.revenue.totalPaid || 0;
          const buildings = Array.isArray(buildingsRes) ? buildingsRes : (buildingsRes.buildings || []);
          const totalBuildings = buildings.length;
          const availableRooms = summary.rooms.available || 0;
          const occupiedRooms = summary.rooms.occupied || 0;
          const totalRooms = summary.rooms.total || 0;
          const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
          
          setStats([
            {
              title: "Tổng yêu cầu",
              value: String(summary.contracts.total || 0),
              change: { value: `+${summary.contracts.expiringSoon || 0}`, isPositive: true },
              icon: <FaClipboardList />,
              iconBg: "bg-teal-100",
              trend: { label: "Tháng này", percentage: Math.min(100, Math.round((activeContracts / (summary.contracts.total || 1)) * 100)) }
            },
            {
              title: "Tổng doanh thu",
              value: totalRevenue >= 1000000 ? `${(totalRevenue / 1000000).toFixed(1)}M` : `${(totalRevenue / 1000).toFixed(0)}K`,
              change: { value: "+0%", isPositive: true },
              icon: <FaMoneyBillWave />,
              iconBg: "bg-green-100",
              trend: { label: "Mục tiêu", percentage: 72 }
            },
            {
              title: "Tòa nhà",
              value: String(totalBuildings),
              change: { value: "+0", isPositive: true },
              icon: <FaBuilding />,
              iconBg: "bg-blue-100",
              trend: { label: "Đang hoạt động", percentage: 100 }
            },
            {
              title: "Phòng trống",
              value: String(availableRooms),
              change: { value: `-${occupiedRooms}`, isPositive: false },
              icon: <FaDoorOpen />,
              iconBg: "bg-orange-100",
              trend: { label: "Tỷ lệ lấp đầy", percentage: occupancyRate }
            }
          ]);
        } else {
          // Load tenant stats
          const userId = Number((user as any).userId ?? (user as any).id);
          const [rooms, rentalRequests, favorites, posts] = await Promise.all([
            getUserRooms().catch(() => []),
            getUserRentalRequests().catch(() => []),
            getUserFavorites(userId).catch(() => []),
            getUserPosts().catch(() => [])
          ]);
          
          const activeRooms = rooms.filter((r: any) => r.contractStatus === 'active').length;
          const pendingRequests = rentalRequests.filter((r: any) => r.status === 'pending' || r.status === 'pending_landlord_approval').length;
          const favoritesCount = favorites.length;
          const activePosts = posts.filter((p: any) => p.status === 'active').length;
          const totalPosts = posts.length;
          
          setStats([
            {
              title: "Phòng đang thuê",
              value: String(activeRooms),
              change: { value: "+0", isPositive: true },
              icon: <FaHome />,
              iconBg: "bg-teal-100",
              trend: { label: "Hợp đồng", percentage: activeRooms > 0 ? 100 : 0 }
            },
            {
              title: "Yêu cầu đang chờ",
              value: String(pendingRequests),
              change: { value: "+0", isPositive: true },
              icon: <FaClipboardCheck />,
              iconBg: "bg-blue-100",
              trend: { label: "Đang xử lý", percentage: Math.min(100, Math.round((pendingRequests / (rentalRequests.length || 1)) * 100)) }
            },
            {
              title: "Yêu thích",
              value: String(favoritesCount),
              change: { value: "+0", isPositive: true },
              icon: <FaHeart />,
              iconBg: "bg-red-100",
              trend: { label: "Đã lưu", percentage: 75 }
            },
            {
              title: "Bài đăng",
              value: String(totalPosts),
              change: { value: `+${activePosts}`, isPositive: true },
              icon: <FaFileAlt />,
              iconBg: "bg-purple-100",
              trend: { label: "Hoạt động", percentage: totalPosts > 0 ? Math.round((activePosts / totalPosts) * 100) : 0 }
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to load stats:", error);
        // Fallback to empty stats
        setStats([]);
      } finally {
        setLoadingStats(false);
      }
    };
    
    loadStats();
  }, [user, isLoading]);

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
      title: "Yêu thích",
      description: "Xem danh sách phòng và bài đăng bạn đã lưu",
      icon: <FaHeart />,
      href: "/favorites",
      color: "purple"
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
            <FaUser className="inline-block" />
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
  const menuItems = user?.role === 'landlord' ? landlordMenuItems : tenantMenuItems;
  const roleLabel = user?.role === 'landlord' ? 'Chủ nhà' : 'Người thuê';

  return (
    <div className="bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          {/* Welcome Section */}
          <div className="mb-8 md:mb-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Xin chào, <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">{user.name}</span>
                </h1>
              </div>
            </div>
          </div>

          {/* Stats Cards Section */}
          <div className="mb-8 md:mb-10">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-5">Thống kê nhanh</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat, index) => (
                <StatsCard key={index} {...stat} />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-8 md:mb-10"></div>

          {/* Quick Actions Section */}
          <div className="mb-8">
            <div className="space-y-5 mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Tính năng chính</h2>
                <p className="text-gray-600 text-base mt-2">Truy cập nhanh các công cụ bạn cần nhất</p>
              </div>
            </div>
            
            <div className={`grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 ${user.role === 'landlord' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
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
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-5 md:p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <FaLightbulb className="text-teal-600 text-lg" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-base mb-1">Mẹo sử dụng</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Bấm vào bất kỳ card nào để truy cập nhanh chức năng đó. Tất cả tính năng đều được tối ưu hóa cho trải nghiệm tốt nhất của bạn.
                </p>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
