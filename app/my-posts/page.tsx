"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Footer from "../../components/common/Footer";
import MyPostsContent from "../../components/my-posts/MyPostsContent";
import { getUserRentPosts } from "../../services/rentPosts";
import { listRoommatePosts } from "../../services/roommatePosts";
import { RentPostApi } from "../../types/RentPostApi";
import { RoommatePost } from "../../services/roommatePosts";

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
  const [posts, setPosts] = useState<(RentPostApi | RoommatePost)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's posts (both rent and roommate)
  const loadUserPosts = async () => {
      if (!user?.userId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch cả rent posts và roommate posts của user
        const [rentResponse, roommateResponse] = await Promise.allSettled([
          getUserRentPosts(user.userId),
          listRoommatePosts({ userId: user.userId })
        ]);
        
        const allPosts: (RentPostApi | RoommatePost)[] = [];
        
        // Process rent posts
        if (rentResponse.status === 'fulfilled') {
          const rentData = rentResponse.value;
          const rentPosts = Array.isArray((rentData as any)?.data) 
            ? (rentData as any).data 
            : Array.isArray(rentData) 
            ? rentData 
            : [];
          allPosts.push(...rentPosts);
        }
        
        // Process roommate posts
        if (roommateResponse.status === 'fulfilled') {
          const roommateData = roommateResponse.value;
          const roommatePosts = Array.isArray((roommateData as any)?.data) 
            ? (roommateData as any).data 
            : Array.isArray(roommateData) 
            ? roommateData 
            : [];
          allPosts.push(...roommatePosts);
        }
        
        setPosts(allPosts);
      } catch (err: any) {
        console.error('Failed to load user posts:', err);
        setError('Không thể tải bài đăng. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadUserPosts();
  }, [user?.userId]);

  const handleEdit = (id: number) => {
    console.log("Edit post:", id);
  };

  const handleView = (id: number) => {
    // Tìm post gốc để xác định loại
    const post = posts.find(p => 
      ('rentPostId' in p && p.rentPostId === id) ||
      (('roommatePostId' in p || 'postId' in p) && ((p as any).roommatePostId === id || (p as any).postId === id)) ||
      ((p as any).id === id) // For mock data
    );
    
    if (post) {
      // Xác định postType dựa trên cấu trúc dữ liệu
      let postType = 'rent';
      if ('rentPostId' in post) {
        postType = 'rent';
      } else if ('currentRoom' in post) {
        postType = 'roommate';
      } else if ((post as any).postType) {
        postType = (post as any).postType;
      } else if ((post as any).category === 'roommate') {
        postType = 'roommate';
      }
      
      router.push(`/room_details/${postType}-${id}`);
    }
  };

  const handleDelete = (id: number) => {
    console.log("Delete post:", id);
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
            onRefresh={loadUserPosts}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}