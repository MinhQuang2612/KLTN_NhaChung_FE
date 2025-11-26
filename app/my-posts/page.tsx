"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Footer from "../../components/common/Footer";
import NotificationModal from "../../components/common/NotificationModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import MyPostsContent from "../../components/my-posts/MyPostsContent";
import { getUserPosts, deletePost, activatePost } from "../../services/posts";
import { Post } from "../../types/Post";

// Mock data cho bài đăng
const mockPosts = [
  {
    id: 1,
    title: "Phòng trọ đẹp gần trường ĐH Bách Khoa",
    category: "phong-tro",
    price: 2500000,
    area: 25,
    address: "Quận 10, TP.HCM",
    status: "active",
    views: 156,
    createdAt: "2024-01-15",
    images: ["/home/room1.png", "/home/room2.png"],
    postType: "rent",
  },
  {
    id: 2,
    title: "Căn hộ chung cư 2PN 2WC tại Quận 7",
    category: "chung-cu",
    price: 8000000,
    area: 65,
    address: "Quận 7, TP.HCM",
    status: "pending",
    views: 89,
    createdAt: "2024-01-10",
    images: ["/home/room3.png"],
    postType: "rent",
  },
  {
    id: 3,
    title: "Nhà nguyên căn 3 tầng tại Quận 2",
    category: "nha-nguyen-can",
    price: 15000000,
    area: 120,
    address: "Quận 2, TP.HCM",
    status: "inactive",
    views: 234,
    createdAt: "2024-01-05",
    images: ["/home/room4.png"],
    postType: "rent",
  },
  {
    id: 4,
    title: "Phòng trọ giá rẻ gần chợ Bến Thành",
    category: "phong-tro",
    price: 1800000,
    area: 20,
    address: "Quận 1, TP.HCM",
    status: "active",
    views: 78,
    createdAt: "2024-01-20",
    images: ["/home/room1.png"],
    postType: "rent",
  },
  {
    id: 5,
    title: "Căn hộ cao cấp view sông tại Quận 4",
    category: "chung-cu",
    price: 12000000,
    area: 85,
    address: "Quận 4, TP.HCM",
    status: "active",
    views: 312,
    createdAt: "2024-01-18",
    images: ["/home/room2.png"],
    postType: "rent",
  },
  {
    id: 6,
    title: "Nhà phố 2 tầng tại Quận 3",
    category: "nha-nguyen-can",
    price: 20000000,
    area: 150,
    address: "Quận 3, TP.HCM",
    status: "pending",
    views: 145,
    createdAt: "2024-01-12",
    images: ["/home/room3.png"],
    postType: "rent",
  },
  {
    id: 7,
    title: "Phòng trọ sinh viên gần ĐH Kinh tế",
    category: "phong-tro",
    price: 2200000,
    area: 22,
    address: "Quận 10, TP.HCM",
    status: "active",
    views: 98,
    createdAt: "2024-01-25",
    images: ["/home/room4.png"],
    postType: "rent",
  },
  {
    id: 8,
    title: "Căn hộ studio hiện đại tại Quận 5",
    category: "chung-cu",
    price: 6500000,
    area: 45,
    address: "Quận 5, TP.HCM",
    status: "inactive",
    views: 167,
    createdAt: "2024-01-08",
    images: ["/home/room1.png"],
    postType: "rent",
  },
];

export default function MyPostsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noti, setNoti] = useState<{open: boolean; type: 'success'|'error'|'warning'|'info'; title: string; message: string}>({open:false, type:'info', title:'', message:''});
  const [confirm, setConfirm] = useState<{open: boolean; postId?: number}>({open:false});

  // Load user's posts (both rent and roommate)
  const loadUserPosts = async () => {
      if (!user?.userId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user posts using new unified API
        const userPosts = await getUserPosts();
        setPosts(userPosts);
      } catch (err: any) {
        setError('Không thể tải bài đăng. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadUserPosts();
  }, [user?.userId]);

  const handleEdit = (id: number) => {
  };

  const handleView = (id: number) => {
    // Tìm post gốc để xác định loại
    const post = posts.find(p => p.postId === id);
    
    if (post) {
      // Xác định postType dựa trên postType từ API
      let postType = 'rent';
      if (post.postType === 'rent' || (post.postType as any) === 'cho-thue') {
        postType = 'rent';
      } else if (post.postType === 'roommate' || (post.postType as any) === 'tim-o-ghep') {
        postType = 'roommate';
      }
      
      router.push(`/room_details/${postType}-${id}`);
    }
  };

  const handleDelete = async (id: number) => {
    setConfirm({ open: true, postId: id });
  };

  const doDelete = async () => {
    const id = confirm.postId!;
    try {
      await deletePost(id);
      await loadUserPosts();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('posts:changed'));
      }
      setNoti({ open: true, type: 'success', title: 'Đã ẩn bài đăng', message: 'Bài đăng đã được ẩn thành công.' });
    } catch (e: any) {
      setNoti({ open: true, type: 'error', title: 'Ẩn thất bại', message: e?.message || 'Không thể ẩn bài đăng.' });
    } finally {
      setConfirm({ open: false, postId: undefined });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bài đăng của tôi</h1>
          <p className="text-gray-600">Quản lý các bài đăng phòng trọ của bạn</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải bài đăng...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <MyPostsContent
            posts={posts}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            onActivate={async (id: number) => {
              try {
                await activatePost(id);
                await loadUserPosts();
                setNoti({ open: true, type: 'success', title: 'Đã kích hoạt', message: 'Bài đăng đã được hiển thị trở lại.' });
              } catch (e: any) {
                setNoti({ open: true, type: 'error', title: 'Kích hoạt thất bại', message: e?.message || 'Không thể kích hoạt bài đăng.' });
              }
            }}
            onRefresh={loadUserPosts}
          />
        )}
      </div>

      <Footer />
      {/* Confirm delete modal - gọn và không chồng nút */}
      <ConfirmModal
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={doDelete}
        title="Ẩn bài đăng?"
        message="Bạn có chắc muốn ẩn bài đăng này? Bạn có thể kích hoạt lại sau."
        confirmText="Ẩn"
        cancelText="Hủy"
        type="danger"
      />
      {/* Toast result */}
      <NotificationModal
        isOpen={noti.open}
        onClose={() => setNoti(prev=>({ ...prev, open:false }))}
        type={noti.type}
        title={noti.title}
        message={noti.message}
      />
    </div>
  );
}