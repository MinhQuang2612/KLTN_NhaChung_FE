"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useFavorites } from "../../contexts/FavoritesContext";
import FavoritesContent from "../../components/favorites/FavoritesContent";
import { getPosts } from "../../services/posts";
import { Post } from "../../types/Post";
import { addressService } from "../../services/address";
import { AgeUtils } from "../../utils/ageUtils";
import { getRoomById } from "../../services/rooms";


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
        
        // Get all posts using unified API
        const allPostsResponse = await getPosts({});
        
        // Handle both array and object response formats
        let allPosts: Post[] = [];
        if (Array.isArray(allPostsResponse)) {
          // Direct array response
          allPosts = allPostsResponse;
        } else if (allPostsResponse && typeof allPostsResponse === 'object' && 'posts' in allPostsResponse) {
          // Object with posts field
          allPosts = allPostsResponse.posts || [];
        }
        
        const favoritedPostsData: any[] = [];

        // Process each favorite and fetch room data
        const favoritePromises = userFavorites.map(async (fav) => {
          const post = allPosts.find((p: Post) => p.postId === fav.postId);
          
          if (!post) {
            return null;
          }

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
          
          // Determine category from post data
          let category = 'phong-tro'; // default
          if (post.postType === 'roommate') {
            category = 'roommate';
          } else if (roomData?.chungCuInfo) {
            category = 'chung-cu';
          } else if (roomData?.nhaNguyenCanInfo) {
            category = 'nha-nguyen-can';
          } else {
            category = 'phong-tro';
          }
          
          // Format address
          let address = "Chưa có địa chỉ";
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

          return {
            id: post.postId,
            title: post.title,
            category: category,
            price: (roomData as any)?.price || (roomData as any)?.basicInfo?.price || 0,
            area: (roomData as any)?.area || (roomData as any)?.basicInfo?.area || 0,
            address: address,
            owner: post.postType === 'roommate' && post.personalInfo 
              ? `${post.personalInfo.occupation}, ${post.personalInfo.age} tuổi`
              : "Chủ trọ",
            phone: post.phone || "0123456789",
            addedAt: fav.createdAt.split('T')[0],
            images: images,
            description: post.description || "",
            postType: fav.postType
          };
        });

        // Wait for all promises to resolve
        const favoriteResults = await Promise.all(favoritePromises);
        
        // Filter out null results
        favoriteResults.forEach(result => {
          if (result) {
            favoritedPostsData.push(result);
          }
        });

        setFavoritedPosts(favoritedPostsData);
      } catch (error) {
        setFavoritedPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadFavoritedPosts();
  }, [userFavorites]);

  const handleContact = (id: number) => {
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
    const favorite = userFavorites.find(fav => fav.postId === id);
    
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
    </div>
  );
}