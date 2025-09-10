"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createRoommatePost } from '../../services/roommatePosts';
import { uploadFiles } from '../../utils/upload';
import { useRouter } from 'next/navigation';
import MediaPickerPanel, { LocalMediaItem } from '../common/MediaPickerLocal';
import AddressSelector from '../common/AddressSelector';
import { Address, addressService } from '../../services/address';

// Address Modal Component
function AddressModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (a: Address | null) => void;
  initial?: Partial<Address>;
}) {
  const [address, setAddress] = useState<Address | null>(null);
  
  // Update address when initial changes
  useEffect(() => {
    if (initial) {
      setAddress(initial as Address);
    } else {
      setAddress(null);
    }
  }, [initial]);
  
  if (!open) return null;

  const handleSave = () => {
    onSave(address);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="px-4 py-3 border-b text-center font-semibold">
            Địa chỉ
          </div>
          <div className="p-4">
            <AddressSelector
              value={address}
              onChange={setAddress}
            />
          </div>
          <div className="px-4 py-3 border-t flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-10 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function RoommateForm() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  
  // Personal info
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState('');
  const [cleanliness, setCleanliness] = useState('');
  
  // Current room info
  const [roomAddress, setRoomAddress] = useState<Address>({
    street: '',
    ward: '',
    city: '',
    specificAddress: '',
    showSpecificAddress: false,
    provinceCode: '',
    provinceName: '',
    wardCode: '',
    wardName: '',
    additionalInfo: ''
  });
  const [roomPrice, setRoomPrice] = useState('');
  const [roomArea, setRoomArea] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomType, setRoomType] = useState('');
  const [currentOccupants, setCurrentOccupants] = useState('');
  const [remainingDuration, setRemainingDuration] = useState('');
  // Utilities (ở ghép)
  const [shareMethod, setShareMethod] = useState('');
  const [estimatedMonthlyUtilities, setEstimatedMonthlyUtilities] = useState('');
  const [capIncludedAmount, setCapIncludedAmount] = useState('');
  const [electricityPricePerKwh, setElectricityPricePerKwh] = useState('');
  const [waterPrice, setWaterPrice] = useState('');
  const [waterBillingType, setWaterBillingType] = useState('');
  const [internetFee, setInternetFee] = useState('');
  const [garbageFee, setGarbageFee] = useState('');
  const [cleaningFee, setCleaningFee] = useState('');
  
  // Requirements
  const [ageRangeMin, setAgeRangeMin] = useState('');
  const [ageRangeMax, setAgeRangeMax] = useState('');
  const [preferredGender, setPreferredGender] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Contact info
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Media
  const [images, setImages] = useState<LocalMediaItem[]>([]);
  const [videos, setVideos] = useState<LocalMediaItem[]>([]);
  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: '' | 'success' | 'error';
    text: string;
  }>({ type: '', text: '' });
  const [addrOpen, setAddrOpen] = useState(false);

  const handleHobbyClick = (hobby: string) => {
    setSelectedHobbies(prev => 
      prev.includes(hobby) 
        ? prev.filter(h => h !== hobby)
        : [...prev, hobby]
    );
  };

  const handleTraitClick = (trait: string) => {
    setSelectedTraits(prev => 
      prev.includes(trait) 
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  const handleHabitClick = (habit: string) => {
    setSelectedHabits(prev => 
      prev.includes(habit) 
        ? prev.filter(h => h !== habit)
        : [...prev, habit]
    );
  };

  // Helper function for toast
  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 3000);
  };


  const validateForm = () => {
    if (!title.trim()) {
      showToast('error', 'Vui lòng nhập tiêu đề bài đăng');
      return false;
    }
    if (!description.trim()) {
      showToast('error', 'Vui lòng nhập mô tả');
      return false;
    }
    if (!fullName.trim()) {
      showToast('error', 'Vui lòng nhập họ và tên');
      return false;
    }
    if (!age || Number(age) < 18 || Number(age) > 100) {
      showToast('error', 'Vui lòng nhập tuổi hợp lệ (18-100)');
      return false;
    }
    if (!gender) {
      showToast('error', 'Vui lòng chọn giới tính');
      return false;
    }
    if (!occupation.trim()) {
      showToast('error', 'Vui lòng nhập nghề nghiệp');
      return false;
    }
    // Kiểm tra địa chỉ an toàn, không gọi trim trên giá trị có thể undefined/không phải string
    const wardOk = typeof roomAddress.ward === 'string' && roomAddress.ward.trim().length > 0;
    const cityOk = typeof roomAddress.city === 'string' && roomAddress.city.trim().length > 0;
    const provinceOk = typeof roomAddress.provinceCode === 'string' && roomAddress.provinceCode.trim().length > 0;
    if (!wardOk || !cityOk || !provinceOk) {
      showToast('error', 'Vui lòng chọn địa chỉ phòng');
      return false;
    }
    if (!roomArea || Number(roomArea) <= 0) {
      showToast('error', 'Vui lòng nhập diện tích phòng hợp lệ');
      return false;
    }
    if (!roomPrice || Number(roomPrice) <= 0) {
      showToast('error', 'Vui lòng nhập giá thuê phòng hợp lệ');
      return false;
    }
    if (!roomDescription.trim()) {
      showToast('error', 'Vui lòng nhập mô tả phòng');
      return false;
    }
    if (!ageRangeMin || !ageRangeMax || Number(ageRangeMin) >= Number(ageRangeMax)) {
      showToast('error', 'Vui lòng nhập khoảng tuổi hợp lệ');
      return false;
    }
    if (!preferredGender) {
      showToast('error', 'Vui lòng chọn giới tính mong muốn');
      return false;
    }
    if (!maxPrice || Number(maxPrice) <= 0) {
      showToast('error', 'Vui lòng nhập giá tối đa sẵn sàng chi trả');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showToast('error', 'Vui lòng đăng nhập để đăng tin');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setToast({ type: '', text: '' });

    try {
      // Upload images
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadFiles(images.map((i) => i.file), user.userId, 'images');
        
        // Move cover image to front
        if (coverImageId && images.length > 0) {
          const coverIndex = images.findIndex(img => img.id === coverImageId);
          if (coverIndex !== -1 && coverIndex < imageUrls.length) {
            const coverImage = imageUrls[coverIndex];
            imageUrls = [coverImage, ...imageUrls.filter((_, i) => i !== coverIndex)];
          }
        }
      }

      // Upload videos
      let videoUrls: string[] = [];
      if (videos.length > 0) {
        videoUrls = await uploadFiles(videos.map((v) => v.file), user.userId, 'videos');
      }

      // Prepare data
      const postData = {
        userId: user.userId, // Keep as number, not string
        title: title.trim(),
        description: description.trim(),
        images: imageUrls,
        video: videoUrls[0] || undefined,
        currentRoom: {
          address: roomAddress,
          price: Number(roomPrice),
          area: Number(roomArea),
          description: roomDescription.trim(),
          roomType: (roomType as 'single' | 'double' | 'shared') || undefined,
          currentOccupants: currentOccupants ? Number(currentOccupants) : undefined,
          remainingDuration: (remainingDuration as '1-3 months' | '3-6 months' | '6-12 months' | 'over_1_year') || undefined,
          shareMethod: (shareMethod as 'split_evenly' | 'by_usage') || undefined,
          estimatedMonthlyUtilities: estimatedMonthlyUtilities ? Number(estimatedMonthlyUtilities) : undefined,
          capIncludedAmount: capIncludedAmount ? Number(capIncludedAmount) : undefined,
          electricityPricePerKwh: electricityPricePerKwh ? Number(electricityPricePerKwh) : undefined,
          waterPrice: waterPrice ? Number(waterPrice) : undefined,
          waterBillingType: (waterBillingType as 'per_m3' | 'per_person') || undefined,
          internetFee: internetFee ? Number(internetFee) : undefined,
          garbageFee: garbageFee ? Number(garbageFee) : undefined,
          cleaningFee: cleaningFee ? Number(cleaningFee) : undefined,
        },
        personalInfo: {
          fullName: fullName.trim(),
          age: Number(age),
          gender: gender as 'male' | 'female' | 'other',
          occupation: occupation.trim(),
          hobbies: selectedHobbies,
          habits: selectedHabits,
          lifestyle: (lifestyle as 'early' | 'normal' | 'late') || undefined,
          cleanliness: (cleanliness as 'very_clean' | 'clean' | 'normal' | 'flexible') || undefined
        },
        requirements: {
          ageRange: [Number(ageRangeMin), Number(ageRangeMax)] as [number, number],
          gender: preferredGender as 'male' | 'female' | 'any',
          traits: selectedTraits,
          maxPrice: Number(maxPrice)
        },
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        status: 'active' as 'active' | 'inactive'
      };

      // Create post
      const response = await createRoommatePost(postData);
      
      showToast('success', 'Đăng tin thành công! Chuyển hướng đến trang quản lý tin đăng...');
      setTimeout(() => {
        router.push('/my-posts');
      }, 2000);

    } catch (err: any) {
      showToast('error', 'Có lỗi xảy ra khi đăng tin. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-6">
      {toast.type && (
        <div
          className={`fixed top-10 right-4 z-[100] rounded-lg px-4 py-3 shadow ${
            toast.type === "success" ? "bg-amber-400" : "bg-rose-600"
          } text-white`}
        >
          {toast.text}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <form onSubmit={handleSubmit}>

      {/* Hình ảnh và video */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Hình ảnh và video</h2>
          <a href="#" className="text-blue-600 hover:text-blue-700 text-sm">
            Xem thêm về quy định đăng tin
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload hình ảnh */}
          <MediaPickerPanel
            pillText="Hình ảnh hợp lệ"
            helper="Tối đa 12 ảnh"
            accept="image/*"
            max={12}
            value={images}
            onChange={setImages}
            coverLocalId={coverImageId || undefined}
            onSetCoverLocal={setCoverImageId}
            guideTitle="Hướng dẫn đăng ảnh"
            guideItems={[
              "Tối đa 12 ảnh",
              "Ảnh rõ nét, không mờ/nhòe",
              "Không sử dụng ảnh có bản quyền",
              "Ảnh bìa sẽ được ưu tiên hiển thị đầu tiên"
            ]}
          />

          {/* Upload video */}
          <MediaPickerPanel
            pillText="Video giới thiệu bản thân"
            helper="Tối đa 1 video"
            accept="video/*"
            max={1}
            value={videos}
            onChange={setVideos}
            guideTitle="Hướng dẫn đăng video"
            guideItems={[
              "Tối đa 1 video",
              "Video rõ nét, âm thanh rõ ràng",
              "Nội dung phù hợp, không vi phạm",
              "Độ dài khuyến nghị: 30-120 giây"
            ]}
          />
        </div>
      </div>

      {/* Thông tin cá nhân */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cá nhân</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
            <input
              type="text"
              placeholder="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tuổi *</label>
            <input
              type="number"
              placeholder="Tuổi"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="18"
              max="100"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính *</label>
            <select 
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nghề nghiệp *</label>
            <input
              type="text"
              placeholder="Nghề nghiệp"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Thông tin phòng hiện tại */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin phòng hiện tại</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ phòng hiện tại *</label>
            <button
              type="button"
              onClick={() => setAddrOpen(true)}
              className="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-between"
            >
              <span className={`${roomAddress.city && roomAddress.ward && roomAddress.provinceCode ? "text-gray-900" : "text-gray-500"} truncate pr-2`}>
                {roomAddress.city && roomAddress.ward && roomAddress.provinceCode
                  ? addressService.formatAddressForDisplay(roomAddress)
                  : "Chọn địa chỉ phòng"}
              </span>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Thời gian ở còn lại */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giá thuê phòng (VNĐ/tháng) *</label>
              <input
                type="number"
                placeholder="Giá thuê phòng (VNĐ/tháng)"
                value={roomPrice}
                onChange={(e) => setRoomPrice(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian ở còn lại</label>
              <select 
                value={remainingDuration}
                onChange={(e) => setRemainingDuration(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn thời gian</option>
                <option value="1-3 months">1-3 tháng</option>
                <option value="3-6 months">3-6 tháng</option>
                <option value="6-12 months">6-12 tháng</option>
                <option value="1-2 years">1-2 năm</option>
                <option value="2+ years">Trên 2 năm</option>
                <option value="indefinite">Không xác định</option>
              </select>
            </div>
          </div>

          {/* Chi phí & Dịch vụ phòng ở ghép */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cách chia tiền điện nước</label>
              <select value={shareMethod} onChange={(e)=>setShareMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">-- Chọn --</option>
                <option value="split_evenly">Chia đều</option>
                <option value="by_usage">Theo sử dụng</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ước tính chi phí/tháng (VNĐ)</label>
              <input type="number" value={estimatedMonthlyUtilities} onChange={(e)=>setEstimatedMonthlyUtilities(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mức bao gồm tối đa (VNĐ)</label>
              <input type="number" value={capIncludedAmount} onChange={(e)=>setCapIncludedAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giá điện (đ/kWh)</label>
              <input type="number" value={electricityPricePerKwh} onChange={(e)=>setElectricityPricePerKwh(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giá nước</label>
              <input type="number" value={waterPrice} onChange={(e)=>setWaterPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cách tính nước</label>
              <select value={waterBillingType} onChange={(e)=>setWaterBillingType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">-- Chọn --</option>
                <option value="per_m3">Theo m³</option>
                <option value="per_person">Theo đầu người</option>
              </select>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Internet (đ/tháng)</label>
              <input type="number" value={internetFee} onChange={(e)=>setInternetFee(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rác (đ/tháng)</label>
              <input type="number" value={garbageFee} onChange={(e)=>setGarbageFee(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vệ sinh (đ/tháng)</label>
              <input type="number" value={cleaningFee} onChange={(e)=>setCleaningFee(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diện tích phòng (m²) *</label>
              <input
                type="number"
                placeholder="Diện tích phòng"
                value={roomArea}
                onChange={(e) => setRoomArea(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại phòng</label>
              <select 
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn loại phòng</option>
                <option value="single">Phòng đơn</option>
                <option value="double">Phòng đôi</option>
                <option value="shared">Phòng 3-4 người</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số người hiện tại</label>
              <input
                type="number"
                placeholder="Số người hiện tại"
                value={currentOccupants}
                onChange={(e) => setCurrentOccupants(e.target.value)}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả phòng *</label>
            <textarea
              placeholder="Mô tả chi tiết về phòng, tiện nghi, không gian, và những điều đặc biệt..."
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
          </div>
        </div>
      </div>

      {/* Sở thích và thói quen */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sở thích và thói quen</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sở thích</label>
            <div className="flex flex-wrap gap-2">
              {['Đọc sách', 'Xem phim', 'Chơi game', 'Thể thao', 'Du lịch', 'Nấu ăn', 'Âm nhạc', 'Nghệ thuật'].map((hobby) => (
                <button
                  key={hobby}
                  type="button"
                  onClick={() => handleHobbyClick(hobby)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedHobbies.includes(hobby)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  {hobby}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thói quen</label>
            <div className="flex flex-wrap gap-2">
              {['Dậy sớm', 'Tập thể dục', 'Ngủ sớm', 'Đọc sách', 'Xem TV', 'Chơi game', 'Nấu ăn', 'Dọn dẹp'].map((habit) => (
                <button
                  key={habit}
                  type="button"
                  onClick={() => handleHabitClick(habit)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedHabits.includes(habit)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  {habit}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thói quen sinh hoạt</label>
              <select 
                value={lifestyle}
                onChange={(e) => setLifestyle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn thói quen sinh hoạt</option>
                <option value="early">Dậy sớm (5-7h)</option>
                <option value="normal">Bình thường (7-9h)</option>
                <option value="late">Dậy muộn (9h+)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ sạch sẽ</label>
              <select 
                value={cleanliness}
                onChange={(e) => setCleanliness(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn mức độ sạch sẽ</option>
                <option value="very_clean">Rất sạch sẽ</option>
                <option value="clean">Sạch sẽ</option>
                <option value="normal">Bình thường</option>
                <option value="flexible">Không quá khắt khe</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Yêu cầu về người ở ghép */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Yêu cầu về người ở ghép</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính mong muốn *</label>
              <select 
                value={preferredGender}
                onChange={(e) => setPreferredGender(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Chọn giới tính mong muốn</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="any">Không quan trọng</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giá tối đa sẵn sàng chi trả (VNĐ/tháng) *</label>
              <input
                type="number"
                placeholder="Giá tối đa sẵn sàng chi trả"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Độ tuổi mong muốn (từ) *</label>
              <input
                type="number"
                placeholder="Tuổi tối thiểu"
                value={ageRangeMin}
                onChange={(e) => setAgeRangeMin(e.target.value)}
                min="18"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Độ tuổi mong muốn (đến) *</label>
              <input
                type="number"
                placeholder="Tuổi tối đa"
                value={ageRangeMax}
                onChange={(e) => setAgeRangeMax(e.target.value)}
                min="18"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tính cách mong muốn</label>
            <div className="flex flex-wrap gap-2">
              {['Hòa đồng', 'Yên tĩnh', 'Năng động', 'Trách nhiệm', 'Sạch sẽ', 'Tôn trọng', 'Thân thiện', 'Độc lập'].map((trait) => (
                <button
                  key={trait}
                  type="button"
                  onClick={() => handleTraitClick(trait)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTraits.includes(trait)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tiêu đề và mô tả */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiêu đề và mô tả</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề bài đăng *</label>
            <input
              type="text"
              placeholder="Tiêu đề bài đăng"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {title.length}/60 kí tự
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết *</label>
            <textarea
              placeholder="Mô tả về bản thân, sở thích, thói quen và mong muốn tìm người ở ghép như thế nào..."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {description.length}/500 kí tự
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin liên hệ */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin liên hệ</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
            <input
              type="tel"
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" required />
            <span className="text-sm text-gray-600">Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật *</span>
          </label>
        </div>
      </div>

      {/* Nút đăng tin */}
      <div className="flex justify-center pt-6">
        <button 
          type="submit"
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
        >
          {loading ? 'Đang đăng tin...' : 'Đăng tin tìm người ở ghép'}
        </button>
        </div>
        </form>
      </div>

      {/* Modal địa chỉ */}
      <AddressModal
        open={addrOpen}
        onClose={() => setAddrOpen(false)}
        onSave={(a) => setRoomAddress(a || {
          street: '',
          ward: '',
          city: '',
          specificAddress: '',
          showSpecificAddress: false,
          provinceCode: '',
          provinceName: '',
          wardCode: '',
          wardName: '',
          additionalInfo: ''
        })}
        initial={roomAddress}
      />
    </div>
  );
}
