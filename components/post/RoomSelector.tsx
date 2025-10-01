"use client";

import { useState, useEffect, useMemo } from "react";
import { PostType } from "@/types/Post";
import { Room } from "@/types/Room";
import { RoomForPost } from "@/types/Post";
import { getUserRooms, getPostsByRoom, getPosts } from "@/services/posts";
import { addressService } from "@/services/address";
import { formatPrice } from "@/utils/format";
import { useAuth } from "@/contexts/AuthContext";

// Sử dụng Room type từ types/Room.ts

interface RoomSelectorProps {
  postType: PostType;
  selectedRoom: RoomForPost | null;
  onSelectRoom: (room: RoomForPost | null) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function RoomSelector({ 
  postType, 
  selectedRoom, 
  onSelectRoom, 
  onBack, 
  onNext 
}: RoomSelectorProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomForPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [postedRoomIds, setPostedRoomIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Helper function để validate image URL
  const isValidImageUrl = (url: string): boolean => {
    if (!url || url === 'url1' || url === 'url2' || url === 'url3') return false;
    // Chấp nhận cả URL đầy đủ và relative URLs
    return url.length > 0 && !url.startsWith('url');
  };

  // Helper function để kiểm tra phòng đã được đăng bài roommate active hay chưa
  const checkRoomPostedStatus = async (roomIds: number[]) => {
    try {
      const postedIds = new Set<number>();
      
      // Kiểm tra từng phòng xem có bài đăng active không
      for (const roomId of roomIds) {
        try {
          // User thường không được gọi API landlord, nên dùng endpoint public khi không phải landlord
          if (user?.role === 'landlord') {
            const posts = await getPostsByRoom(roomId);
            const hasActivePost = posts.some((post: any) => {
              const t = String(post?.postType || '').toLowerCase();
              return post?.status === 'active' && (t === 'roommate' || t === 'tim-o-ghep');
            });
            if (hasActivePost) postedIds.add(roomId);
            continue;
          }

          // Không truyền postType/status để tránh BE filter sai key; lọc client-side
          const res: any = await getPosts({ roomId } as any);
          const list: any[] = Array.isArray(res?.posts) ? res.posts : Array.isArray(res) ? res : [];
          const hasActivePost = list.some((post: any) => {
            const t = String(post?.postType || '').toLowerCase();
            return post?.status === 'active' && (t === 'roommate' || t === 'tim-o-ghep');
          });
          if (hasActivePost) {
            postedIds.add(roomId);
          }
        } catch (err) {
        }
      }
      
      setPostedRoomIds(postedIds);
    } catch (err) {
    }
  };

  // Tạo selectedRoomId để so sánh chính xác
  const selectedRoomId = useMemo(() => {
    if (!selectedRoom) return null;
    return String(selectedRoom.roomId);
  }, [selectedRoom]);

  useEffect(() => {
    // Debounce để tránh duplicate calls
    const timeoutId = setTimeout(() => {
      loadRooms();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [postType, user?.userId]);

  // Lắng nghe sự kiện thay đổi bài đăng để reload phòng ngay sau khi xóa/cập nhật
  useEffect(() => {
    const onPostsChanged = () => loadRooms();
    if (typeof window !== 'undefined') {
      window.addEventListener('posts:changed', onPostsChanged);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('posts:changed', onPostsChanged);
      }
    };
  }, []);


  const loadRooms = async () => {
    // Prevent duplicate calls
    if (isLoadingRooms) {
      return;
    }
    
    try {
      setIsLoadingRooms(true);
      setLoading(true);
      setError(null);
      
      // Clear rooms state
      setRooms([]);
      
      let filteredRooms: RoomForPost[] = [];
      
      if (user?.role === 'landlord') {
        // Landlord: Đăng phòng của mình lên để cho thuê
        const apiPostType = postType === 'rent' ? 'cho-thue' : 'tim-o-ghep';
        const roomsData = await getUserRooms(apiPostType);
        
        filteredRooms = roomsData.filter(room => {
          return room.landlordId === user.userId;
        });
      } else {
        // User: Đăng phòng mà mình đang thuê để tìm ở ghép
        const { getUserRooms: getUserRentedRooms, getRoomById } = await import('@/services/rooms');
        const userRooms = await getUserRentedRooms();
        
        // Lấy thêm thông tin chi tiết phòng để có ảnh
        const roomsWithDetails = await Promise.all(
          userRooms.map(async (room) => {
            try {
              const roomDetail = await getRoomById(room.roomId);
              return { ...room, images: roomDetail.images || [] };
            } catch {
              return { ...room, images: [] };
            }
          })
        );
        
        filteredRooms = roomsWithDetails.map(room => ({
          roomId: room.roomId,
          roomNumber: room.roomNumber,
          buildingName: room.buildingName,
          buildingId: room.buildingId,
          landlordId: room.landlordInfo.landlordId,
          floor: 1, // Default value
          category: 'phong-tro' as const, // Default value
          area: room.area,
          price: room.monthlyRent,
          deposit: room.deposit,
          furniture: 'Cơ bản', // Default value
          maxOccupancy: room.maxOccupancy,
          canShare: room.currentOccupants < room.maxOccupancy,
          sharePrice: Math.floor(room.monthlyRent / room.maxOccupancy),
          currentOccupants: room.currentOccupants,
          availableSpots: room.maxOccupancy - room.currentOccupants,
          status: 'available' as const,
          images: room.images || [], // Sử dụng ảnh từ room
          videos: [],
          description: `Phòng ${room.roomNumber} - ${room.buildingName}`,
          address: {
            street: '',
            ward: '',
            city: '',
            provinceCode: '',
            provinceName: '',
            wardCode: '',
            wardName: ''
          },
          utilities: {},
          amenities: [],
          houseRules: []
        }));
      }

      // Remove duplicates - keep only the first occurrence of each roomId
      const uniqueRooms = filteredRooms.filter((room, index, self) => 
        index === self.findIndex(r => r.roomId === room.roomId)
      );
      
      // Set rooms to state (use unique rooms)
      setRooms(uniqueRooms);
      
      // Kiểm tra trạng thái đăng bài của các phòng
      const roomIds = uniqueRooms.map(room => room.roomId);
      await checkRoomPostedStatus(roomIds);
    } catch (err: any) {
      setError('Không thể tải danh sách phòng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setIsLoadingRooms(false);
    }
  };

  const getRoomTypeText = (room: RoomForPost) => {
    switch (room.category) {
      case 'phong-tro':
        return 'Phòng trọ';
      case 'chung-cu':
        return 'Chung cư';
      case 'nha-nguyen-can':
        return 'Nhà nguyên căn';
      default:
        return 'Phòng';
    }
  };

  const getRoomStatusText = (room: RoomForPost) => {
    if (postType === 'rent') {
      return room.currentOccupants === 0 ? 'Trống' : 'Có người ở';
    } else {
      return room.availableSpots > 0 ? 'Có thể ở ghép' : 'Đã đầy';
    }
  };

  const getRoomStatusColor = (room: RoomForPost) => {
    if (postType === 'rent') {
      return room.currentOccupants === 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return room.availableSpots > 0 ? 'text-blue-600' : 'text-red-600';
    }
  };

  const isValidRoom = (room: RoomForPost) => {
    if (postType === 'rent') {
      // Cho thuê: Phòng phải 100% trống (currentOccupants = 0)
      return room.currentOccupants === 0 && room.status === 'available';
    } else {
      // Ở ghép: Phòng phải có ít nhất 1 người ở và còn chỗ trống
      return room.currentOccupants > 0 && room.availableSpots > 0 && room.canShare && room.status === 'available';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chọn phòng</h2>
          <p className="text-gray-600">
            {postType === 'rent' ? 
              'Chọn phòng trống để cho thuê' : 
              'Chọn phòng có chỗ trống để tìm ở ghép'
            }
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách phòng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chọn phòng</h2>
          <p className="text-gray-600">
            {postType === 'rent' ? 
              'Chọn phòng trống để cho thuê' : 
              'Chọn phòng có chỗ trống để tìm ở ghép'
            }
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Không thể tải danh sách phòng</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadRooms}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Filter rooms based on postType logic, posted status, and search query
  const validRooms = rooms.filter(room => {
    // Ẩn phòng đã được đăng bài
    if (postedRoomIds.has(room.roomId)) {
      return false;
    }
    
    // Filter theo search query (tìm theo tên phòng, mã phòng, địa chỉ)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const roomNumber = room.roomNumber.toLowerCase();
      const buildingName = (room.buildingName || '').toLowerCase();
      const address = room.address ? 
        `${room.address.street} ${room.address.ward} ${room.address.city}`.toLowerCase() : '';
      
      // Tìm kiếm linh hoạt: tìm trong tên phòng, tòa nhà, hoặc địa chỉ
      const matchesRoomNumber = roomNumber.includes(query);
      const matchesBuildingName = buildingName.includes(query);
      const matchesAddress = address.includes(query);
      
      if (!matchesRoomNumber && !matchesBuildingName && !matchesAddress) {
        return false;
      }
    }
    
    if (user?.role === 'landlord') {
      // Landlord: Cho thuê - chỉ hiển thị phòng 100% trống
      if (postType === 'rent') {
        return room.currentOccupants === 0 && room.status === 'available';
      } else {
        // Landlord không nên đăng "tìm ở ghép" cho phòng của mình
        return false;
      }
    } else {
      // User: Tìm ở ghép - phòng phải có ít nhất 1 người ở và còn chỗ trống
      return room.currentOccupants > 0 && room.currentOccupants < room.maxOccupancy && room.status === 'available';
    }
  });

  if (validRooms.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chọn phòng</h2>
          <p className="text-gray-600">
            {postType === 'rent' ? 
              'Chọn phòng trống để cho thuê' : 
              'Chọn phòng có chỗ trống để tìm ở ghép'
            }
          </p>
        </div>

        {/* Thanh tìm kiếm vẫn hiển thị khi có lỗi */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm theo mã phòng, tên tòa nhà hoặc địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            {searchQuery.trim() ? 
              'Không tìm thấy phòng phù hợp' : 
              (user?.role === 'landlord' ? 'Không có phòng trống' : 'Không có phòng cho ở ghép')
            }
          </h3>
          <p className="text-yellow-600 mb-4">
            {searchQuery.trim() ? 
              `Không tìm thấy phòng nào phù hợp với từ khóa "${searchQuery}". Hãy thử tìm kiếm với từ khóa khác.` :
              (user?.role === 'landlord' ? 
                'Hiện tại không có phòng nào 100% trống để cho thuê. Chỉ những phòng hoàn toàn trống mới có thể đăng cho thuê.' :
                'Bạn chưa có phòng nào đang thuê để đăng tìm ở ghép. Chỉ những phòng bạn đang thuê mới có thể đăng tìm người ở ghép.')
            }
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Quay lại
            </button>
            {searchQuery.trim() ? (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Xóa tìm kiếm
              </button>
            ) : (
              <button
                onClick={loadRooms}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Tải lại
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chọn phòng</h2>
          <p className="text-gray-600">
            {user?.role === 'landlord' ? 
              'Chọn phòng 100% trống để cho thuê' : 
              'Chọn phòng bạn đang thuê để tìm ở ghép'
            }
          </p>
        </div>

      {/* Thanh tìm kiếm */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Tìm theo mã phòng, tên tòa nhà hoặc địa chỉ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {validRooms.map((room) => (
          <div
            key={room.roomId}
            className={`group relative bg-white rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg overflow-hidden ${
              selectedRoomId === String(room.roomId)
                ? 'border-teal-500 shadow-lg ring-2 ring-teal-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => {
              // Logic bỏ tích: nếu click vào phòng đã chọn thì bỏ chọn
              const currentRoomId = String(room.roomId);
              if (selectedRoomId === currentRoomId) {
                onSelectRoom(null); // Bỏ chọn
              } else {
                onSelectRoom(room); // Chọn phòng mới
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                // Logic bỏ tích: nếu click vào phòng đã chọn thì bỏ chọn
                const currentRoomId = String(room.roomId);
                if (selectedRoomId === currentRoomId) {
                  onSelectRoom(null); // Bỏ chọn
                } else {
                  onSelectRoom(room); // Chọn phòng mới
                }
              }
            }}
          >
            {/* Hình ảnh phòng */}
            <div className="relative h-32 bg-gray-100">
              {room.images?.[0] && isValidImageUrl(room.images[0]) ? (
                <img 
                  src={room.images[0]} 
                  alt={`Phòng ${room.roomNumber}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                </div>
              )}
              
              {/* Badge loại phòng */}
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 text-xs font-medium bg-white/90 text-gray-700 rounded-full backdrop-blur-sm">
                  {getRoomTypeText(room)}
                </span>
              </div>
              
              {/* Checkmark chỉ hiện khi phòng được chọn */}
              {selectedRoomId === String(room.roomId) && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            {/* Nội dung phòng */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Phòng {room.roomNumber}
                </h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRoomStatusColor(room)} ${
                  user?.role === 'landlord' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {user?.role === 'landlord' ? 'Trống' : 'Có thể ở ghép'}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600 mb-3">
                <p className="font-medium text-gray-900 truncate">{room.buildingName || 'Tòa nhà'}</p>
                <p className="text-xs text-gray-500 truncate">
                  {room.address ? `${room.address.street}, ${room.address.ward}, ${room.address.city}` : 'Địa chỉ không xác định'}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span>{room.area}m²</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-teal-600">
                  {formatPrice(room.price)}đ/tháng
                </span>
                <span className="text-xs text-gray-500">
                  {room.currentOccupants}/{room.maxOccupancy} người
                  {user?.role === 'user' && room.currentOccupants < room.maxOccupancy && (
                    <span className="ml-1 text-blue-600 font-medium">({room.maxOccupancy - room.currentOccupants} chỗ trống)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Quay lại
        </button>
        <button
          onClick={onNext}
          disabled={!selectedRoom}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
            selectedRoom 
              ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg hover:shadow-xl' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selectedRoom ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Tiếp tục
            </>
          ) : (
            'Chọn phòng để tiếp tục'
          )}
        </button>
      </div>
    </div>
  );
}
