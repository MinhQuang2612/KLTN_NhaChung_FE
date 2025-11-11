"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatNumberVN, formatPriceWithSuffix } from "../../utils/format";
import { AgeUtils } from "@/utils/ageUtils";
import { Post } from "../../types/Post";
import { getRoomById } from "../../services/rooms";
import RentalRequestForm from "../rental/RentalRequestForm";
import RoomSharingRequestForm from "../room_sharing/RoomSharingRequestForm";
import { getUserById } from "@/services/user";
import { getMyProfile as getUserProfileApi } from "@/services/userProfiles";
import { apiGet } from "@/utils/api";

interface PropertyDetailsProps {
  postData: Post | null;
  postType: 'rent' | 'roommate';
}

export default function PropertyDetails({ postData, postType }: PropertyDetailsProps) {
  const [roomData, setRoomData] = useState<any>(null);
  const [showRentalForm, setShowRentalForm] = useState(false);
  const [showSharingForm, setShowSharingForm] = useState(false);
  const { user } = useAuth();
  
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

  // --- BEGIN: custom fetch - chỉ lấy 3 trường thông tin cá nhân
  const [infoUser, setInfoUser] = useState<any>();
  const [infoProfile, setInfoProfile] = useState<any>();
  const [infoVerification, setInfoVerification] = useState<any>();

  useEffect(() => {
    if (postType === 'roommate' && postData?.userId) {
      getUserById(postData.userId).then(setInfoUser).catch(() => setInfoUser(undefined));
      apiGet('user-profiles/' + postData.userId).then(setInfoProfile).catch(() => setInfoProfile(undefined));
      apiGet(`users/${postData.userId}/verification`).then(setInfoVerification).catch(() => setInfoVerification(undefined));
    }
  }, [postData, postType]);
// --- END: custom fetch

  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900">{value ?? 'Chưa có thông tin'}</span>
    </div>
  );

  const translateDirection = (dir?: string) => {
    if (!dir) return undefined;
    const map: Record<string, string> = {
      'dong': 'Đông',
      'tay': 'Tây',
      'nam': 'Nam',
      'bac': 'Bắc',
      'dong-nam': 'Đông Nam',
      'dong-bac': 'Đông Bắc',
      'tay-nam': 'Tây Nam',
      'tay-bac': 'Tây Bắc',
    };
    return map[dir] || dir;
  };

  const translateFurniture = (f?: string) => {
    if (!f) return undefined;
    const map: Record<string, string> = {
      'full': 'Nội thất đầy đủ',
      'co-ban': 'Nội thất cơ bản',
      'trong': 'Nhà trống',
    };
    return map[f] || f;
  };

  const translateWaterBillingType = (t?: string) => {
    if (!t) return undefined;
    const map: Record<string, string> = {
      'per_m3': 'khối',
      'per_person': 'người',
    };
    return map[t] || t;
  };

  const translateLegalStatus = (t?: string) => {
    if (!t) return undefined;
    const map: Record<string, string> = {
      'co-so-hong': 'Có sổ hồng',
      'cho-so': 'Đang chờ sổ',
      'dang-ky': 'Đang đăng ký',
      'chua-dang-ky': 'Chưa đăng ký',
    };
    return map[t] || t;
  };

  const translatePropertyType = (t?: string) => {
    if (!t) return undefined;
    const map: Record<string, string> = {
      // Chung cư
      'chung-cu': 'Chung cư',
      'can-ho-dv': 'Căn hộ dịch vụ',
      'officetel': 'Officetel',
      'studio': 'Studio',
      // Nhà nguyên căn
      'nha-pho': 'Nhà phố',
      'biet-thu': 'Biệt thự',
      'nha-hem': 'Nhà hẻm',
      'nha-cap4': 'Nhà cấp 4',
    };
    return map[t] || t;
  };

  const translateRoomType = (t?: string) => {
    if (!t) return undefined;
    const map: Record<string, string> = {
      // Map chi tiết theo spec VN
      'phong-tro': 'Phòng trọ',
      'phong-tro-day-du': 'Phòng trọ đầy đủ',
      'phong-tro-co-ban': 'Phòng trọ cơ bản',
      'phong-tro-trong': 'Phòng trọ trống',
      'chung-cu': 'Chung cư',
      'nha-nguyen-can': 'Nhà nguyên căn',
      // Legacy fallback
      'single': 'Phòng đơn',
      'double': 'Phòng đôi',
      'shared': 'Phòng 3-4 người',
    };
    return map[t] || t;
  };

  const translateShareMethod = (t?: string) => {
    if (!t) return undefined;
    const map: Record<string, string> = {
      'split_evenly': 'Chia đều',
      'by_usage': 'Theo sử dụng',
    };
    return map[t] || t;
  };

  const translateRemainingDuration = (t?: string) => {
    if (!t) return undefined;
    const map: Record<string, string> = {
      '1-3 months': '1-3 tháng',
      '3-6 months': '3-6 tháng',
      '6-12 months': '6-12 tháng',
      '1-2 years': '1-2 năm',
      '2+ years': 'Trên 2 năm',
      'indefinite': 'Không xác định',
      'over_1_year': 'Trên 1 năm',
    };
    return map[t] || t;
  };

  const translateGender = (t?: string) => {
    if (!t) return undefined;
    const map: Record<string, string> = {
      'male': 'Nam',
      'female': 'Nữ',
      'other': 'Khác',
      'any': 'Không quan trọng',
    };
    return map[t] || t;
  };

  const translateLifestyle = (t?: string) => {
    if (!t) return undefined;
    const map: Record<string, string> = {
      'early': 'Dậy sớm (5-7h)',
      'normal': 'Bình thường (7-9h)',
      'late': 'Dậy muộn (9h+)',
    };
    return map[t] || t;
  };

  const translateCleanliness = (t?: string) => {
    if (!t) return undefined;
    const map: Record<string, string> = {
      'very_clean': 'Rất sạch sẽ',
      'clean': 'Sạch sẽ',
      'normal': 'Bình thường',
      'flexible': 'Không quá khắt khe',
    };
    return map[t] || t;
  };

  const translateOccupation = (occupation?: string) => {
    if (!occupation) return undefined;
    const map: Record<string, string> = {
      'office_worker': 'Nhân viên văn phòng',
      'student': 'Sinh viên',
      'freelancer': 'Freelancer',
      'worker': 'Công nhân',
      'teacher': 'Giáo viên',
      'engineer': 'Kỹ sư',
      'doctor': 'Bác sĩ',
      'doctor_nurse': 'Cán bộ ngành Y',
      'driver': 'Tài xế',
      'business': 'Kinh doanh',
      'it': 'IT',
      'designer': 'Thiết kế',
      'retired': 'Đã nghỉ hưu',
      'unemployed': 'Thất nghiệp',
      'other': 'Khác',
    };
    return map[occupation] || occupation;
  };

  const rentCategory: string | undefined = postType === 'rent' ? roomData?.category : undefined;
  // Helper build full address string from room address
  const getAddressString = () => {
    if (roomData?.address) {
      const a = roomData.address as any;
      const parts = [
        a.specificAddress,
        a.street,
        a.wardName || a.ward,
        a.city || a.provinceName,
      ].filter((v: string | undefined) => !!v && String(v).trim().length > 0);
      return parts.join(', ');
    }
    return 'Chưa có thông tin địa chỉ';
  };

  // Helper function to get price
  const getPriceString = () => {
    if (roomData?.price) {
      return `${(roomData.price / 1000000).toFixed(1)} triệu / tháng`;
    }
    return 'Chưa có thông tin giá';
  };

  // Helper function to get area
  const getAreaString = () => {
    if (roomData?.area) {
      return `${roomData.area} m²`;
    }
    return 'Chưa có thông tin diện tích';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Thông Tin Chính */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Thông Tin Chính</h3>
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Địa Chỉ:</span>
            <span className="text-gray-900">{getAddressString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Giá Cho Thuê:</span>
            <span className="text-gray-900 font-semibold text-red-600">{getPriceString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Đặt cọc:</span>
            <span className="text-gray-900">
              {roomData?.deposit 
                ? formatPriceWithSuffix(roomData.deposit, '', 'auto')
                : 'Chưa có thông tin'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Diện tích:</span>
            <span className="text-gray-900">{getAreaString()}</span>
          </div>
          
          {/* Occupancy fields removed per new spec */}

          {/* Fields specific to chung cu */}
          {roomData?.category === 'chung-cu' && roomData?.chungCuInfo && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Tên toà/Chung cư:</span>
                <span className="text-gray-900">{roomData.chungCuInfo.buildingName || 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Block/Tower:</span>
                <span className="text-gray-900">{roomData.chungCuInfo.blockOrTower || 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tầng:</span>
                <span className="text-gray-900">{roomData.chungCuInfo.floorNumber ? String(roomData.chungCuInfo.floorNumber) : 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mã căn:</span>
                <span className="text-gray-900">{roomData.chungCuInfo.unitCode || 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Loại hình:</span>
                <span className="text-gray-900">{translatePropertyType(roomData.chungCuInfo.propertyType) || 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phòng ngủ:</span>
                <span className="text-gray-900">{roomData.chungCuInfo.bedrooms ? String(roomData.chungCuInfo.bedrooms) : 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phòng tắm:</span>
                <span className="text-gray-900">{roomData.chungCuInfo.bathrooms ? String(roomData.chungCuInfo.bathrooms) : 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hướng nhà:</span>
                <span className="text-gray-900">{translateDirection(roomData.chungCuInfo.direction) || 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tình trạng pháp lý:</span>
                <span className="text-gray-900">{translateLegalStatus(roomData.chungCuInfo.legalStatus) || 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nội thất:</span>
                <span className="text-gray-900">{translateFurniture(roomData.furniture) || 'Chưa có thông tin'}</span>
              </div>
              {/* Occupancy fields removed per new spec */}
            </>
          )}

          {/* Fields specific to nha nguyen can */}
          {roomData?.category === 'nha-nguyen-can' && roomData?.nhaNguyenCanInfo && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Loại hình:</span>
                <span className="text-gray-900">{translatePropertyType(roomData.nhaNguyenCanInfo.propertyType) || 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tầng:</span>
                <span className="text-gray-900">{roomData.nhaNguyenCanInfo.totalFloors ? String(roomData.nhaNguyenCanInfo.totalFloors) : 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">DT đất:</span>
                <span className="text-gray-900">{roomData.nhaNguyenCanInfo.landArea ? `${roomData.nhaNguyenCanInfo.landArea} m²` : 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">DT sử dụng:</span>
                <span className="text-gray-900">{roomData.nhaNguyenCanInfo.usableArea ? `${roomData.nhaNguyenCanInfo.usableArea} m²` : 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Kích thước:</span>
                <span className="text-gray-900">
                  {roomData.nhaNguyenCanInfo.width && roomData.nhaNguyenCanInfo.length 
                    ? `${roomData.nhaNguyenCanInfo.width} x ${roomData.nhaNguyenCanInfo.length} m`
                    : 'Chưa có thông tin'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phòng ngủ:</span>
                <span className="text-gray-900">{roomData.nhaNguyenCanInfo.bedrooms ? String(roomData.nhaNguyenCanInfo.bedrooms) : 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phòng tắm:</span>
                <span className="text-gray-900">{roomData.nhaNguyenCanInfo.bathrooms ? String(roomData.nhaNguyenCanInfo.bathrooms) : 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hướng nhà:</span>
                <span className="text-gray-900">{translateDirection(roomData.nhaNguyenCanInfo.direction) || 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tình trạng pháp lý:</span>
                <span className="text-gray-900">{translateLegalStatus(roomData.nhaNguyenCanInfo.legalStatus) || 'Chưa có thông tin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tiện ích:</span>
                <span className="text-gray-900">
                  {roomData.nhaNguyenCanInfo.features && roomData.nhaNguyenCanInfo.features.length > 0 
                    ? roomData.nhaNguyenCanInfo.features.join(', ')
                    : 'Chưa có thông tin'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nội thất:</span>
                <span className="text-gray-900">{translateFurniture(roomData.furniture) || 'Chưa có thông tin'}</span>
              </div>
              {/* Occupancy fields removed per new spec */}
            </>
          )}

          {/* Fields specific to phong tro */}
          {roomData?.category === 'phong-tro' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Nội thất:</span>
                <span className="text-gray-900">{translateFurniture(roomData.furniture) || 'Chưa có thông tin'}</span>
              </div>
              {/* Occupancy fields removed per new spec */}
            </>
          )}
        </div>
      </div>

      {/* Tình Trạng Chi Tiết */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-gray-800 mb-3">Tình Trạng Chi Tiết</h4>
        <div className="border-t border-gray-200 pt-3 space-y-2">
          {/* Utilities information */}
          {roomData?.utilities && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Giá điện:</span>
                <span className="text-gray-900">
                  {roomData.utilities.electricityPricePerKwh 
                    ? `${formatPriceWithSuffix(roomData.utilities.electricityPricePerKwh, '', 'auto')}/kWh`
                    : 'Chưa có thông tin'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Giá nước:</span>
                <span className="text-gray-900">
                  {roomData.utilities.waterPrice 
                    ? `${formatPriceWithSuffix(roomData.utilities.waterPrice, '', 'auto')}${roomData.utilities.waterBillingType ? `/${translateWaterBillingType(roomData.utilities.waterBillingType)}` : ''}`
                    : 'Chưa có thông tin'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí Internet:</span>
                <span className="text-gray-900">
                  {roomData.utilities.internetFee 
                    ? `${formatPriceWithSuffix(roomData.utilities.internetFee, '', 'auto')}/tháng`
                    : 'Miễn phí'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí rác:</span>
                <span className="text-gray-900">
                  {roomData.utilities.garbageFee 
                    ? `${formatPriceWithSuffix(roomData.utilities.garbageFee, '', 'auto')}/tháng`
                    : 'Miễn phí'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí vệ sinh:</span>
                <span className="text-gray-900">
                  {roomData.utilities.cleaningFee 
                    ? `${formatPriceWithSuffix(roomData.utilities.cleaningFee, '', 'auto')}/tháng`
                    : 'Miễn phí'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí gửi xe máy:</span>
                <span className="text-gray-900">
                  {roomData.utilities.parkingMotorbikeFee 
                    ? `${formatPriceWithSuffix(roomData.utilities.parkingMotorbikeFee, '', 'auto')}/tháng`
                    : 'Miễn phí'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí gửi xe ô tô:</span>
                <span className="text-gray-900">
                  {roomData.utilities.parkingCarFee 
                    ? `${formatPriceWithSuffix(roomData.utilities.parkingCarFee, '', 'auto')}/tháng`
                    : 'Miễn phí'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí quản lý:</span>
                <span className="text-gray-900">
                  {roomData.utilities.managementFee 
                    ? `${formatPriceWithSuffix(roomData.utilities.managementFee, '', 'auto')}/${roomData.utilities.managementFeeUnit === 'per_month' ? 'tháng' : 'm²'}`
                    : 'Miễn phí'}
                </span>
              </div>
            </>
          )}
          {postType === 'roommate' && (
            <>
              <Row label="Loại phòng:" value={translateRoomType(roomData?.category)} />
              
              {/* Bỏ hiển thị cách chia tiền điện nước theo yêu cầu */}
            </>
          )}
        </div>
      </div>



      {/* Thông Tin Cá Nhân (chỉ cho roommate) */}
      {postType === 'roommate' && postData?.userId && (
        <div className="mb-6">
          <h4 className="text-base font-semibold text-gray-800 mb-3">Thông Tin Cá Nhân</h4>
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <Row label="Họ và tên:" value={infoUser?.name ?? 'Chưa có thông tin'} />
            <Row label="Giới tính:" value={translateGender(infoVerification?.gender ?? infoVerification?.verification?.gender)} />
            <Row label="Nghề nghiệp:" value={translateOccupation(infoProfile?.occupation) ?? 'Chưa có thông tin'} />
          </div>
        </div>
      )}

      {/* Yêu Cầu Về Người Ở Ghép (chỉ cho roommate) */}
      {postType === 'roommate' && postData?.requirements && (
        <div className="mb-6">
          <h4 className="text-base font-semibold text-gray-800 mb-3">Yêu Cầu Về Người Ở Ghép</h4>
          <div className="border-t border-gray-200 pt-3 space-y-2">
            {Array.isArray(postData.requirements.ageRange) && postData.requirements.ageRange.length === 2 && (
              <Row label="Độ tuổi mong muốn:" value={`${postData.requirements.ageRange[0]} - ${postData.requirements.ageRange[1]}`} />
            )}
            <Row label="Giới tính mong muốn:" value={translateGender(postData.requirements.gender)} />
            {Array.isArray(postData.requirements.traits) && postData.requirements.traits.length > 0 && (
              <Row label="Tính cách mong muốn:" value={postData.requirements.traits.join(', ')} />
            )}
            {typeof postData.requirements.maxPrice === 'number' && (
              <Row label="Giá tối đa (VNĐ/tháng):" value={formatNumberVN(postData.requirements.maxPrice)} />
            )}
          </div>
        </div>
      )}


      {/* Thông Tin Thêm */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Thông Tin Thêm</h3>
        <div className="border-t border-gray-200 pt-3 space-y-4">
          {roomData?.description ? (
            <div className="text-gray-700 leading-relaxed">
              {roomData.description.split('\n').map((line: string, index: number) => (
                <p key={index} className="mb-2">{line}</p>
              ))}
            </div>
          ) : (
            postType !== 'roommate' && <p className="text-gray-500 italic">Chưa có mô tả chi tiết</p>
          )}
        </div>
      </div>

      {/* Action Buttons - chỉ hiển thị cho user không phải chủ nhà và không phải bài đăng của chính mình */}
      {user?.role !== 'landlord' && user && user?.userId !== postData?.userId && (
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button className="flex-1 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            Liên hệ: {postData?.phone || '0782926 ***'}
          </button>
          
          {/* Logic hiển thị buttons dựa trên room occupancy và postType */}
          {(() => {
            const currentOccupancy = roomData?.currentOccupants || roomData?.currentOccupancy || 0;
            const hasTenant = currentOccupancy > 0;

            // Cho thuê: phòng trống thì cho đăng ký, có người thuê thì khóa
            if (postType === 'rent') {
              if (!hasTenant) {
                return (
                  <button 
                    onClick={() => setShowRentalForm(true)}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Đăng ký thuê ngay
                  </button>
                );
              }
              return (
                <div className="flex-1 px-4 py-3 bg-gray-300 text-gray-600 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  Phòng đã cho thuê
                </div>
              );
            }

            // Ở ghép: luôn cho đăng ký, không kiểm tra full người theo logic mới
            if (postType === 'roommate') {
              return (
                <button 
                  onClick={() => setShowSharingForm(true)}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  Đăng ký ở ghép
                </button>
              );
            }

            return null;
          })()}
        </div>
      )}

      {/* Hiển thị thông báo đăng nhập nếu chưa đăng nhập */}
      {!user && (
        <div className="pt-4 border-t border-gray-200 text-center">
          <p className="text-gray-600 mb-3">Vui lòng đăng nhập để đăng ký thuê phòng</p>
          <a 
            href="/login" 
            className="inline-block px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
          >
            Đăng nhập ngay
          </a>
        </div>
      )}

      {/* Rental Request Form Modal */}
      {showRentalForm && postData && (
        <RentalRequestForm
          postId={postData.postId}
          postTitle={postData.title}
          onSuccess={() => setShowRentalForm(false)}
          onCancel={() => setShowRentalForm(false)}
        />
      )}

      {/* Room Sharing Request Form Modal */}
      {showSharingForm && postData && (
        <RoomSharingRequestForm
          roomId={Number(postData.roomId)}
          postId={Number(postData.postId)}
          onSuccess={() => setShowSharingForm(false)}
          onClose={() => setShowSharingForm(false)}
        />
      )}
    </div>
  );
}
