"use client";

import { useEffect, useMemo, useState } from "react";
import PostCard from "@/components/common/PostCard";
import { searchPosts } from "@/services/posts";
import { getRoomById } from "@/services/rooms";
import { rentPostToUnified, roommatePostToUnified, shuffleArray, UnifiedPost } from "@/types/MixedPosts";
import { getMyProfile, UserProfile } from "@/services/userProfiles";
import { rankPosts, PostRankingOptions } from "@/services/postRanking";
import { useAuth } from "@/contexts/AuthContext";
import { checkMultiplePostsVisibility } from "@/utils/roomVisibility";

type SortKey = "random" | "newest" | "priceAsc" | "priceDesc" | "areaDesc";

export default function RoomList() {
  const [items, setItems] = useState<UnifiedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("random");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { user } = useAuth();

  // pagination 3x3
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // Load profile nếu có
        try {
          const pf = await getMyProfile();
          setProfile(pf as any);
        } catch {}

        // Gọi unified search API để lấy tất cả posts
        const searchResponse = await searchPosts();
        
        // Xử lý kết quả từ search API
        const allPosts = Array.isArray(searchResponse)
          ? searchResponse
          : Array.isArray(searchResponse?.posts)
          ? searchResponse.posts
          : [];
        
        // Fetch room data for all posts first
        const roomDataMap: Record<string, any> = {};
        await Promise.all(
          allPosts
            .filter(post => post.roomId)
            .map(async (post: any) => {
              try {
                const roomData = await getRoomById(post.roomId);
                roomDataMap[post.roomId] = roomData;
              } catch (error) {
                // Room data không tải được, sẽ skip post này
              }
            })
        );

        // Filter posts based on room visibility logic
        const visibilityResults = checkMultiplePostsVisibility(allPosts, roomDataMap);
        const visiblePosts = visibilityResults
          .filter(result => result.shouldShow)
          .map(result => result.post);

        // Convert to unified format
        const unifiedPosts: UnifiedPost[] = visiblePosts.map((post: any) => {
          // Map backend postType to frontend format
          const mappedPostType = post.postType === 'cho-thue' ? 'rent' : 
                                 post.postType === 'tim-o-ghep' ? 'roommate' : post.postType;
          
          // Get room data
          const roomData = roomDataMap[post.roomId];
          let price = 0;
          let area = 0;
          let location = 'Chưa xác định';
          let address = undefined;
          let bedrooms = undefined;
          let bathrooms = undefined;
          let images = post.images || [];
          
          if (roomData) {
            price = roomData.price || 0;
            area = roomData.area || 0;
            location = roomData.address ? 
              `${roomData.address.ward}, ${roomData.address.city}` : 
              'Chưa xác định';
            address = roomData.address;
            bedrooms = roomData.chungCuInfo?.bedrooms || roomData.nhaNguyenCanInfo?.bedrooms;
            bathrooms = roomData.chungCuInfo?.bathrooms || roomData.nhaNguyenCanInfo?.bathrooms;
            images = roomData.images?.length > 0 ? roomData.images : (post.images || []);
          }
          
          // Convert new API format to UnifiedPost format
          return {
            id: post.postId,
            type: mappedPostType as 'rent' | 'roommate',
            title: post.title || 'Không có tiêu đề',
            description: post.description || 'Không có mô tả',
            images: images,
            price: price,
            area: area,
            location: location,
            address: address,
            category: post.category || mappedPostType,
            photoCount: images.length + (post.videos?.length || 0),
            bedrooms: bedrooms,
            bathrooms: bathrooms,
            isVerified: false,
            createdAt: post.createdAt,
            originalData: post
          };
        });
        
        // Sử dụng service ranking với priority city filter
        // Fallback về selectedCity nếu profile không có preferredCity
        const selectedCityLS = (typeof window !== 'undefined') ? localStorage.getItem('selectedCity') || '' : '';
        const userCity = (user as any)?.address?.city || (user as any)?.city || '';
        const cityToFilter = profile?.preferredCity || selectedCityLS || userCity;
        
        const rankingOptions: PostRankingOptions = {
          profileCity: cityToFilter,
          strictCityFilter: false // PropertyList: ưu tiên thành phố nhưng không loại bỏ
        };
        
        const { ranked } = rankPosts(unifiedPosts, profile, rankingOptions);
        const shuffledPosts = ranked.map(({ _score, _price, _cityMatch, _cityScore, ...rest }) => rest as UnifiedPost);

        if (!cancelled) {
          setItems(shuffledPosts);
          setCurrentPage(1);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Không tải được danh sách");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // sort client-side
  const sorted = useMemo(() => {
    const a = [...items];
    switch (sort) {
      case "random":
        // Giữ nguyên thứ tự shuffle từ API load
        return a;
      case "priceAsc":
        a.sort(
          (x, y) => {
            const xPrice = x?.price || 0;
            const yPrice = y?.price || 0;
            return xPrice - yPrice;
          }
        );
        break;
      case "priceDesc":
        a.sort(
          (x, y) => {
            const xPrice = x?.price || 0;
            const yPrice = y?.price || 0;
            return yPrice - xPrice;
          }
        );
        break;
      case "areaDesc":
        a.sort((x, y) => (y.area ?? 0) - (x.area ?? 0));
        break;
      case "newest":
        a.sort((x, y) => (y.id ?? 0) - (x.id ?? 0)); // tạm coi id giảm dần là mới
        break;
    }
    return a;
  }, [items, sort]);

  // paginate 3x3
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sorted.length);
  const current = sorted.slice(startIndex, endIndex);

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  };
  const goPage = (p: number) => {
    setCurrentPage(p);
    setTimeout(scrollToTop, 80);
  };
  const prev = () => currentPage > 1 && goPage(currentPage - 1);
  const next = () => currentPage < totalPages && goPage(currentPage + 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Danh sách phòng trọ ({sorted.length})
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Sắp xếp theo:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="random">Ngẫu nhiên</option>
            <option value="newest">Mới nhất</option>
            <option value="priceAsc">Giá tăng dần</option>
            <option value="priceDesc">Giá giảm dần</option>
            <option value="areaDesc">Diện tích</option>
          </select>
        </div>
      </div>

      {/* States */}
      {loading && <div className="text-gray-600">Đang tải…</div>}
      {err && !loading && <div className="text-red-600">{err}</div>}
      {!loading && !err && current.length === 0 && (
        <div className="text-gray-600">Không có bài đăng nào.</div>
      )}

      {/* Grid */}
      {!loading && !err && current.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {current.map((it) => (
              <PostCard 
                key={`${it.type}-${it.id}`} 
                rentPostId={it.id}
                category={it.category as any || it.type as any}
                title={it.title}
                cover={it.images[0] || "/home/room1.png"}
                photoCount={it.photoCount}
                area={it.area}
                bedrooms={it.bedrooms || 0}
                bathrooms={it.bathrooms || 0}
                // truyền address nếu có để RoomCard format phường + thành phố
                {...(it.address ? { address: it.address as any } : { city: it.location || '' })}
                price={it.price}
                isVerified={it.isVerified || false}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={prev}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                aria-label="Trang trước"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goPage(p)}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    currentPage === p
                      ? "bg-teal-500 text-white border-teal-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                  aria-current={currentPage === p ? "page" : undefined}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={next}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                aria-label="Trang sau"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}

          <div className="text-center text-sm text-gray-600">
            Hiển thị {startIndex + 1}-{endIndex} trong tổng số {sorted.length} bài
          </div>
        </>
      )}
    </div>
  );
}
