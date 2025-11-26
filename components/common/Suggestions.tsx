"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { searchPosts } from "../../services/posts";
import { getRoomById } from "../../services/rooms";
import { searchPostToUnified, shuffleArray } from "@/types/MixedPosts";
import PostCard from "@/components/common/PostCard";
import { FaHome } from "react-icons/fa";
import { getMyProfile, UserProfile } from "@/services/userProfiles";
import { rankPosts, PostRankingOptions } from "../../services/postRanking";
import { checkMultiplePostsVisibility } from "@/utils/roomVisibility";

export default function Suggestions() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState<string>(
    typeof window !== 'undefined' ? (localStorage.getItem('selectedCity') || '') : ''
  );


  // Load suggestions: gọi danh sách posts, lấy room khi cần, mix và render PostCard (giới hạn 12)
  useEffect(() => {
    const loadMixedPosts = async () => {
      try {
        setLoading(true);
        // Load profile (nếu đã đăng nhập và KHÔNG phải landlord)
        let pf: UserProfile | null = null;
        try {
          const token = localStorage.getItem("token");
          // Chỉ gọi khi user đã sẵn sàng và không phải landlord
          if (token && user && (user as any)?.role !== 'landlord') {
            pf = (await getMyProfile()) as any;
            setProfile(pf);
          }
        } catch {}

        const response = await searchPosts({ status: 'active' as any });
        const allPosts = Array.isArray(response)
          ? response
          : Array.isArray(response?.posts)
          ? response.posts
          : [];

        // Bảo đảm chỉ lấy bài active nếu BE không áp dụng filter
        const onlyActive = allPosts.filter((p: any) => (p?.status || '').toLowerCase() === 'active');

        // Fetch room data for all posts first
        const roomDataMap: Record<string, any> = {};
        await Promise.all(
          onlyActive
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
        const visibilityResults = checkMultiplePostsVisibility(onlyActive, roomDataMap);
        const visiblePosts = visibilityResults
          .filter(result => result.shouldShow)
          .map(result => result.post);

        // Convert to unified format (KHÔNG shuffle - để rank đúng)
        const unified = await Promise.all(
          visiblePosts.map(async (post: any) => {
            const roomData = roomDataMap[post.roomId] || null;
            return searchPostToUnified(post, roomData);
          })
        );

        // Sử dụng service ranking với strict city filter
        const selectedCityLS = selectedCity || ((typeof window !== 'undefined') ? localStorage.getItem('selectedCity') || '' : '');
        const userCity = (user as any)?.address?.city || (user as any)?.city || '';
        
        const rankingOptions: PostRankingOptions = {
          userCity,
          profileCity: pf?.preferredCity,
          selectedCity: selectedCityLS,
          strictCityFilter: true // Suggestions: loại bỏ bài không cùng thành phố
        };
        
        // Rank tất cả posts trước
        const { ranked } = rankPosts(unified, pf, rankingOptions);
        // Sau đó mới slice để lấy top 12 posts được rank cao nhất
        const finalItems = ranked.slice(0, 12);

        setItems(finalItems);
      } catch (error) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadMixedPosts();
  }, [selectedCity, user?.userId]);

  // Lắng nghe thay đổi selectedCity từ nơi khác trong app (dropdown)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'selectedCity') setSelectedCity(e.newValue || '');
    };
    const onCityChanged = (e: any) => {
      const val = e?.detail?.selectedCity;
      if (typeof val === 'string') setSelectedCity(val);
      else if (typeof window !== 'undefined') setSelectedCity(localStorage.getItem('selectedCity') || '');
    };
    let handleAppCityChanged: any;
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
      window.addEventListener('city:changed', onCityChanged as any);
      // Backward-compat: header/AreaDropdown currently dispatch 'app:cityChanged' with { city }
      handleAppCityChanged = (ev: any) => {
        const city = ev?.detail?.city;
        if (typeof city === 'string') {
          setSelectedCity(city);
        }
      };
      window.addEventListener('app:cityChanged', handleAppCityChanged);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('city:changed', onCityChanged as any);
        if (handleAppCityChanged) {
          window.removeEventListener('app:cityChanged', handleAppCityChanged);
        }
      }
    };
  }, []);

  const scrollContainer = (direction: "left" | "right") => {
    const container = document.getElementById("suggestions-scroll");
    if (container) {
      const scrollAmount = 320; // width of one card + gap
      if (direction === "left") {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  };

  return (
    <section className="py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-3">
          <h3 className="text-2xl md:text-3xl font-bold text-teal-600">
            Gợi Ý Cho Bạn
          </h3>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">Đang tải gợi ý...</p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHome className="text-gray-400 text-2xl" />
                </div>
                <p className="text-gray-600">Không có gợi ý nào</p>
              </div>
            </div>
          ) : (
            <>
              {/* Cards Container */}
              <div
                id="suggestions-scroll"
                className="flex gap-6 overflow-x-hidden scroll-smooth pb-4 items-stretch"
              >
                {items.map((u: any, index: number) => (
                  <div key={`${u.type}-${u.id}-${index}`} className="flex-shrink-0 w-80">
                    <PostCard
                      rentPostId={u.id}
                      category={u.type as any}
                      title={u.title}
                      cover={u.images?.[0] || "/home/room1.png"}
                      photoCount={u.images?.length || 0}
                      area={u.area}
                      bedrooms={u.bedrooms}
                      bathrooms={u.bathrooms}
                      {...(u.address ? { address: u.address as any } : { city: u.location })}
                      price={u.price}
                      isVerified={u.isVerified}
                    />
                  </div>
                ))}
              </div>

              {/* Chevron Left Button */}
              <button
                onClick={() => scrollContainer("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
              >
                <svg
                  className="w-6 h-6 text-slate-600"
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

              {/* Chevron Right Button */}
              <button
                onClick={() => scrollContainer("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
              >
                <svg
                  className="w-6 h-6 text-slate-600"
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}
