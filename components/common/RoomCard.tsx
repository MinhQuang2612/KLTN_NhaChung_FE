"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RoomCardData } from "@/types/RentPostApi";
import { useFavorites } from "../../contexts/FavoritesContext";
import { formatPrice } from "@/utils/format";
import { addressService } from "../../services/address";

export default function RoomCard({
  rentPostId,
  category,
  title,
  cover,
  photoCount,
  area,
  bedrooms,
  bathrooms,
  address,
  city,
  price,
  isVerified,
}: RoomCardData) {
  const router = useRouter();
  const { isFavorited, toggleFavorite } = useFavorites();
  
  // Check if this post is favorited  
  const postType = category === 'roommate' ? 'roommate' : 'rent';
  const isFav = isFavorited(postType, rentPostId);

  const goDetail = () => {
    const postType = category === 'roommate' ? 'roommate' : 'rent';
    router.push(`/room_details/${postType}-${rentPostId}`);
  };

  return (
    <div
      className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-teal-300 hover:-translate-y-1 cursor-pointer"
      onClick={goDetail}
      role="button"
      aria-label={title}
    >
      {/* Ảnh bìa */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={title}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
        )}


        {/* Verified */}
        {isVerified && (
          <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md group-hover:bg-teal-600 transition-colors duration-300">
            Đã Xác Thực
          </div>
        )}

        {/* Fav / Share */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              // Determine post type based on category
              const postType = category === 'roommate' ? 'roommate' : 'rent';
              await toggleFavorite(postType, rentPostId);
            }}
            className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
              isFav
                ? "bg-red-500 text-white shadow-lg"
                : "bg-white/95 text-gray-600 hover:bg-white hover:shadow-lg"
            }`}
            aria-label={isFav ? "Bỏ yêu thích" : "Yêu thích"}
          >
            <svg
              className="w-4 h-4"
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
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-full bg-white/95 text-gray-600 hover:bg-white hover:shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Chia sẻ"
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
          </button>
        </div>

        {/* Tổng số ảnh */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 group-hover:bg-teal-600 transition-colors duration-300">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
          {photoCount}
        </div>
      </div>

      {/* Nội dung */}
      <div className="p-4 group-hover:bg-gradient-to-br group-hover:from-gray-50 group-hover:to-white transition-all duration-300">
        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-teal-700 transition-colors duration-300">
          {title}
        </h3>

        {/* Diện tích - PN - WC */}
        <div className="text-gray-700 text-sm mb-2 group-hover:text-gray-800 transition-colors duration-300">
          {[
            area != null ? `${area} m²` : null,
            bedrooms != null ? `${bedrooms} phòng ngủ` : null,
            bathrooms != null ? `${bathrooms} phòng tắm` : null,
          ]
            .filter(Boolean)
            .join(" • ")}
        </div>

        {/* Vị trí */}
        <div className="text-gray-600 text-sm mb-2 flex items-center gap-1 group-hover:text-gray-700 transition-colors duration-300">
          <svg
            className="w-4 h-4 text-teal-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          {address
            ? addressService.formatWardCity(address)
            : (city || "")}
        </div>

        {/* Giá */}
        <div className="font-bold text-lg text-teal-600 group-hover:text-teal-700 group-hover:scale-105 transition-all duration-300">
          {formatPrice(price)}
        </div>
      </div>
    </div>
  );
}
