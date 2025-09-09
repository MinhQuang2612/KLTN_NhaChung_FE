"use client";
import { useState, useEffect } from "react";
import { RentPostApi } from "../../types/RentPostApi";
import { RoommatePost } from "../../services/roommatePosts";
import { useFavorites } from "../../contexts/FavoritesContext";

interface PropertyInfoProps {
  postData: RentPostApi | RoommatePost | null;
  postType: 'rent' | 'roommate';
}

export default function PropertyInfo({ postData, postType }: PropertyInfoProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const { isFavorited, toggleFavorite } = useFavorites();
  
  // Extract images từ postData
  const images = postData?.images && postData.images.length > 0 
    ? postData.images 
    : ["/home/room1.png"]; // fallback

  // Get post ID và check favorite status
  const postId = postType === 'rent' 
    ? (postData as RentPostApi)?.rentPostId 
    : (postData as any)?.roommatePostId || (postData as any)?.postId;
  
  
  const isFav = postId ? isFavorited(postType, postId) : false;

  const handleToggleFavorite = () => {
    if (postId) {
      toggleFavorite(postType, postId);
    }
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImage(index);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Image Gallery Section */}
      <div className="space-y-4 mb-6">
        {/* Main Image */}
        <div className="relative">
          <img
            src={images[currentImage]}
            alt="Phòng trọ"
            className="w-full h-96 object-cover rounded-lg"
            onLoad={() => console.log('Main image loaded:', images[currentImage])}
            onError={(e) => console.log('Main image error:', images[currentImage], e)}
          />
          
          {/* Navigation Arrows */}
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`flex-1 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                currentImage === index ? 'border-teal-500' : 'border-gray-200'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Property Information Section */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {postData?.title || 'Chưa có tiêu đề'}
          </h1>
          <p className="text-gray-600 mb-2">
            Loại hình: {postType === 'roommate' ? 'Phòng trọ ở ghép' : 'Phòng trọ cho thuê'}
          </p>
        </div>
        
        <button
          onClick={handleToggleFavorite}
          className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={isFav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        >
          <svg 
            className={`w-8 h-8 transition-colors ${isFav ? 'text-red-500 fill-current' : 'text-gray-400 hover:text-red-400'}`} 
            fill={isFav ? "currentColor" : "none"}
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-red-600">
            {postType === 'rent' && postData && 'basicInfo' in postData 
              ? `${(postData.basicInfo.price / 1000000).toFixed(1)} triệu / tháng`
              : postType === 'roommate' && postData && 'currentRoom' in postData
              ? `${((postData as any).currentRoom.price / 1000000).toFixed(1)} triệu / tháng`
              : 'Chưa có thông tin giá'
            }
          </div>
          <div className="text-lg text-gray-600">
            {postType === 'rent' && postData && 'basicInfo' in postData 
              ? `${postData.basicInfo.area} m²`
              : postType === 'roommate' && postData && 'currentRoom' in postData
              ? `${(postData as any).currentRoom.area} m²`
              : 'Chưa có thông tin diện tích'
            }
          </div>
         </div>
       </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>
            {postType === 'rent' && postData && 'address' in postData 
              ? `${postData.address.houseNumber || ''} ${postData.address.street}, ${postData.address.ward}, ${postData.address.district}, ${postData.address.city}`.trim()
              : postType === 'roommate' && postData && 'currentRoom' in postData
              ? (postData as any).currentRoom.address
              : 'Chưa có thông tin địa chỉ'
            }
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Đăng {postData?.createdAt 
              ? new Date(postData.createdAt).toLocaleDateString('vi-VN')
              : 'chưa có thông tin'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
