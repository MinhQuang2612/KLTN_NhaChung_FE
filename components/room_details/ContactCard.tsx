"use client";

import { useState, useEffect } from "react";
import { getUserById } from "../../services/user";
import { getUserRentPosts } from "../../services/rentPosts";
import { listRoommatePosts } from "../../services/roommatePosts";
import { User } from "../../types/User";

interface ContactCardProps {
  postData: any;
  postType: 'rent' | 'roommate';
}

export default function ContactCard({ postData, postType }: ContactCardProps) {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<{ postsCount: number; joinedDate: string | null }>({ postsCount: 0, joinedDate: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!postData?.userId) {
        return;
      }
      
      try {
        // Fetch user info and user statistics in parallel
        const [user, rentPosts, roommatePosts] = await Promise.allSettled([
          getUserById(postData.userId),
          getUserRentPosts(postData.userId),
          listRoommatePosts({ userId: postData.userId })
        ]);

        // Set user info
        if (user.status === 'fulfilled') {
          setUserInfo(user.value);
        } else {
          throw new Error('User not found');
        }

        // Calculate total posts count
        let totalPosts = 0;
        if (rentPosts.status === 'fulfilled') {
          const rentData = rentPosts.value;
          const rentCount = Array.isArray((rentData as any)?.data) ? (rentData as any).data.length : 
                           Array.isArray(rentData) ? rentData.length : 0;
          totalPosts += rentCount;
        }
        if (roommatePosts.status === 'fulfilled') {
          const roommateData = roommatePosts.value;
          const roommateCount = Array.isArray((roommateData as any)?.data) ? (roommateData as any).data.length : 
                               Array.isArray(roommateData) ? roommateData.length : 0;
          totalPosts += roommateCount;
        }

        setUserStats({
          postsCount: totalPosts,
          joinedDate: user.status === 'fulfilled' ? (user.value.createdAt || null) : null
        });

      } catch (error) {
        setUserStats({ postsCount: 0, joinedDate: null });
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [postData?.userId]);
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
          <h3 className="text-lg font-semibold text-gray-900">{userInfo?.name || "Người dùng"}</h3>
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

      <div className="space-y-3">
        <button className="w-full px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors">
          {userInfo?.phone ? 
            userInfo.phone.substring(0, 4) + '****' : 
            '0789****'
          }
        </button>
        <button className="w-full px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors">
          Chat Với Người {postType === 'roommate' ? 'Tìm Ghép' : 'Bán'}
        </button>
      </div>
    </div>
  );
}
