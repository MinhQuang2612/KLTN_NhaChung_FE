"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listRentPosts } from "../../services/rentPosts";
import { listRoommatePosts } from "../../services/roommatePosts";
import { rentPostToUnified, roommatePostToUnified, shuffleArray, UnifiedPost } from "../../types/MixedPosts";
import { RentPostApi } from "../../types/RentPostApi";
import { RoommatePost } from "../../services/roommatePosts";

type Card = {
  id: number;
  title: string;
  price: string;
  specs: string;
  area: string;
  img: string;
  postType: 'rent' | 'roommate';
};


function CardItem({ c }: { c: Card }) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/room_details/${c.postType}-${c.id}`);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden shadow border border-slate-100 bg-white hover:shadow-lg transition-shadow cursor-pointer hover:scale-105 transition-transform duration-300"
      onClick={handleCardClick}
    >
      <div className="relative">
        <img src={c.img} alt={c.title} className="h-44 w-full object-cover" />
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-gray-900">{c.title}</h4>
        <p className="mt-1 text-sm text-slate-600">{c.specs}</p>
        <p className="text-sm text-slate-600">{c.area}</p>
        <p className="mt-2 font-bold text-teal-600">{c.price}</p>
      </div>
    </div>
  );
}

export default function Suggestions() {
  const [items, setItems] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  // Load both rent and roommate posts from API
  useEffect(() => {
    const loadMixedPosts = async () => {
      try {
        setLoading(true);
        
        // Call both APIs simultaneously like find_share
        const [rentResponse, roommateResponse] = await Promise.allSettled([
          listRentPosts(),
          listRoommatePosts()
        ]);

        const rentPosts: RentPostApi[] = [];
        const roommatePosts: RoommatePost[] = [];

        // Process rent posts response
        if (rentResponse.status === 'fulfilled') {
          const rentData = rentResponse.value;
          const rentRaw = Array.isArray((rentData as any)?.data)
            ? (rentData as any).data
            : Array.isArray(rentData)
            ? (rentData as any)
            : [];
          rentPosts.push(...rentRaw);
        }

        // Process roommate posts response
        if (roommateResponse.status === 'fulfilled') {
          const roommateData = roommateResponse.value;
          const roommateRaw = Array.isArray((roommateData as any)?.data)
            ? (roommateData as any).data
            : Array.isArray(roommateData)
            ? (roommateData as any)
            : [];
          roommatePosts.push(...roommateRaw);
        }

        // Convert to unified format and mix
        const unifiedRentPosts = rentPosts.map(rentPostToUnified);
        const unifiedRoommatePosts = roommatePosts.map(roommatePostToUnified);
        
        // Combine and shuffle like find_share
        const allPosts = [...unifiedRentPosts, ...unifiedRoommatePosts];
        const shuffledPosts = shuffleArray(allPosts);

        // Transform to Card format for display (limit to 8 posts)
        const transformedCards = shuffledPosts.slice(0, 8).map((post: UnifiedPost) => {
          const formatPrice = (price: number) => {
            return new Intl.NumberFormat('vi-VN').format(price / 1000000) + ' triệu / tháng';
          };
          
          return {
            id: post.id,
            title: post.title,
            price: formatPrice(post.price),
            specs: `${post.area}m² • ${post.bedrooms || '01'} PN • ${post.bathrooms || '01'} WC`,
            area: post.location,
            img: post.images?.[0] || "/home/room1.png",
            postType: post.type
          };
        });
        
        setItems(transformedCards);
      } catch (error) {
        console.error('Failed to load mixed posts:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadMixedPosts();
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
                  <span className="text-gray-400 text-2xl">🏠</span>
                </div>
                <p className="text-gray-600">Không có gợi ý nào</p>
              </div>
            </div>
          ) : (
            <>
              {/* Cards Container */}
              <div
                id="suggestions-scroll"
                className="flex gap-6 overflow-x-hidden scroll-smooth pb-4"
              >
                {items.map((i) => (
                  <div key={i.id} className="flex-shrink-0 w-80">
                    <CardItem c={i} />
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
