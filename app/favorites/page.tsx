"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useFavorites } from "../../contexts/FavoritesContext";
import Footer from "../../components/common/Footer";
import FavoritesContent from "../../components/favorites/FavoritesContent";
import { listRentPosts } from "../../services/rentPosts";
import { listRoommatePosts } from "../../services/roommatePosts";
import { RentPostApi } from "../../types/RentPostApi";
import { RoommatePost } from "../../services/roommatePosts";

// Mock data cho danh sách yêu thích
const mockFavorites = [
  {
    id: 1,
    title: "Phòng trọ đẹp gần trường ĐH Bách Khoa",
    category: "phong-tro",
    price: 2500000,
    area: 25,
    address: "Quận 10, TP.HCM",
    owner: "Nguyễn Văn A",
    phone: "0123456789",
    addedAt: "2024-01-15",
    images: ["/home/room1.png", "/home/room2.png"],
    description: "Phòng trọ đẹp, thoáng mát, gần trường ĐH Bách Khoa. Có đầy đủ tiện nghi cơ bản.",
    postType: "rent",
  },
  {
    id: 2,
    title: "Căn hộ chung cư 2PN 2WC tại Quận 7",
    category: "chung-cu",
    price: 8000000,
    area: 65,
    address: "Quận 7, TP.HCM",
    owner: "Trần Thị B",
    phone: "0987654321",
    addedAt: "2024-01-12",
    images: ["/home/room3.png"],
    description: "Căn hộ chung cư cao cấp, view đẹp, gần trung tâm thương mại.",
    postType: "rent",
  },
  {
    id: 3,
    title: "Nhà nguyên căn 3 tầng tại Quận 2",
    category: "nha-nguyen-can",
    price: 15000000,
    area: 120,
    address: "Quận 2, TP.HCM",
    owner: "Lê Văn C",
    phone: "0369852147",
    addedAt: "2024-01-10",
    images: ["/home/room4.png"],
    description: "Nhà nguyên căn 3 tầng, có sân vườn, gần sông, không khí trong lành.",
    postType: "rent",
  },
  {
    id: 4,
    title: "Phòng trọ giá rẻ gần chợ Bến Thành",
    category: "phong-tro",
    price: 1800000,
    area: 20,
    address: "Quận 1, TP.HCM",
    owner: "Phạm Thị D",
    phone: "0741852963",
    addedAt: "2024-01-08",
    images: ["/home/room1.png"],
    description: "Phòng trọ giá rẻ, gần chợ Bến Thành, thuận tiện đi lại.",
    postType: "rent",
  },
  {
    id: 5,
    title: "Căn hộ cao cấp view sông tại Quận 4",
    category: "chung-cu",
    price: 12000000,
    area: 85,
    address: "Quận 4, TP.HCM",
    owner: "Hoàng Văn E",
    phone: "0521478963",
    addedAt: "2024-01-20",
    images: ["/home/room2.png"],
    description: "Căn hộ cao cấp với view sông tuyệt đẹp, nội thất sang trọng.",
    postType: "rent",
  },
  {
    id: 6,
    title: "Nhà phố 2 tầng tại Quận 3",
    category: "nha-nguyen-can",
    price: 20000000,
    area: 150,
    address: "Quận 3, TP.HCM",
    owner: "Vũ Thị F",
    phone: "0963258741",
    addedAt: "2024-01-18",
    images: ["/home/room3.png"],
    description: "Nhà phố 2 tầng, vị trí trung tâm, gần các trường học và bệnh viện.",
    postType: "rent",
  },
  {
    id: 7,
    title: "Phòng trọ sinh viên gần ĐH Kinh tế",
    category: "phong-tro",
    price: 2200000,
    area: 22,
    address: "Quận 10, TP.HCM",
    owner: "Đặng Văn G",
    phone: "0147852963",
    addedAt: "2024-01-25",
    images: ["/home/room4.png"],
    description: "Phòng trọ dành cho sinh viên, gần ĐH Kinh tế, có wifi miễn phí.",
    postType: "rent",
  },
  {
    id: 8,
    title: "Căn hộ studio hiện đại tại Quận 5",
    category: "chung-cu",
    price: 6500000,
    area: 45,
    address: "Quận 5, TP.HCM",
    owner: "Bùi Thị H",
    phone: "0789632145",
    addedAt: "2024-01-22",
    images: ["/home/room1.png"],
    description: "Căn hộ studio hiện đại, thiết kế tối ưu không gian, phù hợp cho người độc thân.",
    postType: "rent",
  },
  {
    id: 9,
    title: "Phòng trọ có ban công tại Quận 6",
    category: "phong-tro",
    price: 2800000,
    area: 28,
    address: "Quận 6, TP.HCM",
    owner: "Lý Văn I",
    phone: "0321654987",
    addedAt: "2024-01-28",
    images: ["/home/room2.png"],
    description: "Phòng trọ có ban công rộng, thoáng mát, gần chợ và siêu thị.",
    postType: "rent",
  },
  {
    id: 10,
    title: "Nhà vườn 1 tầng tại Quận 9",
    category: "nha-nguyen-can",
    price: 18000000,
    area: 200,
    address: "Quận 9, TP.HCM",
    owner: "Trịnh Văn K",
    phone: "0958741236",
    addedAt: "2024-01-30",
    images: ["/home/room3.png"],
    description: "Nhà vườn 1 tầng, có sân vườn rộng, không khí trong lành, yên tĩnh.",
    postType: "rent",
  },
];

