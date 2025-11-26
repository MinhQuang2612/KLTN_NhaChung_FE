'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRooms, UserRoom } from '@/services/rooms';
import { getUserRentalRequests } from '@/services/rentalRequests';
import { terminateContract, getRentalHistory } from '@/services/rentalHistory';
import Link from 'next/link';
import { createReview } from '@/services/reviews';
import { useToast } from '@/contexts/ToastContext';
import { extractApiErrorMessage } from '@/utils/api';
import { uploadFiles } from '@/utils/upload';
import RentalHistory from '@/components/rental/RentalHistory';
import TerminateContractModal from '@/components/rental/TerminateContractModal';
import RoomSharingToggle from '@/components/roommate/RoomSharingToggle';
import RoommateRequirementsModal from '@/components/roommate/RoommateRequirementsModal';
import {
  getRoommatePreference,
  updateRoommatePreference,
} from '@/services/roommatePreferences';
import { RoommatePreference } from '@/types/RoommatePreference';
import { Requirements } from '@/types/Post';
import { useRouter } from 'next/navigation';
import { getMyProfile } from '@/services/userProfiles';
import Footer from '@/components/common/Footer';

const MyRoomsPage = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [rooms, setRooms] = useState<UserRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminatingContract, setTerminatingContract] = useState<number | null>(null);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<{ id: number; roomNumber: string } | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [reviews, setReviews] = useState<Record<number, string>>({});
  const [anonymousMap, setAnonymousMap] = useState<Record<number, boolean>>({});
  const [mediaMap, setMediaMap] = useState<Record<number, string[]>>({});
  const [uploaderVersionMap, setUploaderVersionMap] = useState<Record<number, number>>({});
  const [landlordRatings, setLandlordRatings] = useState<Record<number, number>>({});
  const [landlordReviews, setLandlordReviews] = useState<Record<number, string>>({});
  const [landlordAnonymousMap, setLandlordAnonymousMap] = useState<Record<number, boolean>>({});
  const [landlordMediaMap, setLandlordMediaMap] = useState<Record<number, string[]>>({});
  const [landlordUploaderVersionMap, setLandlordUploaderVersionMap] = useState<Record<number, number>>({});
  const [reviewTargetMap, setReviewTargetMap] = useState<Record<number, 'ROOM' | 'USER'>>({});
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  // Roommate preferences state
  const [roommatePreferences, setRoommatePreferences] = useState<Record<number, RoommatePreference>>({});
  const [profile, setProfile] = useState<any>(null); // ⭐ Profile để lấy posterTraits
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!isLoading && user) {
      loadMyRooms();
      loadHistoryCount();
      loadProfile(); // ⭐ Load profile để lấy posterTraits
    }
  }, [user, isLoading]);

  // Load profile để lấy posterTraits
  const loadProfile = async () => {
    try {
      const profileData = await getMyProfile();
      setProfile(profileData);
    } catch (error) {
      // Nếu không có profile, không sao
    }
  };

  // Load roommate preferences for each room
  useEffect(() => {
    if (rooms.length > 0) {
      rooms.forEach((room) => {
        if (room.contractStatus === 'active') {
          loadRoommatePreference(room.roomId);
        }
      });
    }
  }, [rooms]);

  const loadHistoryCount = async () => {
    try {
      // Chỉ gọi API để lấy count, không cần lấy data
      const response = await getRentalHistory({ page: 1, limit: 1 });
      setHistoryCount(response.pagination?.total || 0);
    } catch (error) {
      // Nếu lỗi thì set 0, không show error
      setHistoryCount(0);
    }
  };

  const loadMyRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Thử cả 2 API để lấy tất cả phòng đã thuê
      const [roomsData, rentalRequestsData] = await Promise.all([
        getUserRooms().catch(err => {
          return [];
        }),
        getUserRentalRequests().catch(err => {
          return [];
        })
      ]);
      
      // TODO: Kết hợp dữ liệu từ cả 2 API khi cần
      setRooms(roomsData);
    } catch (err) {
      setError('Không thể tải danh sách phòng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const loadRoommatePreference = async (roomId: number) => {
    try {
      setLoadingPreferences((prev) => ({ ...prev, [roomId]: true }));
      const preference = await getRoommatePreference(roomId);
      setRoommatePreferences((prev) => ({ ...prev, [roomId]: preference }));
    } catch (error) {
      // Nếu lỗi, set preference mặc định
      setRoommatePreferences((prev) => ({
        ...prev,
        [roomId]: {
          enabled: false,
          postId: null,
          postStatus: null,
          requirements: null,
        },
      }));
    } finally {
      setLoadingPreferences((prev) => ({ ...prev, [roomId]: false }));
    }
  };


  const handleToggleRoommatePreference = async (roomId: number, enabled: boolean) => {
    if (enabled) {
      // Bật toggle → Mở modal cấu hình yêu cầu
      setCurrentRoomId(roomId);
      setShowRequirementsModal(true);
    } else {
      // Tắt toggle → Ẩn bài đăng
      try {
        await updateRoommatePreference(roomId, { enabled: false });
        await loadRoommatePreference(roomId);
        showSuccess('Đã tắt tìm người ở ghép', 'Bài đăng đã được ẩn.');
      } catch (error: any) {
        const message = extractApiErrorMessage(error);
        showError('Không thể tắt tìm người ở ghép', message);
      }
    }
  };

  const handleSaveRequirements = async (requirements: Requirements, posterTraits: string[]) => {
    if (!currentRoomId) return;

    try {
      // ⭐ Gửi cả requirements và posterTraits
      await updateRoommatePreference(currentRoomId, {
        enabled: true,
        requirements,
        posterTraits: posterTraits || [], // ⭐ Traits của Poster (User A)
      });
      await loadRoommatePreference(currentRoomId);
      setShowRequirementsModal(false);
      setCurrentRoomId(null);
      showSuccess('Đã tạo bài đăng tìm ở ghép', 'Bài đăng đang chờ duyệt.');
    } catch (error: any) {
      const message = extractApiErrorMessage(error);
      showError('Không thể tạo bài đăng', message);
    }
  };

  const handleEditRequirements = async (roomId: number) => {
    setCurrentRoomId(roomId);
    setShowRequirementsModal(true);
  };


  const handleTerminateContract = (contractId: number, roomNumber: string) => {
    setSelectedContract({ id: contractId, roomNumber });
    setShowTerminateModal(true);
  };

  const handleConfirmTerminate = async (reason: string) => {
    if (!selectedContract) return;

    try {
      setTerminatingContract(selectedContract.id);
      const response = await terminateContract(
        selectedContract.id, 
        reason.trim() ? { reason: reason.trim() } : undefined
      );
      
      // Message với số lượng posts được active
      const postsMsg = response.affectedPosts?.count 
        ? ` Đã active lại ${response.affectedPosts.count} bài đăng.`
        : '';
      showSuccess('Đã hủy hợp đồng', `Hợp đồng đã được hủy và phòng đã được giải phóng.${postsMsg}`);
      
      // Close modal
      setShowTerminateModal(false);
      setSelectedContract(null);
      
      // Reload rooms
      await loadMyRooms();
      
      // Reload history count
      await loadHistoryCount();
      
      // Chuyển sang tab lịch sử
      setActiveTab('history');
    } catch (error: any) {
      const message = extractApiErrorMessage(error);
      showError('Không thể hủy hợp đồng', message);
    } finally {
      setTerminatingContract(null);
    }
  };

  // Hiển thị loading khi đang xác thực
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Yêu cầu đăng nhập
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h1>
          <Link 
            href="/login" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Phòng của tôi</h1>
          <p className="text-gray-600">Quản lý phòng đang thuê và lịch sử thuê</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'current'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Phòng đang thuê
              {rooms.filter(room => room.contractStatus === 'active').length > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full bg-teal-100 text-teal-600 text-xs font-semibold">
                  {rooms.filter(room => room.contractStatus === 'active').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lịch sử thuê
              {historyCount > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                  {historyCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'history' ? (
          <RentalHistory onCountChange={setHistoryCount} />
        ) : (
          <>
            {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách phòng...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={loadMyRooms}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : rooms.filter(room => room.contractStatus === 'active').length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có phòng nào</h3>
              <p className="text-gray-600 mb-6">Bạn chưa thuê phòng nào. Hãy đăng ký thuê phòng để xuất hiện ở đây.</p>
              <Link 
                href="/find-room"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tìm phòng
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.filter(room => room.contractStatus === 'active').map((room) => (
              <div key={room.roomId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Phòng {room.roomNumber}</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      room.contractStatus === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {room.contractStatus === 'active' ? '🟢 Đang thuê' : '🔴 Hết hạn'}
                    </span>
                  </div>
                  
                  {/* Room Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-medium">Tòa nhà:</span>
                      <span className="ml-1">{room.buildingName}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4a1 1 0 00-1-1H9a1 1 0 00-1 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V8z" />
                      </svg>
                      <span className="font-medium">Diện tích:</span>
                      <span className="ml-1">{room.area}m²</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="font-medium">Tiền thuê:</span>
                      <span className="ml-1 font-semibold text-green-600">{room.monthlyRent.toLocaleString()} VND/tháng</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      <span className="font-medium">Tiền cọc:</span>
                      <span className="ml-1">{room.deposit.toLocaleString()} VND</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      <span className="font-medium">Thời hạn:</span>
                      <span className="ml-1">
                        {new Date(room.startDate).toLocaleDateString()} - {new Date(room.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="font-medium">Số người:</span>
                      <span className="ml-1">{room.currentOccupants}/{room.maxOccupancy}</span>
                    </div>
                  </div>

                  {/* Landlord Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Thông tin chủ trọ</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium w-16">Tên:</span>
                        <span>{room.landlordInfo.name}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium w-16">SĐT:</span>
                        <a href={`tel:${room.landlordInfo.phone}`} className="text-blue-600 hover:text-blue-800">
                          {room.landlordInfo.phone}
                        </a>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium w-16">Email:</span>
                        <a href={`mailto:${room.landlordInfo.email}`} className="text-blue-600 hover:text-blue-800">
                          {room.landlordInfo.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Roommate Sharing Toggle */}
                  {room.contractStatus === 'active' && (
                    <div className="border-t pt-4 mt-4 mb-4">
                      <RoomSharingToggle
                        roomId={room.roomId}
                        enabled={roommatePreferences[room.roomId]?.enabled || false}
                        postStatus={roommatePreferences[room.roomId]?.postStatus || null}
                        postId={roommatePreferences[room.roomId]?.postId || null}
                        onToggle={(enabled) => handleToggleRoommatePreference(room.roomId, enabled)}
                        onEdit={() => handleEditRequirements(room.roomId)}
                        onViewPost={() => {
                          const postId = roommatePreferences[room.roomId]?.postId;
                          if (postId) {
                            router.push(`/room_details/roommate-${postId}`);
                          }
                        }}
                        loading={loadingPreferences[room.roomId] || false}
                      />
                    </div>
                  )}


                  {/* Actions */}
                  <div className="pt-4 space-y-2">
                    <Link 
                      href={`/contracts/${room.contractId}?returnUrl=/my-rooms`}
                      className="w-full bg-teal-600 text-white text-center py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium inline-block"
                    >
                      Xem hợp đồng
                    </Link>
                    
                    {room.contractStatus === 'active' && (
                      <button
                        onClick={() => handleTerminateContract(room.contractId, room.roomNumber)}
                        disabled={terminatingContract === room.contractId}
                        className="w-full bg-red-600 text-white text-center py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {terminatingContract === room.contractId ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Đang xử lý...
                          </span>
                        ) : (
                          'Hủy hợp đồng'
                        )}
                      </button>
                    )}
                  </div>

                  {/* Đánh giá (gộp) */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-semibold text-gray-900">Đánh giá</h4>
                        <select
                          className="text-sm border rounded-md px-2 py-1"
                          value={reviewTargetMap[room.roomId] || 'ROOM'}
                          onChange={(e) => setReviewTargetMap(prev => ({ ...prev, [room.roomId]: e.target.value as 'ROOM' | 'USER' }))}
                        >
                          <option value="ROOM">Phòng</option>
                          <option value="USER">Chủ trọ</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1" aria-label="Chọn số sao">
                        {[1,2,3,4,5].map((star) => {
                          const isUser = (reviewTargetMap[room.roomId] || 'ROOM') === 'USER';
                          const currentRating = isUser ? (landlordRatings[room.landlordInfo.landlordId] || 0) : (ratings[room.roomId] || 0);
                          const active = currentRating >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => {
                                if (isUser) {
                                  setLandlordRatings(prev => ({ ...prev, [room.landlordInfo.landlordId]: star }));
                                } else {
                                  setRatings(prev => ({ ...prev, [room.roomId]: star }));
                                }
                              }}
                              className={`p-1 transition-colors ${active ? 'text-yellow-400' : 'text-gray-300 hover:text-gray-400'}`}
                              aria-pressed={active}
                              aria-label={`${star} sao`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.347l5.518.442c.499.04.701.663.321.988l-4.204 3.57a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0l-4.725 2.885a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557l-4.204-3.57a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.347l2.125-5.111z" />
                              </svg>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      {(() => {
                        const isUser = (reviewTargetMap[room.roomId] || 'ROOM') === 'USER';
                        const textId = isUser ? `review-landlord-${room.landlordInfo.landlordId}` : `review-${room.roomId}`;
                        const value = isUser ? (landlordReviews[room.landlordInfo.landlordId] || '') : (reviews[room.roomId] || '');
                        return (
                          <>
                            <label htmlFor={textId} className="sr-only">Nhận xét</label>
                            <textarea
                              id={textId}
                              value={value}
                              onChange={(e) => {
                                if (isUser) {
                                  setLandlordReviews(prev => ({ ...prev, [room.landlordInfo.landlordId]: e.target.value }));
                                } else {
                                  setReviews(prev => ({ ...prev, [room.roomId]: e.target.value }));
                                }
                              }}
                              placeholder={isUser ? 'Chia sẻ về chủ trọ (tùy chọn)' : 'Chia sẻ về phòng (tùy chọn)'}
                              className="w-full rounded-md border border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm p-2 min-h-[80px]"
                            />
                            <div className="mt-2">
                              <input
                                key={
                                  (isUser
                                    ? `landlord-uploader-${room.landlordInfo.landlordId}-${landlordUploaderVersionMap[room.landlordInfo.landlordId] || 0}`
                                    : `room-uploader-${room.roomId}-${uploaderVersionMap[room.roomId] || 0}`)
                                }
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={async (e) => {
                                  const files = Array.from(e.target.files || []);
                                  if (files.length === 0) return;
                                  try {
                                    const uploaded = await uploadFiles(files);
                                    if (isUser) {
                                      const k = room.landlordInfo.landlordId;
                                      setLandlordMediaMap(prev => ({ ...prev, [k]: [ ...(prev[k] || []), ...uploaded ] }));
                                    } else {
                                      setMediaMap(prev => ({ ...prev, [room.roomId]: [ ...(prev[room.roomId] || []), ...uploaded ] }));
                                    }
                                    showSuccess('Đã tải ảnh', 'Ảnh đã được tải lên.');
                                  } catch (err: any) {
                                    const msg = extractApiErrorMessage(err);
                                    showError('Tải ảnh thất bại', msg);
                                  } finally {
                                    e.currentTarget.value = '';
                                  }
                                }}
                                className="block text-sm text-gray-600"
                              />
                              {isUser ? (
                                Boolean(landlordMediaMap[room.landlordInfo.landlordId]?.length) && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {(landlordMediaMap[room.landlordInfo.landlordId] || []).map((url, idx) => (
                                      <div key={idx} className="relative w-14 h-14 border rounded overflow-hidden">
                                        <img src={url} alt="media" className="w-full h-full object-cover" />
                                        <button
                                          type="button"
                                          onClick={() => setLandlordMediaMap(prev => ({
                                            ...prev,
                                            [room.landlordInfo.landlordId]: (prev[room.landlordInfo.landlordId] || []).filter((_, i) => i !== idx),
                                          }))}
                                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                          aria-label="Xóa ảnh"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )
                              ) : (
                                Boolean(mediaMap[room.roomId]?.length) && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {(mediaMap[room.roomId] || []).map((url, idx) => (
                                      <div key={idx} className="relative w-14 h-14 border rounded overflow-hidden">
                                        <img src={url} alt="media" className="w-full h-full object-cover" />
                                        <button
                                          type="button"
                                          onClick={() => setMediaMap(prev => ({
                                            ...prev,
                                            [room.roomId]: (prev[room.roomId] || []).filter((_, i) => i !== idx),
                                          }))}
                                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                          aria-label="Xóa ảnh"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-4">
                      {(() => {
                        const isUser = (reviewTargetMap[room.roomId] || 'ROOM') === 'USER';
                        const checked = isUser ? !!landlordAnonymousMap[room.landlordInfo.landlordId] : !!anonymousMap[room.roomId];
                        return (
                          <label className="inline-flex items-center text-sm text-gray-600 select-none">
                            <input
                              type="checkbox"
                              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={checked}
                              onChange={(e) => {
                                if (isUser) {
                                  setLandlordAnonymousMap(prev => ({ ...prev, [room.landlordInfo.landlordId]: e.target.checked }));
                                } else {
                                  setAnonymousMap(prev => ({ ...prev, [room.roomId]: e.target.checked }));
                                }
                              }}
                            />
                            Ẩn danh khi hiển thị
                          </label>
                        );
                      })()}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const isUser = (reviewTargetMap[room.roomId] || 'ROOM') === 'USER';
                            if (isUser) {
                              setLandlordRatings(prev => ({ ...prev, [room.landlordInfo.landlordId]: 0 }));
                              setLandlordReviews(prev => ({ ...prev, [room.landlordInfo.landlordId]: '' }));
                              setLandlordAnonymousMap(prev => ({ ...prev, [room.landlordInfo.landlordId]: false }));
                              setLandlordMediaMap(prev => ({ ...prev, [room.landlordInfo.landlordId]: [] }));
                            } else {
                              setRatings(prev => ({ ...prev, [room.roomId]: 0 }));
                              setReviews(prev => ({ ...prev, [room.roomId]: '' }));
                              setAnonymousMap(prev => ({ ...prev, [room.roomId]: false }));
                              setMediaMap(prev => ({ ...prev, [room.roomId]: [] }));
                            }
                          }}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-700"
                        >
                          Xóa
                        </button>
                        <button
                          type="button"
                          disabled={(() => {
                            const isUser = (reviewTargetMap[room.roomId] || 'ROOM') === 'USER';
                            const rating = isUser ? landlordRatings[room.landlordInfo.landlordId] : ratings[room.roomId];
                            return !rating;
                          })()}
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${(() => {
                            const isUser = (reviewTargetMap[room.roomId] || 'ROOM') === 'USER';
                            const rating = isUser ? landlordRatings[room.landlordInfo.landlordId] : ratings[room.roomId];
                            return rating ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed';
                          })()}`}
                          onClick={async () => {
                            try {
                              if (!user) return;
                              const isUser = (reviewTargetMap[room.roomId] || 'ROOM') === 'USER';
                              const payload = isUser ? {
                                writerId: Number((user as any).userId ?? (user as any).id),
                                targetType: 'USER' as const,
                                targetId: Number(room.landlordInfo.landlordId),
                                contractId: Number(room.contractId),
                                rating: Number(landlordRatings[room.landlordInfo.landlordId]),
                                content: (landlordReviews[room.landlordInfo.landlordId] || '').trim() || undefined,
                                isAnonymous: !!landlordAnonymousMap[room.landlordInfo.landlordId],
                                media: landlordMediaMap[room.landlordInfo.landlordId] || [],
                              } : {
                                writerId: Number((user as any).userId ?? (user as any).id),
                                targetType: 'ROOM' as const,
                                targetId: Number(room.roomId),
                                contractId: Number(room.contractId),
                                rating: Number(ratings[room.roomId]),
                                content: (reviews[room.roomId] || '').trim() || undefined,
                                isAnonymous: !!anonymousMap[room.roomId],
                                media: mediaMap[room.roomId] || [],
                              };
                              await createReview(payload);
                              showSuccess('Đã gửi đánh giá', 'Cảm ơn bạn đã chia sẻ trải nghiệm.');
                              if (isUser) {
                                setLandlordRatings(prev => ({ ...prev, [room.landlordInfo.landlordId]: 0 }));
                                setLandlordReviews(prev => ({ ...prev, [room.landlordInfo.landlordId]: '' }));
                                setLandlordAnonymousMap(prev => ({ ...prev, [room.landlordInfo.landlordId]: false }));
                                setLandlordMediaMap(prev => ({ ...prev, [room.landlordInfo.landlordId]: [] }));
                                setLandlordUploaderVersionMap(prev => ({ ...prev, [room.landlordInfo.landlordId]: (prev[room.landlordInfo.landlordId] || 0) + 1 }));
                                // Đồng thời dọn luôn media phía phòng (tránh còn ảnh cũ nếu người dùng chuyển dropdown)
                                setMediaMap(prev => ({ ...prev, [room.roomId]: [] }));
                                setUploaderVersionMap(prev => ({ ...prev, [room.roomId]: (prev[room.roomId] || 0) + 1 }));
                              } else {
                                setRatings(prev => ({ ...prev, [room.roomId]: 0 }));
                                setReviews(prev => ({ ...prev, [room.roomId]: '' }));
                                setAnonymousMap(prev => ({ ...prev, [room.roomId]: false }));
                                setMediaMap(prev => ({ ...prev, [room.roomId]: [] }));
                                setUploaderVersionMap(prev => ({ ...prev, [room.roomId]: (prev[room.roomId] || 0) + 1 }));
                                // Dọn media phía chủ trọ phòng trường hợp người dùng đã từng chọn USER
                                setLandlordMediaMap(prev => ({ ...prev, [room.landlordInfo.landlordId]: [] }));
                                setLandlordUploaderVersionMap(prev => ({ ...prev, [room.landlordInfo.landlordId]: (prev[room.landlordInfo.landlordId] || 0) + 1 }));
                              }
                            } catch (err: any) {
                              const msg = extractApiErrorMessage(err);
                              showError('Không thể gửi đánh giá', msg);
                            }
                          }}
                        >
                          Gửi đánh giá
                        </button>
                      </div>
                    </div>
                  </div>

                  
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}

        {/* Terminate Contract Modal */}
        <TerminateContractModal
          isOpen={showTerminateModal}
          roomNumber={selectedContract?.roomNumber || ''}
          onClose={() => {
            setShowTerminateModal(false);
            setSelectedContract(null);
          }}
          onConfirm={handleConfirmTerminate}
          isLoading={terminatingContract !== null}
        />

        {/* Roommate Requirements Modal */}
        <RoommateRequirementsModal
          isOpen={showRequirementsModal}
          onClose={() => {
            setShowRequirementsModal(false);
            setCurrentRoomId(null);
          }}
          onSave={handleSaveRequirements}
          initialRequirements={
            currentRoomId ? roommatePreferences[currentRoomId]?.requirements || null : null
          }
          initialPosterTraits={
            // ⭐ Lấy posterTraits từ profile.habits (nếu có) hoặc để trống
            Array.isArray((profile as any)?.habits) ? (profile as any).habits : []
          }
          posterAge={currentRoomId ? roommatePreferences[currentRoomId]?.posterAge || null : null}
          posterGender={currentRoomId ? roommatePreferences[currentRoomId]?.posterGender || null : null}
          loading={currentRoomId ? loadingPreferences[currentRoomId] || false : false}
        />
      </div>
      <Footer />
    </div>
  );
};

export default MyRoomsPage;
