"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Pagination from "../common/Pagination";
import { RentPostApi } from "../../types/RentPostApi";
import { Post } from "../../types/Post";
import EditPostModal from "./EditPostModal";
import { addressService } from "../../services/address";
import { getRoomById } from "../../services/rooms";
import { FaClipboardList, FaCheckCircle, FaClock, FaFileAlt, FaMapMarkerAlt, FaRulerCombined, FaMoneyBillWave, FaCalendarAlt } from "react-icons/fa";

// Legacy interface để tương thích với mock data
interface LegacyPost {
  id: number;
  title: string;
  category: string;
  price: number;
  area: number;
  address: string;
  status: "active" | "pending" | "inactive";
  views: number;
  createdAt: string;
  images: string[];
  postType?: string;
}

interface MyPostsContentProps {
  posts: Post[];
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  onActivate: (id: number) => void;
  onRefresh: () => void;
}

// Helper function để chuẩn hóa data từ API
const normalizePost = async (post: Post): Promise<LegacyPost> => {
  let roomData = null;
  
  // Fetch room data if post has roomId
  if (post.roomId) {
    try {
      roomData = await getRoomById(post.roomId);
    } catch (error) {
      roomData = null;
    }
  } else {
    roomData = post.roomInfo;
  }
  
  // Format address
  let address = "Địa chỉ không xác định";
  if (roomData?.address) {
    if (typeof roomData.address === 'string') {
      address = roomData.address;
    } else if (typeof roomData.address === 'object') {
      address = addressService.formatWardCity(roomData.address);
    }
  }
  
  // Get images with fallback logic: Post images > Room images > default
  let images = [];
  if (post.images && post.images.length > 0) {
    images = post.images;
  } else if ((roomData as any)?.images && (roomData as any).images.length > 0) {
    images = (roomData as any).images;
  } else {
    images = ['/home/room1.png']; // Default fallback
  }

  // Convert Post to LegacyPost format for display
  return {
    id: post.postId,
    title: post.title,
    category: post.postType === 'rent' ? 'phong-tro' : 'roommate',
    price: (roomData as any)?.price || (roomData as any)?.basicInfo?.price || 0,
    area: (roomData as any)?.area || (roomData as any)?.basicInfo?.area || 0,
    address: address,
    status: post.status === 'active' ? 'active' : 
            post.status === 'pending' ? 'pending' : 'inactive',
    views: 0, // API mới không có views
    createdAt: post.createdAt.split('T')[0],
    images: images,
    postType: post.postType === 'rent' ? 'rent' : 'roommate'
  };
};

