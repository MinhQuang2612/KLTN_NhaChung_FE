"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NewPostFlow from '@/components/post/NewPostFlow';
import Footer from '@/components/common/Footer';
import { FaHome, FaUsers, FaBolt } from 'react-icons/fa';

export default function PostPage() {
  const { user, isLoading } = useAuth();
  const [showNewPostFlow, setShowNewPostFlow] = useState(false);

  // Hiển thị loading khi đang kiểm tra auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Kiểm tra role - chặn người thuê
  if (user && user.role !== 'landlord') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Không thể thực thi chức năng này
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Bạn không thể đăng tin thủ công. Hệ thống sẽ tự động tạo bài đăng khi bạn muốn tìm người ở ghép.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Nếu bạn là chủ nhà và muốn đăng tin, vui lòng đăng nhập bằng tài khoản chủ nhà.
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="/"
                  className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Về trang chủ
                </a>
                <a
                  href="/find_share"
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Đăng ký thuê
                </a>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Chỉ hiển thị form đăng tin cho landlord
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
            onClick={() => {
              if (user?.role === 'landlord') {
                setShowNewPostFlow(true);
              }
            }}
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
                <FaHome className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cho thuê phòng trọ</h3>
              <p className="text-gray-600">
                Đăng bài cho thuê phòng trọ, chung cư, nhà nguyên căn một cách dễ dàng
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-2xl text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tìm ở ghép</h3>
              <p className="text-gray-600">
                Tìm người ở ghép phù hợp với sở thích và yêu cầu của bạn
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBolt className="text-2xl text-purple-600" />
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

      {/* New Post Flow Modal - chỉ hiển thị cho landlord */}
      {showNewPostFlow && user?.role === 'landlord' && (
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
