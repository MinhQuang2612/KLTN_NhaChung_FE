"use client";

import { useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";

interface MapSectionProps {
  postData: any;
  postType: 'rent' | 'roommate';
}

export default function MapSection({ postData, postType }: MapSectionProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Helper function to get address string for Google Maps
  const getMapAddress = () => {
    if (postType === 'rent' && postData?.address) {
      const addr = postData.address;
      return `${addr.specificAddress || ''} ${addr.street}, ${addr.ward}, ${addr.city}`.trim();
    } else if (postType === 'roommate' && postData?.currentRoom?.address) {
      const addr = postData.currentRoom.address;
      return typeof addr === 'string' 
        ? addr 
        : `${addr.specificAddress ? addr.specificAddress + ', ' : ''}${addr.street}, ${addr.ward}, ${addr.city}`.replace(/^,\s*/, '');
    }
    return 'Chưa có thông tin địa chỉ';
  };
  
  const address = getMapAddress();
  const encodedAddress = encodeURIComponent(address);
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Xem bản đồ
      </h3>
      
      <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden">
        {/* Loading placeholder */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Đang tải bản đồ...</p>
              <p className="text-gray-500 text-xs mt-1">{address}</p>
            </div>
          </div>
        )}
        
        {/* Google Maps Embed - Using search URL without API key */}
        <iframe
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${encodedAddress}&output=embed`}
          onLoad={() => setMapLoaded(true)}
          onError={() => setMapLoaded(true)}
        />
        
        {/* Address overlay */}
        {mapLoaded && (
          <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded-lg px-3 py-2 shadow-md max-w-xs">
            <p className="text-xs text-gray-700 font-medium flex items-center gap-1">
              <FaMapMarkerAlt className="text-teal-600" />
              {address}
            </p>
          </div>
        )}
        
        {/* Open in Google Maps button */}
        <div className="absolute bottom-2 right-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white bg-opacity-90 hover:bg-opacity-100 px-3 py-2 rounded-lg shadow-md transition-all duration-200 text-xs font-medium text-gray-700 hover:text-teal-600 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Mở trong Google Maps
          </a>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        Map data ©2025 Google
      </div>
    </div>
  );
}
