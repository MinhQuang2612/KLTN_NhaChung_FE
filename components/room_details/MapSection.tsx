"use client";

export default function MapSection() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Xem bản đồ
      </h3>
      
      <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden">
        {/* Placeholder cho Google Maps */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <p className="text-gray-600 text-sm">Google Maps sẽ được tích hợp ở đây</p>
            <p className="text-gray-500 text-xs mt-1">268 Đ. Tô Hiến Thành, Phường Diên Hồng, TP. Hồ Chí Minh</p>
          </div>
        </div>
        
        {/* Map Controls */}
        <div className="absolute top-2 right-2 bg-white rounded-lg shadow-md p-2">
          <div className="flex flex-col gap-1">
            <button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50">
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50">
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        Map data ©2025 Google
      </div>
    </div>
  );
}
