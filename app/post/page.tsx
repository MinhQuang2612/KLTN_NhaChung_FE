"use client";

import { useState } from 'react';
import NewPostFlow from '@/components/post/NewPostFlow';
import Footer from '@/components/common/Footer';

export default function PostPage() {
  const [showNewPostFlow, setShowNewPostFlow] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Tạo bài đăng mới</h1>
          <p className="text-xl text-teal-100 mb-8">
            Đăng bài cho thuê phòng trọ hoặc tìm người ở ghép
          </p>
          <button
            onClick={() => setShowNewPostFlow(true)}
            className="px-8 py-3 bg-white text-teal-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Bắt đầu tạo bài đăng
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tại sao chọn chúng tôi?
            </h2>
            <p className="text-lg text-gray-600">
              Hệ thống đăng bài thông minh và dễ sử dụng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cho thuê phòng trọ</h3>
              <p className="text-gray-600">
                Đăng bài cho thuê phòng trọ, chung cư, nhà nguyên căn một cách dễ dàng
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tìm ở ghép</h3>
              <p className="text-gray-600">
                Tìm người ở ghép phù hợp với sở thích và yêu cầu của bạn
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tự động duyệt</h3>
              <p className="text-gray-600">
                Bài đăng được duyệt tự động và hiển thị ngay lập tức
              </p>
            </div>
          </div>
        </div>
      </div>


      <Footer />

      {/* New Post Flow Modal */}
      {showNewPostFlow && (
        <NewPostFlow
          onClose={() => setShowNewPostFlow(false)}
          onSuccess={() => {
            // Không đóng form ở đây, để NotificationModal tự đóng form
            // Optionally show success message or redirect
          }}
        />
      )}
    </div>
  );
}
