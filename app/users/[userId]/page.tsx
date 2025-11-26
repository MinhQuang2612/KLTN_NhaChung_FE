"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getUserById } from "@/services/user";
import { getPosts } from "@/services/posts";
import { getReviewsByTarget } from "@/services/reviews";
import { User } from "@/types/User";
import Footer from "@/components/common/Footer";
import Link from "next/link";
import { FaEnvelope, FaPhone, FaClock, FaFileAlt, FaCheckCircle, FaArrowLeft, FaStar, FaHome, FaUser, FaMapMarkerAlt } from "react-icons/fa";

export default function UserPublicProfilePage() {
  const params = useParams();
  const userId = params?.userId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postRatings, setPostRatings] = useState<Record<number, { avg: number; count: number }>>({});
  const [userRating, setUserRating] = useState<{ avg: number; count: number } | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9;
  const totalPages = Math.ceil(userPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = userPosts.slice(startIndex, endIndex);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const [userData, postsResponse, userReviewsResponse] = await Promise.allSettled([
          getUserById(Number(userId)),
          getPosts({ userId: Number(userId) }),
          getReviewsByTarget({ targetType: 'USER', targetId: Number(userId), page: 1, pageSize: 1 })
        ]);

        if (userData.status === 'fulfilled') {
          setUser(userData.value);
        } else {
          throw new Error('Không thể tải thông tin người dùng');
        }

        // Set user rating
        if (userReviewsResponse.status === 'fulfilled' && userReviewsResponse.value.ratingSummary) {
          const summary = userReviewsResponse.value.ratingSummary;
          if (summary.ratingCount > 0) {
            setUserRating({
              avg: summary.ratingAvg,
              count: summary.ratingCount
            });
          }
        }

        if (postsResponse.status === 'fulfilled') {
          const posts = postsResponse.value;
          let postsList: any[] = [];
          if (posts && typeof posts === 'object' && 'posts' in posts) {
            postsList = Array.isArray(posts.posts) ? posts.posts : [];
          } else if (Array.isArray(posts)) {
            postsList = posts;
          }
          setUserPosts(postsList);

          // Fetch ratings cho tất cả posts
          const ratingsPromises = postsList.map(async (post) => {
            try {
              const reviewsData = await getReviewsByTarget({
                targetType: 'POST',
                targetId: post.postId,
                page: 1,
                pageSize: 1 // Chỉ cần lấy summary, không cần content
              });
              return {
                postId: post.postId,
                rating: reviewsData.ratingSummary || null
              };
            } catch {
              return { postId: post.postId, rating: null };
            }
          });

          const ratingsResults = await Promise.all(ratingsPromises);
          const ratingsMap: Record<number, { avg: number; count: number }> = {};
          ratingsResults.forEach(({ postId, rating }) => {
            if (rating && rating.ratingCount > 0) {
              ratingsMap[postId] = {
                avg: rating.ratingAvg,
                count: rating.ratingCount
              };
            }
          });
          setPostRatings(ratingsMap);
        }
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy người dùng</h1>
          <p className="text-gray-600 mb-4">{error || 'Người dùng này không tồn tại'}</p>
          <Link href="/" className="text-teal-600 hover:text-teal-700 font-medium">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const joinDate = user.createdAt ? new Date(user.createdAt) : null;
  const diffDays = joinDate ? Math.ceil((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const diffYears = Math.floor(diffDays / 365);
  const diffMonths = Math.floor(diffDays / 30);
  
  const joinedText = diffYears > 0 ? `${diffYears} năm` : 
                     diffMonths > 0 ? `${diffMonths} tháng` : 
                     `${diffDays} ngày`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </Link>

        {/* Profile Card - Gộp tất cả vào 1 card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header với thông tin chính */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-8 py-6 relative">
            {/* User Rating - Góc trên phải */}
            {userRating && (
              <div className="absolute top-6 right-8 flex items-center gap-1.5 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg">
                <FaStar className="w-5 h-5 text-amber-400" />
                <span className="text-gray-900 font-bold text-lg">
                  {userRating.avg.toFixed(1)}
                </span>
                <span className="text-gray-600 text-sm">
                  ({userRating.count})
                </span>
              </div>
            )}

            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <img
                  src={user.avatar || '/home/avt1.png'}
                  alt={user.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = '/home/avt1.png';
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                  {user.isVerified && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full">
                      <FaCheckCircle className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-medium">Đã xác thực</span>
                    </div>
                  )}
                </div>
                
                <p className="text-white/90 text-lg mb-4 flex items-center gap-2">
                  {user.role === 'landlord' ? (
                    <>
                      <FaHome className="text-white" />
                      Chủ nhà
                    </>
                  ) : (
                    <>
                      <FaUser className="text-white" />
                      Người dùng
                    </>
                  )}
                </p>

                <div className="flex flex-wrap gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <FaClock className="w-4 h-4" />
                    <span className="text-sm">Tham gia {joinedText} trước</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaFileAlt className="w-4 h-4" />
                    <span className="text-sm">{userPosts.length} bài đăng</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin liên hệ</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {user.email && (
                <div className="flex items-center gap-3 text-gray-700">
                  <FaEnvelope className="w-5 h-5 text-teal-600" />
                  <a href={`mailto:${user.email}`} className="hover:text-teal-600 transition-colors">
                    {user.email}
                  </a>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <FaPhone className="w-5 h-5 text-teal-600" />
                  <a href={`tel:${user.phone}`} className="hover:text-teal-600 transition-colors">
                    {user.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Posts Section */}
          <div className="px-8 py-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Bài đăng của {user.name} ({userPosts.length})
            </h2>

            {userPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <p className="text-gray-600">Chưa có bài đăng nào</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {currentPosts.map((post) => {
                    const rating = postRatings[post.postId];
                    return (
                      <Link
                        key={post.postId}
                        href={`/room_details/${post.postId}`}
                        className="block bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-teal-300 transition-all"
                      >
                        <div className="relative">
                          <img
                            src={post.images?.[0] || '/home/room1.png'}
                            alt={post.title}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = '/home/room1.png';
                            }}
                          />
                          {/* Rating Badge */}
                          {rating && (
                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                              <FaStar className="w-4 h-4 text-amber-400" />
                              <span className="font-bold text-gray-900">
                                {rating.avg.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({rating.count})
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {post.title}
                          </h3>
                          {post.price && (
                            <p className="text-teal-600 font-bold text-lg">
                              {post.price.toLocaleString('vi-VN')} VNĐ/tháng
                            </p>
                          )}
                          {post.address && (
                            <p className="text-gray-600 text-sm mt-2 line-clamp-1 flex items-center gap-2">
                              <FaMapMarkerAlt className="text-gray-500" />
                              {post.address}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← 
                    </button>

                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Hiển thị: first page, last page, current page và 2 trang xung quanh
                        const showPage = 
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1);

                        const showEllipsis = 
                          (page === currentPage - 2 && currentPage > 3) ||
                          (page === currentPage + 2 && currentPage < totalPages - 2);

                        if (showEllipsis) {
                          return <span key={page} className="px-4 py-2 text-gray-400">...</span>;
                        }

                        if (!showPage) return null;

                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-teal-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                       →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

