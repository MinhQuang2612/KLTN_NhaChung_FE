"use client";

import { useEffect, useMemo, useState } from "react";
import PostCard from "@/components/common/PostCard";
import { UnifiedPost } from "@/types/MixedPosts";

type SortKey = "random" | "newest" | "priceAsc" | "priceDesc" | "areaDesc" | "nearest";

export default function RoomList() {
  // PropertyList chỉ nhận kết quả từ SearchDetails, không tự search
  const [items, setItems] = useState<UnifiedPost[]>([]);
  const [suggestions, setSuggestions] = useState<UnifiedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("random");
  const [activeBadges, setActiveBadges] = useState<string[]>([]);
  const [query, setQuery] = useState<string>("");

  // pagination 4x4
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Helper function để extract badges từ query
  const extractBadges = (queryValue: string): string[] => {
    const badges: string[] = [];
    if (queryValue.includes("triệu")) badges.push("Giá");
    if (queryValue.match(/\b(m2|m²|m\^2)\b/i)) badges.push("Diện tích");
    if (queryValue.includes("bao điện nước") || queryValue.includes("bao điện") || queryValue.includes("bao nước")) badges.push("Bao điện nước");
    if (queryValue.includes("gần") || queryValue.includes("quận") || queryValue.includes("phường") || queryValue.includes("tại")) badges.push("Vị trí");
    return badges;
  };

  // Lắng nghe kết quả search từ SearchDetails
  useEffect(() => {
    const handler = (ev: any) => {
      const { query: searchQuery, items: searchItems, suggestions: searchSuggestions, error: searchError } = ev?.detail || {};
      
      setQuery(searchQuery || "");
      setItems(searchItems || []);
      setErr(searchError || "");
      setLoading(false);
      
      // Lưu suggestions nếu có
      if (searchSuggestions && searchSuggestions.length > 0) {
        setSuggestions(searchSuggestions);
      }
      
      // Update badges
      if (searchQuery) {
        setActiveBadges(extractBadges(searchQuery));
      }
      
      setCurrentPage(1);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('app:search-result' as any, handler as any);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('app:search-result' as any, handler as any);
      }
    };
  }, []);

  // Lắng nghe event 'app:nlp-search' để set loading state (backward compatible)
  useEffect(() => {
    const handler = () => {
      setLoading(true);
      setErr("");
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('app:nlp-search' as any, handler as any);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('app:nlp-search' as any, handler as any);
      }
    };
  }, []);

  // Reload khi có bài đăng mới/đổi trạng thái
  useEffect(() => {
    const reloadOnPostsChanged = () => {
      const val = (typeof window !== 'undefined') ? (new URL(window.location.href)).searchParams.get('q') || '' : '';
      window.dispatchEvent(new CustomEvent('app:nlp-search', { detail: { q: val } }));
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('posts:changed', reloadOnPostsChanged as any);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('posts:changed', reloadOnPostsChanged as any);
      }
    };
  }, []);

  // PropertyList chỉ nhận kết quả từ SearchDetails, không tự search

  // sort client-side
  const sorted = useMemo(() => {
    const a = [...items];
    switch (sort) {
      case "random":
        // Giữ nguyên thứ tự ranking theo profile (không shuffle)
        // Items đã được rank theo profile ở backend/ranking service
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
                highlight={{
                  // BE trả highlight dạng string[] hoặc string, normalize về string
                  title: Array.isArray((it as any)?.originalData?.highlight?.title)
                    ? (it as any).originalData.highlight.title.join('')
                    : (it as any)?.originalData?.highlight?.title,
                  address: (() => {
                    const addrHl = (it as any)?.originalData?.highlight?.["address.full"] || (it as any)?.originalData?.highlight?.address;
                    return Array.isArray(addrHl) ? addrHl.join('') : addrHl;
                  })(),
                }}
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
