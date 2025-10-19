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
import { nlpSearch, NlpSearchItem } from "@/services/nlpSearch";
import { extractApiErrorMessage } from "@/utils/api";

type SortKey = "random" | "newest" | "priceAsc" | "priceDesc" | "areaDesc" | "nearest";

export default function RoomList() {
  const [items, setItems] = useState<UnifiedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("random");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeBadges, setActiveBadges] = useState<string[]>([]);
  const [query, setQuery] = useState<string>("");
  const { user } = useAuth();

  // pagination 4x4
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

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
        const url = new URL((typeof window !== 'undefined') ? window.location.href : 'http://localhost');
        const q = url.searchParams.get('q') || "";
        setQuery(q);

        let searchResponse: any = null;
        if (q.trim()) {
          try {
            const nlpRes = await nlpSearch({ q });
            searchResponse = Array.isArray(nlpRes) ? { posts: nlpRes } : nlpRes;
          } catch (e: any) {
            // Xử lý lỗi: 400 thiếu q, 500 nội bộ, 408 timeout
            const status = (e as any)?.status;
            if (status === 400) {
              setErr("Vui lòng nhập truy vấn để tìm kiếm.");
            } else if (status === 408) {
              setErr("Hệ thống bận, vui lòng thử lại.");
            } else {
              setErr(extractApiErrorMessage(e));
            }
            searchResponse = { posts: [] };
          }
        } else {
          // Fallback: lấy danh sách tổng hợp cũ nếu chưa gõ truy vấn
          searchResponse = await searchPosts();
        }
        
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
            .filter((post: any) => post.roomId)
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
          .filter((result: any) => result.shouldShow)
          .map((result: any) => result.post);

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
          const distance = (post as NlpSearchItem)?.distance;
          const score = (post as NlpSearchItem)?.score;
          
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
            originalData: { ...post, distance, score }
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
          // badges tự suy luận đơn giản từ q
          const badges: string[] = [];
          if (q.includes("triệu")) badges.push("Giá");
          if (q.match(/\b(m2|m²|m\^2)\b/i)) badges.push("Diện tích");
          if (q.includes("bao điện nước") || q.includes("bao điện") || q.includes("bao nước")) badges.push("Bao điện nước");
          if (q.includes("gần") || q.includes("quận") || q.includes("phường") || q.includes("tại")) badges.push("Vị trí");
          setActiveBadges(badges);
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

  // Lắng nghe event từ SearchDetails
  useEffect(() => {
    const handler = (ev: any) => {
      const value = ev?.detail?.q || "";
      setQuery(value);
      // Triggers reload
      (async () => {
        try {
          setLoading(true);
          setErr("");
          const nlpRes = value.trim() ? await nlpSearch({ q: value }) : await searchPosts();
          const allPosts = Array.isArray(nlpRes) ? nlpRes : (Array.isArray((nlpRes as any)?.posts) ? (nlpRes as any).posts : []);
          const roomDataMap: Record<string, any> = {};
          await Promise.all(allPosts.filter((p: any) => p.roomId).map(async (p: any) => {
            try { roomDataMap[p.roomId] = await getRoomById(p.roomId); } catch {}
          }));
          const visibilityResults = checkMultiplePostsVisibility(allPosts, roomDataMap);
          const visiblePosts = visibilityResults.filter(v => v.shouldShow).map(v => v.post);
          const unified: UnifiedPost[] = visiblePosts.map((post: any) => {
            const mappedPostType = post.postType === 'cho-thue' ? 'rent' : post.postType === 'tim-o-ghep' ? 'roommate' : post.postType;
            const roomData = roomDataMap[post.roomId];
            const distance = (post as NlpSearchItem)?.distance;
            const score = (post as NlpSearchItem)?.score;
            let price = 0, area = 0, location = 'Chưa xác định', address: any = undefined, bedrooms: any = undefined, bathrooms: any = undefined, images = post.images || [];
            if (roomData) {
              price = roomData.price || 0;
              area = roomData.area || 0;
              location = roomData.address ? `${roomData.address.ward}, ${roomData.address.city}` : 'Chưa xác định';
              address = roomData.address;
              bedrooms = roomData.chungCuInfo?.bedrooms || roomData.nhaNguyenCanInfo?.bedrooms;
              bathrooms = roomData.chungCuInfo?.bathrooms || roomData.nhaNguyenCanInfo?.bathrooms;
              images = roomData.images?.length > 0 ? roomData.images : (post.images || []);
            }
            return {
              id: post.postId,
              type: (mappedPostType as any) || 'rent',
              title: post.title || 'Không có tiêu đề',
              description: post.description || 'Không có mô tả',
              images,
              price,
              area,
              location,
              address,
              category: post.category || mappedPostType,
              photoCount: images.length + (post.videos?.length || 0),
              bedrooms,
              bathrooms,
              isVerified: false,
              createdAt: post.createdAt,
              originalData: { ...post, distance, score },
            } as UnifiedPost;
          });
          const selectedCityLS = (typeof window !== 'undefined') ? localStorage.getItem('selectedCity') || '' : '';
          const userCity = (user as any)?.address?.city || (user as any)?.city || '';
          const cityToFilter = profile?.preferredCity || selectedCityLS || userCity;
          const opts: PostRankingOptions = { profileCity: cityToFilter, strictCityFilter: false };
          const { ranked } = rankPosts(unified, profile, opts);
          const rankedOut = ranked.map(({ _score, _price, _cityMatch, _cityScore, ...rest }) => rest as UnifiedPost);
          setItems(rankedOut);
          const badges: string[] = [];
          if (value.includes("triệu")) badges.push("Giá");
          if (value.match(/\b(m2|m²|m\^2)\b/i)) badges.push("Diện tích");
          if (value.includes("bao điện nước") || value.includes("bao điện") || value.includes("bao nước")) badges.push("Bao điện nước");
          if (value.includes("gần") || value.includes("quận") || value.includes("phường") || value.includes("tại")) badges.push("Vị trí");
          setActiveBadges(badges);
          setCurrentPage(1);
        } catch (e: any) {
          setErr(extractApiErrorMessage(e));
        } finally {
          setLoading(false);
        }
      })();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('app:nlp-search' as any, handler as any);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('app:nlp-search' as any, handler as any);
      }
    };
  }, [profile, user]);

  // sort client-side
  const sorted = useMemo(() => {
    const a = [...items];
    switch (sort) {
      case "random":
        // Giữ nguyên thứ tự shuffle từ API load
        return a;
      case "nearest":
        a.sort((x, y) => {
          const dx = (x.originalData as any)?.distance ?? Number.POSITIVE_INFINITY;
          const dy = (y.originalData as any)?.distance ?? Number.POSITIVE_INFINITY;
          return dx - dy;
        });
        break;
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

  // paginate 4x4
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
            <option value="nearest">Gần nhất</option>
          </select>
        </div>
      </div>

      {/* Badges tiêu chí */}
      {activeBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {activeBadges.map((b) => (
            <span key={b} className="px-2 py-1 text-xs rounded-md bg-teal-50 text-teal-700 border border-teal-200">{b}</span>
          ))}
        </div>
      )}

      {/* States */}
      {loading && <div className="text-gray-600">Đang tải…</div>}
      {err && !loading && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
          <span>{err}</span>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                const val = url.searchParams.get('q') || '';
                window.dispatchEvent(new CustomEvent('app:nlp-search', { detail: { q: val } }));
              }
            }}
            className="text-sm font-medium underline hover:text-red-800"
          >
            Thử lại
          </button>
        </div>
      )}
      {!loading && !err && current.length === 0 && (
        <div className="text-gray-600">Không có bài đăng nào.</div>
      )}

      {/* Grid - Layout 4x4 */}
      {!loading && !err && current.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
