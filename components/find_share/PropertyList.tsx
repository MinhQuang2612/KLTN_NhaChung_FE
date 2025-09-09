"use client";

import { useEffect, useMemo, useState } from "react";
import RoomCard from "@/components/common/RoomCard";
import { listRentPosts } from "@/services/rentPosts";
import { listRoommatePosts } from "@/services/roommatePosts";
import { rentPostToUnified, roommatePostToUnified, shuffleArray, UnifiedPost } from "@/types/MixedPosts";
import type { RentPostApi } from "@/types/RentPostApi";
import type { RoommatePost } from "@/services/roommatePosts";

type SortKey = "random" | "newest" | "priceAsc" | "priceDesc" | "areaDesc";

export default function RoomList() {
  const [items, setItems] = useState<UnifiedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("random");

  // pagination 3x3
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // Gọi cả 2 APIs đồng thời
        const [rentResponse, roommateResponse] = await Promise.allSettled([
          listRentPosts(),
          listRoommatePosts()
        ]);

        const rentPosts: RentPostApi[] = [];
        const roommatePosts: RoommatePost[] = [];

        // Xử lý kết quả rent posts
        if (rentResponse.status === 'fulfilled') {
          const rentData = rentResponse.value;
          const rentRaw = Array.isArray((rentData as any)?.data)
            ? (rentData as any).data
            : Array.isArray(rentData)
            ? (rentData as any)
            : [];
          rentPosts.push(...rentRaw);
        }

        // Xử lý kết quả roommate posts
        if (roommateResponse.status === 'fulfilled') {
          const roommateData = roommateResponse.value;
          const roommateRaw = Array.isArray((roommateData as any)?.data)
            ? (roommateData as any).data
            : Array.isArray(roommateData)
            ? (roommateData as any)
            : [];
          roommatePosts.push(...roommateRaw);
        }

        // Convert to unified format và mix ngẫu nhiên
        const unifiedRentPosts = rentPosts.map(rentPostToUnified);
        const unifiedRoommatePosts = roommatePosts.map(roommatePostToUnified);
        
        // Kết hợp và shuffle
        const allPosts = [...unifiedRentPosts, ...unifiedRoommatePosts];
        const shuffledPosts = shuffleArray(allPosts);

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
          (x, y) =>
            (x.price ?? Number.POSITIVE_INFINITY) -
            (y.price ?? Number.POSITIVE_INFINITY)
        );
        break;
      case "priceDesc":
        a.sort(
          (x, y) =>
            (y.price ?? Number.NEGATIVE_INFINITY) -
            (x.price ?? Number.NEGATIVE_INFINITY)
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
              <RoomCard 
                key={`${it.type}-${it.id}`} 
                rentPostId={it.id}
                category={it.category as any || it.type as any}
                title={it.title}
                cover={it.images[0] || "/home/room1.png"}
                photoCount={it.photoCount}
                area={it.area}
                bedrooms={it.bedrooms || 0}
                bathrooms={it.bathrooms || 0}
                district={it.location.split(',')[0]?.trim() || ''}
                city={it.location.split(',')[1]?.trim() || ''}
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
