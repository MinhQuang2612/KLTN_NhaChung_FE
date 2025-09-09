"use client";

import { useState, useMemo, useEffect } from "react";
import Pagination from "../common/Pagination";
import { RentPostApi } from "../../types/RentPostApi";
import { RoommatePost } from "../../services/roommatePosts";
import EditPostModal from "./EditPostModal";

// Legacy interface để tương thích với mock data
interface Post {
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
  posts: (Post | RentPostApi | RoommatePost)[];
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

// Helper function để chuẩn hóa data từ API và mock
const normalizePost = (post: Post | RentPostApi | RoommatePost): Post => {
  if ('rentPostId' in post) {
    // Đây là RentPostApi từ backend
    const api = post as RentPostApi;
    return {
      id: api.rentPostId,
      title: api.title,
      category: api.category,
      price: api.basicInfo.price,
      area: api.basicInfo.area,
      address: `${api.address.district}, ${api.address.city}`,
      status: api.status as "active" | "pending" | "inactive",
      views: 0, // Backend chưa có field views
      createdAt: new Date(api.createdAt).toISOString().split('T')[0], // Format date
      images: api.images || [],
      postType: 'rent'
    };
  } else if ('currentRoom' in post) {
    // Đây là RoommatePost từ backend
    const roommate = post as RoommatePost;
    const roommatePostId = (roommate as any).roommatePostId || roommate.postId;
    return {
      id: roommatePostId,
      title: roommate.title,
      category: 'roommate', // Đánh dấu là roommate post
      price: roommate.currentRoom.price,
      area: roommate.currentRoom.area,
      address: roommate.currentRoom.address,
      status: "active", // Roommate posts default active
      views: 0, // Backend chưa có field views  
      createdAt: new Date(roommate.createdAt).toISOString().split('T')[0], // Format date
      images: roommate.images || [],
      postType: 'roommate'
    };
  } else {
    // Đây là mock data
    return post as Post;
  }
};

export default function MyPostsContent({ posts, onEdit, onView, onDelete, onRefresh }: MyPostsContentProps) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "pending" | "inactive">("all");
  const [postTypeFilter, setPostTypeFilter] = useState<"all" | "rent" | "roommate">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const itemsPerPage = 5;

  const filteredPosts = useMemo(() => {
    let normalizedPosts = posts.map(normalizePost);
    
    // Filter by post type first
    if (postTypeFilter === "rent") {
      normalizedPosts = normalizedPosts.filter(post => post.category !== "roommate");
    } else if (postTypeFilter === "roommate") {
      normalizedPosts = normalizedPosts.filter(post => post.category === "roommate");
    }
    
    // Then filter by status
    if (activeTab === "all") {
      return normalizedPosts;
    } else {
      return normalizedPosts.filter(post => post.status === activeTab);
    }
  }, [posts, activeTab, postTypeFilter]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPosts.slice(startIndex, endIndex);
  }, [filteredPosts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);

  const getTabCount = (status: string) => {
    let normalizedPosts = posts.map(normalizePost);
    
    // Apply post type filter first
    if (postTypeFilter === "rent") {
      normalizedPosts = normalizedPosts.filter(post => post.category !== "roommate");
    } else if (postTypeFilter === "roommate") {
      normalizedPosts = normalizedPosts.filter(post => post.category === "roommate");
    }
    
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
    try { sessionStorage.setItem('myposts_current_page', String(page)); } catch {}
    setTimeout(scrollToTop, 80);
  };

  const handleEdit = (post: any) => {
    // Find original post data (not normalized)
    const originalPost = posts.find(p => 
      ('rentPostId' in p && p.rentPostId === post.id) ||
      ('roommatePostId' in p && (p as any).roommatePostId === post.id) ||
      ('postId' in p && (p as any).postId === post.id)
    );
    setSelectedPost(originalPost);
    setEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setSelectedPost(null);
  };

  const handleEditSuccess = () => {
    onRefresh(); // Refresh data from parent
  };

  const handleTabChange = (tab: "all" | "active" | "pending" | "inactive") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handlePostTypeChange = (type: "all" | "rent" | "roommate") => {
    setPostTypeFilter(type);
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

  // Restore current page from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = Number(sessionStorage.getItem('myposts_current_page') || '1');
      if (saved && saved > 0) setCurrentPage(saved);
    } catch {}
  }, []);

  // Clamp currentPage when filtered list size changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      const newPage = totalPages;
      setCurrentPage(newPage);
      try { sessionStorage.setItem('myposts_current_page', String(newPage)); } catch {}
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Tổng bài đăng</p>
              <p className="text-3xl font-bold text-blue-700">{posts.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Đang hiển thị</p>
              <p className="text-3xl font-bold text-green-700">{tabCounts.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-medium">Chờ duyệt</p>
              <p className="text-3xl font-bold text-amber-700">{tabCounts.pending}</p>
            </div>
            <div className="w-12 h-12 bg-amber-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Lượt xem</p>
              <p className="text-3xl font-bold text-purple-700">0</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👁️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      {/* Filters Row */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Post Type Filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 min-w-0">Lọc theo loại bài đăng</span>
            <div className="flex gap-2">
              {[
                { id: "all", label: "Tất cả" },
                { id: "rent", label: "Cho thuê" },
                { id: "roommate", label: "Ở ghép" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => handlePostTypeChange(type.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    postTypeFilter === type.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 ml-auto">
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
        {paginatedPosts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📄</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có bài đăng nào</h3>
            <p className="text-gray-500">Bắt đầu đăng tin để quản lý phòng trọ của bạn</p>
          </div>
        ) : (
          paginatedPosts.map((post, index) => (
            <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
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
                          📍 {post.address}
                        </span>
                        <span className="flex items-center gap-1">
                          📐 {post.area}m²
                        </span>
                        <span className="flex items-center gap-1">
                          💰 {formatPrice(post.price)}đ/tháng
                        </span>
                        <span className="flex items-center gap-1">
                          🏷️ {post.category === 'roommate' ? 'Ở ghép' : 
                              post.category === 'phong-tro' ? 'Phòng trọ' :
                              post.category === 'chung-cu' ? 'Chung cư' : 'Nhà nguyên căn'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📅 Đăng ngày: {formatDate(post.createdAt)}</span>
                        <span>👁️ {post.views} lượt xem</span>
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
                          onClick={() => onView(post.id)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                        <button
                          onClick={() => onDelete(post.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Xóa
                        </button>
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