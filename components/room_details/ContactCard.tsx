"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getPosts } from "../../services/posts";
import { getUserById } from "../../services/user";
import { getReviewsByTarget } from "../../services/reviews";
import { createOrGetConversation } from "../../services/chat";
import { User } from "../../types/User";
import { Post } from "../../types/Post";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useChat } from "../../contexts/ChatContext";
import Link from "next/link";
import { FaStar, FaComments } from "react-icons/fa";
import { extractApiErrorMessage } from "../../utils/api";

// Extended Post type với các thuộc tính bổ sung từ API
interface ExtendedPost extends Post {
  userName?: string;
  userAvatar?: string;
  userCreatedAt?: string;
  id?: number; // Alias cho postId
}

interface ContactCardProps {
  postData: ExtendedPost;
  postType: 'rent' | 'roommate';
}

export default function ContactCard({ postData, postType }: ContactCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const { openModalWithConversation } = useChat();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<{ postsCount: number; joinedDate: string | null }>({ postsCount: 0, joinedDate: null });
  const [userRating, setUserRating] = useState<{ avg: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingConversation, setCreatingConversation] = useState(false);

  // Check if user is viewing their own post or if user is landlord
  const shouldHideButtons = user?.role === 'landlord' || user?.userId === postData?.userId;

  const refreshUserStats = useCallback(async () => {
    if (!postData?.userId) return;
    
    try {
      const userPostsResponse = await getPosts({ userId: postData.userId });
      let totalPosts = 0;
      
      if (userPostsResponse && typeof userPostsResponse === 'object' && 'posts' in userPostsResponse) {
        totalPosts = Array.isArray(userPostsResponse.posts) ? userPostsResponse.posts.length : 0;
      } else if (Array.isArray(userPostsResponse)) {
        totalPosts = (userPostsResponse as any[]).length;
      }

      setUserStats(prev => ({
        ...prev,
        postsCount: totalPosts
      }));
    } catch (error) {
      // Silently fail
    }
  }, [postData?.userId]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!postData?.userId) {
        return;
      }
      
      try {
        // Fetch user info, user statistics, and rating in parallel
        const [user, userPosts, userReviews] = await Promise.allSettled([
          getUserById(postData.userId),
          getPosts({ userId: postData.userId }),
          getReviewsByTarget({ targetType: 'USER', targetId: postData.userId, page: 1, pageSize: 1 })
        ]);

        // Set user info
        if (user.status === 'fulfilled') {
          setUserInfo(user.value);
        } else {
          // Fallback to postData if API fails
          const userInfoFromPost: User = {
            userId: postData.userId,
            name: postData.userName || 'Người dùng',
            email: postData.email || '',
            phone: postData.phone || '',
            avatar: postData.userAvatar || undefined,
            createdAt: postData.userCreatedAt || undefined,
          };
          setUserInfo(userInfoFromPost);
        }

        // Calculate total posts count
        let totalPosts = 0;
        if (userPosts.status === 'fulfilled') {
          const postsData = userPosts.value;
          if (postsData && typeof postsData === 'object' && 'posts' in postsData) {
            totalPosts = Array.isArray(postsData.posts) ? postsData.posts.length : 0;
          } else if (Array.isArray(postsData)) {
            totalPosts = (postsData as any[]).length;
          }
        }

        setUserStats({
          postsCount: totalPosts,
          joinedDate: user.status === 'fulfilled' ? (user.value.createdAt || null) : (postData.userCreatedAt || null)
        });

        // Set user rating
        if (userReviews.status === 'fulfilled' && userReviews.value.ratingSummary) {
          const summary = userReviews.value.ratingSummary;
          if (summary.ratingCount > 0) {
            setUserRating({
              avg: summary.ratingAvg,
              count: summary.ratingCount
            });
          }
        }

      } catch (error) {
        setUserStats({ postsCount: 0, joinedDate: null });
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();

    // Refresh stats when window gains focus (user might have created a new post in another tab)
    const handleFocus = () => {
      refreshUserStats();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [postData?.userId, refreshUserStats]);

  const handleContactClick = async () => {
    if (!user || !postData?.userId) {
      router.push('/login');
      return;
    }

    try {
      setCreatingConversation(true);
      const currentUserId = Number((user as any).userId ?? (user as any).id);
      const landlordId = postData.userId;
      const currentPostId = postData.postId || (postData as ExtendedPost).id;

      // Determine tenant and landlord
      // If current user is the landlord, they can't contact themselves
      if (currentUserId === landlordId) {
        showError('Lỗi', 'Bạn không thể liên hệ với chính mình');
        return;
      }

      // Create or get conversation
      // Backend sẽ tự động tạo system message nếu chưa có tin nhắn về postId này
      const conversation = await createOrGetConversation({
        tenantId: currentUserId,
        landlordId: landlordId,
        postId: currentPostId,
        roomId: postData.roomId,
      });

      // Kiểm tra conversation có đúng không
      if (conversation.tenantId !== currentUserId && conversation.landlordId !== currentUserId) {
        showError('Lỗi', 'Conversation được tạo nhưng bạn không có quyền truy cập');
        return;
      }

      // Mở modal chat với conversation này
      // Backend đã tự động tạo systemMessage nếu cần, không cần frontend gửi nữa
      openModalWithConversation(conversation);
      showSuccess('Thành công', 'Đã mở cuộc trò chuyện');
    } catch (error: any) {
      showError('Lỗi', extractApiErrorMessage(error) || 'Không thể tạo cuộc trò chuyện');
    } finally {
      setCreatingConversation(false);
    }
  };
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 relative">
      {/* User Rating Badge - Góc trên phải */}
      {userRating && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg shadow-sm">
          <FaStar className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-gray-900">
            {userRating.avg.toFixed(1)}
          </span>
          <span className="text-xs text-gray-600">
            ({userRating.count})
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full overflow-hidden">
          <img 
            src={userInfo?.avatar || "/home/avt1.png"} 
            alt={userInfo?.name || "User"}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
          <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center" style={{display: 'none'}}>
            <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div>
          <Link 
            href={`/users/${postData?.userId}`}
            className="text-lg font-semibold text-gray-900 hover:text-teal-600 transition-colors inline-flex items-center gap-2 group"
          >
            {userInfo?.name || "Người dùng"}
            <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="text-sm text-gray-600">
            {postType === 'roommate' ? 'Tìm bạn ở ghép' : 'Là Người cho thuê'}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span>
            Đã đăng {userStats.postsCount > 0 ? 
              userStats.postsCount >= 10 ? '10+' : userStats.postsCount : 
              '0'} tin
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span>
            Tham gia {userStats.joinedDate ? 
              (() => {
                const joinDate = new Date(userStats.joinedDate);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - joinDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffYears = Math.floor(diffDays / 365);
                const diffMonths = Math.floor(diffDays / 30);
                
                if (diffYears > 0) {
                  return `trên ${diffYears} năm`;
                } else if (diffMonths > 0) {
                  return `${diffMonths} tháng`;
                } else {
                  return `${diffDays} ngày`;
                }
              })() : 
              'trên 3 năm'
            }
          </span>
        </div>
      </div>

      {!shouldHideButtons && (
        <div className="space-y-3">
          <button className="w-full px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors">
            {userInfo?.phone ? 
              userInfo.phone.substring(0, 4) + '****' : 
              '0789****'
            }
          </button>
          <button 
            onClick={handleContactClick}
            disabled={creatingConversation || !user}
            className="w-full px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FaComments className="w-4 h-4" />
            {creatingConversation ? 'Đang tải...' : `Chat Với Người ${postType === 'roommate' ? 'Tìm Ghép' : 'Bán'}`}
          </button>
        </div>
      )}
    </div>
  );
}