export default function FavoritesPage() {
  const { user } = useAuth();
  const { favorites: userFavorites, loading, toggleFavorite } = useFavorites();
  const [favoritedPosts, setFavoritedPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const router = useRouter();

  // Load detailed post data for favorited items
  useEffect(() => {
    const loadFavoritedPosts = async () => {
      if (!userFavorites.length) {
        setFavoritedPosts([]);
        return;
      }

      try {
        setLoadingPosts(true);
        
        // Get all posts (both rent and roommate)
        const [allRentPosts, allRoommatePosts] = await Promise.allSettled([
          listRentPosts(), // Lấy tất cả rent posts
          listRoommatePosts()
        ]);

        const rentFavorites = userFavorites.filter(fav => fav.postType === 'rent');
        const roommateFavorites = userFavorites.filter(fav => fav.postType === 'roommate');
        
        const favoritedPostsData: any[] = [];

        // Process rent favorites
        if (allRentPosts.status === 'fulfilled') {
          const rentData = allRentPosts.value;
          const rentPosts = Array.isArray((rentData as any)?.data) 
            ? (rentData as any).data 
            : Array.isArray(rentData) 
            ? rentData 
            : [];
          
          rentFavorites.forEach(fav => {
            const post = rentPosts.find((p: RentPostApi) => p.rentPostId === fav.postId);
            if (post) {
              favoritedPostsData.push({
                id: post.rentPostId,
                title: post.title,
                category: post.category,
                price: post.basicInfo.price,
                area: post.basicInfo.area,
                address: `${post.address.district}, ${post.address.city}`,
                owner: "Chủ trọ",
                phone: "0123456789",
                addedAt: fav.createdAt.split('T')[0],
                images: post.images || ["/home/room1.png"],
                description: post.description || "",
                postType: 'rent'
              });
            }
          });
        }

        // Process roommate favorites
        if (allRoommatePosts.status === 'fulfilled') {
          const roommateData = allRoommatePosts.value;
          const roommatePosts = Array.isArray((roommateData as any)?.data) 
            ? (roommateData as any).data 
            : Array.isArray(roommateData) 
            ? roommateData 
            : [];
          roommateFavorites.forEach(fav => {
            const post = roommatePosts.find((p: RoommatePost) => {
              const roommatePostId = (p as any).roommatePostId || p.postId;
              return roommatePostId === fav.postId;
            });
            if (post) {
              const roommatePostId = (post as any).roommatePostId || post.postId;
              favoritedPostsData.push({
                id: roommatePostId,
                title: post.title,
                category: 'roommate',
                price: post.currentRoom.price,
                area: post.currentRoom.area,
                address: post.currentRoom.address,
                owner: `${post.personalInfo.occupation}, ${post.personalInfo.age} tuổi`,
                phone: "0123456789", // Backend chưa có
                addedAt: fav.createdAt.split('T')[0],
                images: post.images || ["/home/room1.png"],
                description: post.description || "",
                postType: 'roommate'
              });
            }
          });
        }

        setFavoritedPosts(favoritedPostsData);
      } catch (error) {
        console.error('Failed to load favorited posts:', error);
        // Fallback to mock data
        setFavoritedPosts(mockFavorites);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadFavoritedPosts();
  }, [userFavorites]);

  const handleContact = (id: number) => {
    console.log("Contact favorite:", id);
  };

  const handleView = (id: number) => {
    // Tìm post để xác định postType
    const favorite = favoritedPosts.find(post => post.id === id);
    if (favorite) {
      const postType = favorite.postType || 'rent'; // Default to rent if not specified
      router.push(`/room_details/${postType}-${id}`);
    }
  };

  const handleRemove = async (id: number) => {
    // Find the post type from favorites
    const favorite = userFavorites.find(fav => 
      (fav.postType === 'rent' && fav.postId === id) || 
      (fav.postType === 'roommate' && fav.postId === id)
    );
    
    if (favorite) {
      await toggleFavorite(favorite.postType, id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Danh sách yêu thích</h1>
          <p className="text-gray-600">Các phòng trọ bạn đã lưu để xem sau</p>
        </div>

        {loading || loadingPosts ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải danh sách yêu thích...</p>
            </div>
          </div>
        ) : (
          <FavoritesContent
            favorites={favoritedPosts}
            onContact={handleContact}
            onView={handleView}
            onRemove={handleRemove}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}