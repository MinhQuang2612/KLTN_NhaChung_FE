"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import SearchDetails from "../../../components/common/SearchDetails";
import PropertyInfo from "../../../components/room_details/PropertyInfo";
import PropertyDetails from "../../../components/room_details/PropertyDetails";
import ContactCard from "../../../components/room_details/ContactCard";
import MapSection from "../../../components/room_details/MapSection";
import Suggestions from "../../../components/common/Suggestions";
import Footer from "../../../components/common/Footer";
import { getRentPostById } from "../../../services/rentPosts";
import { getRoommatePostById } from "../../../services/roommatePosts";
import { RentPostApi } from "../../../types/RentPostApi";
import { RoommatePost } from "../../../services/roommatePosts";


type PostType = 'rent' | 'roommate';
type PostData = RentPostApi | RoommatePost;

interface RoomDetailsPageProps {
  params: { id: string };
  searchParams: { type?: PostType };
}

export default function RoomDetailsPage() {
  const params = useParams();
  const [postData, setPostData] = useState<PostData | null>(null);
  const [postType, setPostType] = useState<PostType>('rent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract postType and postId from params
  // URL format: /room_details/rent-123 or /room_details/roommate-456
  // Scroll to top when component mounts or params change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [params.id]);

  useEffect(() => {
    const idParam = params.id as string;
    if (idParam) {
      if (idParam.startsWith('rent-')) {
        setPostType('rent');
      } else if (idParam.startsWith('roommate-')) {
        setPostType('roommate');
      }
    }
  }, [params.id]);

  useEffect(() => {
    const loadPostData = async () => {
      const idParam = params.id as string;
      if (!idParam) return;

      try {
        setLoading(true);
        setError(null);

        let data: PostData;
        
        if (idParam.startsWith('rent-')) {
          const postId = idParam.replace('rent-', '');
          data = await getRentPostById(postId);
        } else if (idParam.startsWith('roommate-')) {
          const postId = idParam.replace('roommate-', '');
          data = await getRoommatePostById(parseInt(postId));
        } else {
          throw new Error('Invalid post type');
        }
        
        setPostData(data);
        // Scroll to top after data loads successfully
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }, 100);
      } catch (err: any) {
        console.error('Failed to load post data:', err);
        setError('Không thể tải thông tin bài đăng');
      } finally {
        setLoading(false);
      }
    };

    loadPostData();
  }, [params.id, postType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error && !postData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchDetails />
      
      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <PropertyInfo postData={postData} postType={postType} />
            <PropertyDetails postData={postData} postType={postType} />
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <ContactCard postData={postData} postType={postType} />
            <MapSection postData={postData} postType={postType} />
          </div>
        </div>
      </div>
      
      {/* Suggestions Section */}
      <Suggestions />
      
      <Footer />
    </div>
  );
}
