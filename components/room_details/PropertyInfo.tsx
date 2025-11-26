"use client";
import { useState, useEffect } from "react";
import { Post } from "../../types/Post";
import { getRoomById } from "../../services/rooms";
import { useFavorites } from "../../contexts/FavoritesContext";
import { getReviewsByTarget } from "../../services/reviews";
import { FaStar } from "react-icons/fa";

interface PropertyInfoProps {
  postData: Post | null;
  postType: 'rent' | 'roommate';
}

export default function PropertyInfo({ postData, postType }: PropertyInfoProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [roomData, setRoomData] = useState<any>(null);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);
  const { isFavorited, toggleFavorite } = useFavorites();
  
  // Fetch room data when postData changes
  useEffect(() => {
    const fetchRoomData = async () => {
      if (postData?.roomId) {
        try {
          const room = await getRoomById(postData.roomId);
          setRoomData(room);
        } catch (error) {
        }
      }
    };
    
    fetchRoomData();
  }, [postData]);

  // Fetch rating for this post
  useEffect(() => {
    const fetchRating = async () => {
      if (postData?.postId) {
        try {
          const data = await getReviewsByTarget({
            targetType: 'POST',
            targetId: postData.postId,
            page: 1,
            pageSize: 1
          });
          if (data.ratingSummary && data.ratingSummary.ratingCount > 0) {
            setRating({
              avg: data.ratingSummary.ratingAvg,
              count: data.ratingSummary.ratingCount
            });
          }
        } catch (error) {
          // Silently fail
        }
      }
    };

    fetchRating();
  }, [postData?.postId]);
  
  // Helper nhận diện URL video đơn giản
  const isVideoUrl = (url: string) => {
    const lower = (url || "").toLowerCase();
    return (
      lower.endsWith(".mp4") ||
      lower.endsWith(".webm") ||
      lower.endsWith(".ogg") ||
      lower.includes("/video/")
    );
  };

  // Gom media (ảnh + video). Ưu tiên roomData, fallback postData, cuối cùng ảnh mặc định
  const roomImages: string[] = Array.isArray(roomData?.images) ? roomData.images : [];
  const roomVideos: string[] = Array.isArray(roomData?.videos) ? roomData.videos : [];
  const postImages: string[] = Array.isArray(postData?.images) ? (postData?.images as any) : [];
  const postVideos: string[] = Array.isArray((postData as any)?.videos) ? ((postData as any).videos as any) : [];
  const media: string[] =
    (roomImages.length || roomVideos.length)
      ? [...roomImages, ...roomVideos]
      : ((postImages.length || postVideos.length)
          ? [...postImages, ...postVideos]
          : ["/home/room1.png"]);

  // Get post ID và check favorite status
  const postId = postData?.postId;
  
  
  const isFav = postId ? isFavorited(postType, postId) : false;

  const handleToggleFavorite = () => {
    if (postId) {
      toggleFavorite(postType, postId);
    }
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % media.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + media.length) % media.length);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImage(index);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Media Gallery Section */}
      <div className="space-y-4 mb-6">
        {/* Main Media (ảnh hoặc video) */}
        <div className="relative bg-gray-100 rounded-xl overflow-hidden">
          <div className="w-full h-[420px] md:h-[500px] relative">
            {isVideoUrl(media[currentImage]) ? (
              <video
                src={media[currentImage]}
                className="w-full h-full object-cover bg-black"
                controls
                playsInline
              />
            ) : (
            <img
                src={media[currentImage]}
              alt="Phòng trọ"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Fallback nếu ảnh lỗi
                const target = e.target as HTMLImageElement;
                target.style.objectFit = 'contain';
                target.style.objectPosition = 'center';
              }}
            />
            )}
            {/* Overlay để đảm bảo text đọc được */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </div>
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-center bg-cover scale-110 blur-md opacity-40"
            style={{ backgroundImage: isVideoUrl(media[currentImage]) ? undefined : `url(${media[currentImage]})` }}
            aria-hidden="true"
          />

          {/* Navigation Arrows */}
          <button
            onClick={prevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow transition-colors"
            aria-label="Ảnh trước"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow transition-colors"
            aria-label="Ảnh sau"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Counter bottom-right */}
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {currentImage + 1}/{media.length}
          </div>
        </div>

        {/* Thumbnails (scroll ngang) */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          {media.map((url: string, index: number) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border transition-all ${
                currentImage === index
                  ? 'border-teal-500 ring-2 ring-teal-300'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={`Xem ảnh ${index + 1}`}
            >
              {isVideoUrl(url) ? (
                <div className="w-full h-full bg-black relative">
                  <video src={url} className="w-full h-full object-cover opacity-80" muted />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/70 text-white">
                      ▶
                    </span>
                  </div>
                </div>
              ) : (
                <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
              )}
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
            Loại hình: {roomData?.category === 'chung-cu' ? 'Chung cư cho thuê' : 
                       roomData?.category === 'nha-nguyen-can' ? 'Nhà nguyên căn cho thuê' :
                       roomData?.category === 'phong-tro' ? 'Phòng trọ cho thuê' :
                       postType === 'roommate' ? 'Phòng trọ ở ghép' : 'Phòng trọ cho thuê'}
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
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-2xl font-bold text-red-600">
            {roomData?.price 
              ? `${(roomData.price / 1000000).toFixed(1)} triệu / tháng`
              : 'Chưa có thông tin giá'
            }
          </div>
          <div className="text-lg text-gray-600">
            {roomData?.area 
              ? `${roomData.area} m²`
              : 'Chưa có thông tin diện tích'
            }
          </div>
         </div>
         {rating && (
           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg shadow-sm">
             <FaStar className="w-4 h-4 text-amber-500" />
             <span className="text-base font-bold text-gray-900">
               {rating.avg.toFixed(1)}
             </span>
             <span className="text-xs text-gray-600">
               ({rating.count})
             </span>
           </div>
         )}
       </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>
            {roomData?.address
              ? [
                  roomData.address.specificAddress,
                  roomData.address.street,
                  (roomData.address as any).wardName || roomData.address.ward,
                  roomData.address.city || (roomData.address as any).provinceName,
                ]
                  .filter((v) => !!v && String(v).trim().length > 0)
                  .join(', ')
              : 'Chưa có thông tin địa chỉ'}
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