export default function MyPostsContent({ posts, onEdit, onView, onDelete, onActivate, onRefresh }: MyPostsContentProps) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "pending" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [normalizedPosts, setNormalizedPosts] = useState<LegacyPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const hasRestoredRef = useRef(false);
  const itemsPerPage = 5;

  // Normalize posts when posts change
  useEffect(() => {
    const loadNormalizedPosts = async () => {
      if (!posts.length) {
        setNormalizedPosts([]);
        return;
      }

      try {
        setLoadingPosts(true);
        const normalizedResults = await Promise.all(posts.map(normalizePost));
        setNormalizedPosts(normalizedResults);
      } catch (error) {
        setNormalizedPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadNormalizedPosts();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    // Filter by status only
    if (activeTab === "all") {
      return normalizedPosts;
    } else {
      return normalizedPosts.filter(post => post.status === activeTab);
    }
  }, [normalizedPosts, activeTab]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPosts.slice(startIndex, endIndex);
  }, [filteredPosts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);

  const getTabCount = (status: string) => {
    if (status === "all") return normalizedPosts.length;
    return normalizedPosts.filter(post => post.status === status).length;
  };

  const tabCounts = {
    all: getTabCount("all"),
    active: getTabCount("active"),
    pending: getTabCount("pending"),
    inactive: getTabCount("inactive"),
  };

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Không lưu vào sessionStorage khi thay đổi trang thông thường
    setTimeout(scrollToTop, 80);
  };

  const handleEdit = (post: any) => {
    // Find original post data (not normalized) - ưu tiên theo loại post
    let originalPost;
    
    if (post.category === 'roommate') {
      // Tìm roommate post
      originalPost = posts.find(p => 
        ('roommatePostId' in p && (p as any).roommatePostId === post.id) ||
        ('postId' in p && (p as any).postId === post.id)
      );
    } else {
      // Tìm rent post
      originalPost = posts.find(p => 
        ('rentPostId' in p && p.rentPostId === post.id)
      );
    }
    
    setSelectedPost(originalPost);
    setEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setSelectedPost(null);
  };

  const handleEditSuccess = () => {
    // Lưu trang hiện tại trước khi refresh
    try { sessionStorage.setItem('myposts_current_page', String(currentPage)); } catch {}
    onRefresh(); // Refresh data from parent
  };

  const handleView = (id: number) => {
    // Lưu trang hiện tại trước khi xem chi tiết
    try { sessionStorage.setItem('myposts_current_page', String(currentPage)); } catch {}
    onView(id);
  };

  const handleDelete = (id: number) => {
    // Lưu trang hiện tại trước khi xóa
    try { sessionStorage.setItem('myposts_current_page', String(currentPage)); } catch {}
    onDelete(id);
  };

  const handleTabChange = (tab: "all" | "active" | "pending" | "inactive") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Đang hiển thị";
      case "pending": return "Chờ duyệt";
      case "inactive": return "Đã ẩn";
      default: return status;
    }
  };

  // Restore current page from sessionStorage on mount (chỉ khi có edit trước đó)
  useEffect(() => {
    if (hasRestoredRef.current) return; // Chỉ restore 1 lần
    
    try {
      const saved = Number(sessionStorage.getItem('myposts_current_page') || '1');
      if (saved && saved > 0) {
        // Chỉ restore nếu có dữ liệu posts
        if (filteredPosts.length > 0) {
          const maxPage = Math.ceil(filteredPosts.length / itemsPerPage);
          const validPage = Math.min(saved, maxPage);
          setCurrentPage(validPage);
        }
        hasRestoredRef.current = true;
        // Xóa sessionStorage sau khi restore để lần sau vào lại sẽ về trang 1
        sessionStorage.removeItem('myposts_current_page');
      }
    } catch (e) {
      // Silent fail
    }
  }, [filteredPosts.length, itemsPerPage]); // Chờ filteredPosts có dữ liệu

  // Clamp currentPage when filtered list size changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      const newPage = totalPages;
      setCurrentPage(newPage);
      // Không lưu vào sessionStorage khi clamp trang
    }
  }, [totalPages]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-xs sm:text-sm font-medium">Tổng bài đăng</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-700">{posts.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <FaClipboardList className="text-xl sm:text-2xl text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-xs sm:text-sm font-medium">Đang hiển thị</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-700">{tabCounts.active}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="text-xl sm:text-2xl text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 sm:p-6 border border-amber-200 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-xs sm:text-sm font-medium">Chờ duyệt</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-700">{tabCounts.pending}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-200 rounded-lg flex items-center justify-center">
              <FaClock className="text-xl sm:text-2xl text-amber-600" />
            </div>
          </div>
        </div>

        {/* Lượt xem đã được loại bỏ theo yêu cầu */}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      {/* Filters Row */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Status Tabs */}
          <div className="flex gap-1">
            {[
              { id: "all", label: "Tất cả", count: tabCounts.all },
              { id: "active", label: "Đang hiển thị", count: tabCounts.active },
              { id: "pending", label: "Chờ duyệt", count: tabCounts.pending },
              { id: "inactive", label: "Đã ẩn", count: tabCounts.inactive },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-teal-100 text-teal-700 border border-teal-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.label} <span className="ml-1 text-xs">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="divide-y divide-gray-100">
        {loadingPosts ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin bài đăng...</p>
          </div>
        ) : paginatedPosts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaFileAlt className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có bài đăng nào</h3>
            <p className="text-gray-500">Bắt đầu đăng tin để quản lý phòng trọ của bạn</p>
          </div>
        ) : (
          paginatedPosts.map((post, index) => (
            <div key={`${post.postType || post.category}-${post.id}-${index}`} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Image */}
                <div className="flex-shrink-0">
                  <img
                    src={post.images[0] || '/home/room1.png'}
                    alt={post.title}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                        {post.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt className="text-gray-500" />
                          {post.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaRulerCombined className="text-gray-500" />
                          {post.area}m²
                        </span>
                        <span className="flex items-center gap-1">
                          <FaMoneyBillWave className="text-gray-500" />
                          {formatPrice(post.price)}đ/tháng
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt className="text-gray-500" />
                          Đăng ngày: {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex-shrink-0 text-right">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${getStatusColor(post.status)}`}>
                        {getStatusText(post.status)}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => handleView(post.id)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                        {post.status === 'inactive' ? (
                          <button
                            onClick={() => onActivate(post.id)}
                            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            Kích hoạt
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Ẩn
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={filteredPosts.length}
          />
        </div>
      )}
      </div>

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={editModalOpen}
        onClose={handleCloseModal}
        post={selectedPost}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}