"use client";

import { formatNumberVN, formatPriceWithSuffix } from "../../utils/format";

interface PropertyDetailsProps {
  postData: any;
  postType: 'rent' | 'roommate';
}

export default function PropertyDetails({ postData, postType }: PropertyDetailsProps) {
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
      'per_m3': 'Theo m³',
      'per_person': 'Theo đầu người',
    };
    return map[t] || t;
  };

  const translateLegalStatus = (t?: string) => {
    if (!t) return undefined;
    const map: Record<string, string> = {
      'co-so-hong': 'Có sổ hồng',
      'cho-so': 'Đang chờ sổ',
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

  const rentCategory: string | undefined = postType === 'rent' ? postData?.category : undefined;
  // Helper function to get address string
  const getAddressString = () => {
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

  // Helper function to get price
  const getPriceString = () => {
    if (postType === 'rent' && postData?.basicInfo?.price) {
      return `${(postData.basicInfo.price / 1000000).toFixed(1)} triệu / tháng`;
    } else if (postType === 'roommate' && postData?.currentRoom?.price) {
      return `${(postData.currentRoom.price / 1000000).toFixed(1)} triệu / tháng`;
    }
    return 'Chưa có thông tin giá';
  };

  // Helper function to get area
  const getAreaString = () => {
    if (postType === 'rent' && postData?.basicInfo?.area) {
      return `${postData.basicInfo.area} m²`;
    } else if (postType === 'roommate' && postData?.currentRoom?.area) {
      return `${postData.currentRoom.area} m²`;
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
              {postType === 'rent' && typeof postData?.basicInfo?.deposit === 'number' 
                ? formatPriceWithSuffix(postData.basicInfo.deposit, '', 'auto')
                : 'Chưa có thông tin'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Diện tích:</span>
            <span className="text-gray-900">{getAreaString()}</span>
          </div>
        </div>
      </div>

      {/* Tình Trạng Chi Tiết */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-gray-800 mb-3">Tình Trạng Chi Tiết</h4>
        <div className="border-t border-gray-200 pt-3 space-y-2">
          {postType === 'rent' && (
            <>
              {['chung-cu', 'nha-nguyen-can'].includes(String(rentCategory)) && typeof postData?.basicInfo?.bedrooms === 'number' && postData.basicInfo.bedrooms > 0 && (
                <Row label="Số Phòng Ngủ:" value={`${postData.basicInfo.bedrooms} phòng`} />
              )}
              {['chung-cu', 'nha-nguyen-can'].includes(String(rentCategory)) && typeof postData?.basicInfo?.bathrooms === 'number' && postData.basicInfo.bathrooms > 0 && (
                <Row label="Nhà Vệ Sinh:" value={`${postData.basicInfo.bathrooms} WC`} />
              )}
              {['chung-cu', 'nha-nguyen-can'].includes(String(rentCategory)) && postData?.basicInfo?.direction && (
                <Row label="Hướng:" value={translateDirection(postData.basicInfo.direction)} />
              )}
              {postData?.basicInfo?.furniture && (
                <Row label="Nội thất:" value={translateFurniture(postData.basicInfo.furniture)} />
              )}
              {['chung-cu', 'nha-nguyen-can'].includes(String(rentCategory)) && postData?.basicInfo?.legalStatus && (
                <Row label="Tình trạng pháp lý:" value={translateLegalStatus(postData.basicInfo.legalStatus)} />
              )}
            </>
          )}
          {postType === 'roommate' && (
            <>
              <Row label="Loại phòng:" value={translateRoomType(postData?.currentRoom?.roomType)} />
              {typeof postData?.currentRoom?.currentOccupants === 'number' && (
                <Row label="Số người hiện tại:" value={String(postData.currentRoom.currentOccupants)} />
              )}
              <Row label="Thời hạn còn lại:" value={translateRemainingDuration(postData?.currentRoom?.remainingDuration)} />
              {typeof postData?.currentRoom?.estimatedMonthlyUtilities === 'number' && (
                <Row label="Ước tính chi phí/tháng:" value={`${formatNumberVN(postData.currentRoom.estimatedMonthlyUtilities)} đ/tháng`} />
              )}
              {typeof postData?.currentRoom?.capIncludedAmount === 'number' && (
                <Row label="Mức bao gồm tối đa:" value={`${formatNumberVN(postData.currentRoom.capIncludedAmount)} đ`} />
              )}
              <Row label="Cách chia tiền điện nước:" value={translateShareMethod(postData?.currentRoom?.shareMethod)} />
            </>
          )}
        </div>
      </div>

      {/* Thông Tin Bất Động Sản */}
      {postType === 'rent' && (postData?.category === 'chung-cu' || postData?.category === 'nha-nguyen-can') && (
        <div className="mb-6">
          <h4 className="text-base font-semibold text-gray-800 mb-3">Thông Tin Bất Động Sản</h4>
          <div className="border-t border-gray-200 pt-3 space-y-2">
            {postData?.category === 'chung-cu' && postData?.chungCuInfo && (
              <>
                <Row label="Tên toà/Chung cư:" value={postData.chungCuInfo.buildingName} />
                <Row label="Block/Tower:" value={postData.chungCuInfo.blockOrTower} />
                <Row
                  label="Tầng:"
                  value={typeof postData.chungCuInfo.floorNumber === 'number' ? String(postData.chungCuInfo.floorNumber) : undefined}
                />
                <Row label="Mã căn:" value={postData.chungCuInfo.unitCode} />
                <Row label="Loại hình:" value={translatePropertyType(postData.chungCuInfo.propertyType)} />
              </>
            )}

            {postData?.category === 'nha-nguyen-can' && postData?.nhaNguyenCanInfo && (
              <>
                <Row label="Khu/Lô:" value={postData.nhaNguyenCanInfo.khuLo} />
                <Row label="Mã căn:" value={postData.nhaNguyenCanInfo.unitCode} />
                <Row label="Loại hình:" value={translatePropertyType(postData.nhaNguyenCanInfo.propertyType)} />
                <Row
                  label="Số tầng:"
                  value={typeof postData.nhaNguyenCanInfo.totalFloors === 'number' ? String(postData.nhaNguyenCanInfo.totalFloors) : undefined}
                />
                <Row
                  label="DT đất:"
                  value={typeof postData.nhaNguyenCanInfo.landArea === 'number' ? `${postData.nhaNguyenCanInfo.landArea} m²` : undefined}
                />
                <Row
                  label="DT sử dụng:"
                  value={typeof postData.nhaNguyenCanInfo.usableArea === 'number' ? `${postData.nhaNguyenCanInfo.usableArea} m²` : undefined}
                />
                <Row
                  label="Kích thước:"
                  value={
                    typeof postData.nhaNguyenCanInfo.width === 'number' && typeof postData.nhaNguyenCanInfo.length === 'number'
                      ? `${postData.nhaNguyenCanInfo.width} x ${postData.nhaNguyenCanInfo.length} m`
                      : undefined
                  }
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Chi Phí */}
      {(postData?.utilities || (postType === 'roommate' && postData?.currentRoom)) && (
        <div className="mb-6">
          <h4 className="text-base font-semibold text-gray-800 mb-3">Chi Phí</h4>
          <div className="border-t border-gray-200 pt-3 space-y-2">
            {postType === 'rent' && postData?.utilities && (
              <>
                {typeof postData.utilities.electricityPricePerKwh === 'number' && (
                  <Row label="Giá điện:" value={`${formatNumberVN(postData.utilities.electricityPricePerKwh)} đ/kWh`} />
                )}
                {typeof postData.utilities.waterPrice === 'number' && (
                  <Row label="Giá nước:" value={`${formatNumberVN(postData.utilities.waterPrice)} đ/${postData.utilities.waterBillingType === 'per_person' ? 'người' : 'm³'}`} />
                )}
                {postData.utilities.waterBillingType && (
                  <Row label="Cách tính nước:" value={translateWaterBillingType(postData.utilities.waterBillingType)} />
                )}
                {typeof postData.utilities.internetFee === 'number' && (
                  <Row label="Internet:" value={`${formatNumberVN(postData.utilities.internetFee)} đ/tháng`} />
                )}
                {typeof postData.utilities.garbageFee === 'number' && (
                  <Row label="Rác:" value={`${formatNumberVN(postData.utilities.garbageFee)} đ/tháng`} />
                )}
                {typeof postData.utilities.cleaningFee === 'number' && (
                  <Row label="Vệ sinh:" value={`${formatNumberVN(postData.utilities.cleaningFee)} đ/tháng`} />
                )}
                {['chung-cu', 'nha-nguyen-can'].includes(String(rentCategory)) && typeof postData.utilities.managementFee === 'number' && (
                  <Row label="Phí quản lý:" value={`${formatNumberVN(postData.utilities.managementFee)} ${postData.utilities.managementFeeUnit === 'per_m2_per_month' ? 'đ/m²/tháng' : 'đ/tháng'}`} />
                )}
                {['chung-cu', 'nha-nguyen-can'].includes(String(rentCategory)) && typeof postData.utilities.parkingCarFee === 'number' && (
                  <Row label="Bãi xe ô tô:" value={`${formatNumberVN(postData.utilities.parkingCarFee)} đ/tháng`} />
                )}
                {rentCategory === 'nha-nguyen-can' && typeof postData.utilities.gardeningFee === 'number' && (
                  <Row label="Chăm sóc vườn:" value={`${formatNumberVN(postData.utilities.gardeningFee)} đ/tháng`} />
                )}
              </>
            )}
            {postType === 'roommate' && postData?.currentRoom && (
              <>
                {typeof postData.currentRoom.electricityPricePerKwh === 'number' && (
                  <Row label="Giá điện:" value={`${formatNumberVN(postData.currentRoom.electricityPricePerKwh)} đ/kWh`} />
                )}
                {typeof postData.currentRoom.waterPrice === 'number' && (
                  <Row label="Giá nước:" value={`${formatNumberVN(postData.currentRoom.waterPrice)} đ/${postData.currentRoom.waterBillingType === 'per_person' ? 'người' : 'm³'}`} />
                )}
                <Row label="Cách tính nước:" value={translateWaterBillingType(postData?.currentRoom?.waterBillingType)} />
                {typeof postData.currentRoom.internetFee === 'number' && (
                  <Row label="Internet:" value={`${formatNumberVN(postData.currentRoom.internetFee)} đ/tháng`} />
                )}
                {typeof postData.currentRoom.garbageFee === 'number' && (
                  <Row label="Rác:" value={`${formatNumberVN(postData.currentRoom.garbageFee)} đ/tháng`} />
                )}
                {typeof postData.currentRoom.cleaningFee === 'number' && (
                  <Row label="Vệ sinh:" value={`${formatNumberVN(postData.currentRoom.cleaningFee)} đ/tháng`} />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Thông Tin Cá Nhân (chỉ cho roommate) */}
      {postType === 'roommate' && postData?.personalInfo && (
        <div className="mb-6">
          <h4 className="text-base font-semibold text-gray-800 mb-3">Thông Tin Cá Nhân</h4>
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <Row label="Họ và tên:" value={postData.personalInfo.fullName} />
            {typeof postData.personalInfo.age === 'number' && (
              <Row label="Tuổi:" value={String(postData.personalInfo.age)} />
            )}
            <Row label="Giới tính:" value={translateGender(postData.personalInfo.gender)} />
            <Row label="Nghề nghiệp:" value={postData.personalInfo.occupation} />
            {Array.isArray(postData.personalInfo.hobbies) && postData.personalInfo.hobbies.length > 0 && (
              <Row label="Sở thích:" value={postData.personalInfo.hobbies.join(', ')} />
            )}
            {Array.isArray(postData.personalInfo.habits) && postData.personalInfo.habits.length > 0 && (
              <Row label="Thói quen:" value={postData.personalInfo.habits.join(', ')} />
            )}
            <Row label="Thói quen sinh hoạt:" value={translateLifestyle(postData.personalInfo.lifestyle)} />
            <Row label="Mức độ sạch sẽ:" value={translateCleanliness(postData.personalInfo.cleanliness)} />
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
          {postType === 'roommate' && postData?.currentRoom?.description && (
            <div className="text-gray-700 leading-relaxed">
              {String(postData.currentRoom.description).split('\n').map((line: string, idx: number) => (
                <p key={idx} className="mb-2">{line}</p>
              ))}
            </div>
          )}
          {postData?.description ? (
            <div className="text-gray-700 leading-relaxed">
              {postData.description.split('\n').map((line: string, index: number) => (
                <p key={index} className="mb-2">{line}</p>
              ))}
            </div>
          ) : (
            postType !== 'roommate' && <p className="text-gray-500 italic">Chưa có mô tả chi tiết</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button className="flex-1 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          Liên hệ: 0782926 ***
        </button>
        <button className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
          Đăng ký thuê ngay
        </button>
      </div>
    </div>
  );
}
