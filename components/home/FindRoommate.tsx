"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listRoommatePosts, RoommatePost } from "../../services/roommatePosts";
import { useAuth } from "../../contexts/AuthContext";
  
  export default function FindRoommate(){
    const router = useRouter();
    const { user } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Load roommate posts from API
    useEffect(() => {
      const loadRoommatePosts = async () => {
        try {
          setLoading(true);
          // 1) Thử gọi danh sách với filter postType=roommate
          let response: any = await listRoommatePosts({ status: 'active' });
          let apiData: any[] = Array.isArray((response as any)?.posts)
            ? (response as any).posts
            : Array.isArray(response)
            ? (response as any)
            : [];

          // 2) Nếu rỗng, fallback sang search endpoint
          if (!apiData || apiData.length === 0) {
            try {
              const searchMod = await import("../../services/posts");
              const searchRes = await searchMod.searchPosts({ postType: 'roommate' });
              apiData = Array.isArray((searchRes as any)?.posts)
                ? (searchRes as any).posts
                : Array.isArray(searchRes)
                ? (searchRes as any)
                : [];
            } catch {}
          }

          // 3) Nếu vẫn rỗng, lấy tất cả và lọc client-side theo 'roommate' hoặc 'tim-o-ghep'
          if (!apiData || apiData.length === 0) {
            try {
              const postsMod = await import("../../services/posts");
              const allRes = await postsMod.getPosts();
              const allList: any[] = Array.isArray((allRes as any)?.posts)
                ? (allRes as any).posts
                : Array.isArray(allRes)
                ? (allRes as any)
                : [];
              apiData = allList.filter((p: any) => {
                const t = (p?.postType || '').toLowerCase();
                return t === 'roommate' || t === 'tim-o-ghep';
              });
            } catch {}
          }
            
          // Transform API data to display format (ưu tiên hiển thị TITLE)
          const transformedPosts = apiData.slice(0, 6).map((post: RoommatePost) => {
            const roommatePostId = (post as any).postId || (post as any).roommatePostId || (post as any).id;
            return {
              id: roommatePostId,
              img: (post as any).images?.[0] || "/home/room.png",
              text: (post as any).title || (post as any).description || ''
            };
          });
          
          setPosts(transformedPosts);
        } catch (error) {
          setPosts([]);
        } finally {
          setLoading(false);
        }
      };

      loadRoommatePosts();
    }, []);

    const scrollContainer = (direction: 'left' | 'right') => {
      const container = document.getElementById('scroll-container');
      if (container) {
        const scrollAmount = 320; // width of one card + gap
        if (direction === 'left') {
          container.scrollLeft -= scrollAmount;
        } else {
          container.scrollLeft += scrollAmount;
        }
      }
    };

    const handleViewDetail = (postId: number) => {
      router.push(`/room_details/roommate-${postId}`);
    };

    // Chỉ hiển thị khi user đã đăng nhập
    if (!user) {
      return null;
    }

    return (
      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl md:text-3xl font-bold text-teal-600 mb-4">
            Nếu bạn cần tìm người chung tổ ấm?
          </h3>
          
          {/* Slider Container */}
          <div className="relative">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm">Đang tải...</p>
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Chưa có bài đăng tìm ở ghép nào</p>
                </div>
              </div>
            ) : (
              <>
                {/* Cards Container */}
                <div 
                  id="scroll-container"
                  className="flex gap-6 overflow-x-hidden scroll-smooth pb-4"
                >
                  {posts.map(p=>(
                    <article 
                      key={p.id} 
                      className="flex-shrink-0 w-80 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewDetail(p.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleViewDetail(p.id); }}
                    >
                      <div className="flex gap-4">
                        <img src={p.img} alt="" className="w-28 h-28 object-cover rounded-xl"/>
                        <div className="flex flex-col flex-1">
                          <h4 className="text-base md:text-lg font-bold text-gray-900 leading-snug line-clamp-2 mb-1">{p.text}</h4>
                          <span className="text-xs text-slate-500">Bấm để xem chi tiết</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                
                {/* Chevron Left Button */}
                <button 
                  onClick={() => scrollContainer('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
                >
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Chevron Right Button */}
                <button 
                  onClick={() => scrollContainer('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
                >
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    )
  }
  