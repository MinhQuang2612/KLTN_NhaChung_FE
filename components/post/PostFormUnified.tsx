"use client";

import React, { useState, useEffect } from "react";
import { PostType, CreatePostPayload, PersonalInfo, Requirements } from "@/types/Post";
import { RoomForPost } from "@/types/Post";
import { createPost } from "@/services/posts";
// Removed unused imports for media upload
import { extractApiErrorMessage } from "@/utils/api";
import { useNotification } from "@/hooks/useNotification";
import { addressService } from "@/services/address";
import { getMyProfile } from "@/services/userProfiles";
import { useAuth } from "@/contexts/AuthContext";

// Sử dụng RoomForPost type từ types/Post.ts

interface PostFormUnifiedProps {
  postType: PostType;
  selectedRoom: RoomForPost;
  onBack: () => void;
  onSuccess: () => void;
}

export default function PostFormUnified({ postType, selectedRoom, onBack, onSuccess }: PostFormUnifiedProps) {
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<CreatePostPayload>>({
    postType: postType,
    roomId: selectedRoom.roomId,
    title: "",
    // Chỉ khởi tạo personalInfo và requirements cho "tìm ở ghép"
    ...(postType === 'roommate' && {
      personalInfo: {
        fullName: "",
        age: 0,
        dateOfBirth: "",
        gender: "male",
        occupation: "",
        hobbies: [],
        habits: [],
        lifestyle: "normal",
        cleanliness: "normal",
      },
      requirements: {
        ageRange: [0, 0],
        gender: "male",
        traits: [],
        maxPrice: 0,
      },
    }),
  });
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      postType: postType,
      roomId: selectedRoom.roomId,
      // Reset personalInfo/requirements if switching postType
      personalInfo: postType === "roommate" ? (prev.personalInfo || {
        fullName: "",
        age: 0,
        dateOfBirth: "",
        gender: "male",
        occupation: "",
        hobbies: [],
        habits: [],
        lifestyle: "normal",
        cleanliness: "normal",
      }) : undefined,
      requirements: postType === "roommate" ? (prev.requirements || {
        ageRange: [0, 0],
        gender: "male",
        traits: [],
        maxPrice: 0,
      }) : undefined,
    }));
  }, [postType, selectedRoom]);

  // Load user profile để tự điền personalInfo cho bài đăng ở ghép
  useEffect(() => {
    (async () => {
      try {
        if (postType === 'roommate') {
          const pf = await getMyProfile();
          setProfile(pf as any);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      }
    })();
  }, [postType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handlePersonalInfoChange = (name: keyof PersonalInfo, value: any) => {
    setFormData((prev) => {
      const newPersonalInfo = {
        ...prev.personalInfo,
        [name]: value,
      } as PersonalInfo;

      // Calculate dateOfBirth when age changes
      if (name === 'age' && typeof value === 'number' && value > 0) {
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - value;
        const dateOfBirth = `${birthYear}-01-01T00:00:00.000Z`; // ISO 8601 format
        newPersonalInfo.dateOfBirth = dateOfBirth;
      }

      return {
        ...prev,
        personalInfo: newPersonalInfo,
      };
    });
  };

  const handleRequirementsChange = (name: keyof Requirements, value: any) => {
    setFormData((prev) => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [name]: value,
      } as Requirements,
    }));
  };

  const handleAgeRangeChange = (index: 0 | 1, value: string) => {
    const newAgeRange = [...(formData.requirements?.ageRange || [0, 0])] as [number, number];
    newAgeRange[index] = Number(value);
    handleRequirementsChange("ageRange", newAgeRange);
  };

  const handleMultiSelectChange = (name: "hobbies" | "habits" | "traits", value: string[]) => {
    if (name === "hobbies" || name === "habits") {
      handlePersonalInfoChange(name, value);
    } else if (name === "traits") {
      handleRequirementsChange(name, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Không chặn nếu thiếu email/phone; sẽ cố gắng lấy từ profile hoặc bỏ qua
    setLoading(true);
    
    try {
      const userId = user?.userId;
      if (!userId) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      

      // Validate roomId
      if (!formData.roomId || formData.roomId <= 0) {
        throw new Error('Vui lòng chọn phòng hợp lệ');
      }

      // Validate required fields
      if (!formData.title?.trim()) {
        throw new Error('Vui lòng nhập tiêu đề bài đăng');
      }

      // Roommate: không yêu cầu nhập thông tin cá nhân thủ công

      // Không cần upload media vì sử dụng từ room

      // Map postType to backend format
      const backendPostType = formData.postType === 'rent' ? 'cho-thue' : 'tim-o-ghep';
      
      // Sử dụng thông tin từ room và user thay vì form
      const payload: CreatePostPayload = {
        postType: backendPostType as any, // Cast to satisfy TypeScript
        roomId: formData.roomId!,
        title: formData.title!.trim(),
        description: selectedRoom.description || '', // Lấy mô tả từ room
        images: selectedRoom.images || [], // Lấy hình ảnh từ room
        videos: selectedRoom.videos || [], // Lấy video từ room
        // Liên hệ: ưu tiên user, fallback profile, nếu không có thì để undefined để BE xử lý
        phone: (user as any)?.phone || (profile as any)?.phone || undefined,
        email: (user as any)?.email || (profile as any)?.email || undefined,
        userId: userId,
      };

      if (postType === "roommate") {
        // Tự động lấy personalInfo từ user + profile
        const fullName = (user as any)?.fullName || (profile as any)?.fullName || (user as any)?.name || "";
        const gender = (profile as any)?.gender || (user as any)?.gender || "any";
        const occupation = (profile as any)?.occupation || "";
        const lifestyle = (profile as any)?.lifestyle || "normal";
        const cleanliness = (profile as any)?.cleanliness || "normal";
        const hobbies = Array.isArray((profile as any)?.hobbies) ? (profile as any).hobbies : [];
        const habits = Array.isArray((profile as any)?.habits) ? (profile as any).habits : [];
        // Chuẩn hóa dateOfBirth ISO 8601
        const pfDob = (profile as any)?.dateOfBirth;
        const pfAge = (profile as any)?.age;
        let dateOfBirthISO: string;
        try {
          if (pfDob) {
            dateOfBirthISO = new Date(pfDob).toISOString();
          } else if (typeof pfAge === 'number' && pfAge > 0) {
            const year = new Date().getFullYear() - pfAge;
            dateOfBirthISO = new Date(Date.UTC(year, 0, 1, 0, 0, 0)).toISOString();
          } else if ((user as any)?.dateOfBirth) {
            dateOfBirthISO = new Date((user as any).dateOfBirth).toISOString();
          } else {
            const defaultYear = new Date().getFullYear() - 25;
            dateOfBirthISO = new Date(Date.UTC(defaultYear, 0, 1, 0, 0, 0)).toISOString();
          }
        } catch {
          const defaultYear = new Date().getFullYear() - 25;
          dateOfBirthISO = new Date(Date.UTC(defaultYear, 0, 1, 0, 0, 0)).toISOString();
        }

        payload.personalInfo = {
          fullName,
          age: (profile as any)?.age || 0,
          dateOfBirth: dateOfBirthISO,
          gender,
          occupation,
          hobbies,
          habits,
          lifestyle,
          cleanliness,
        } as any;

        // Ensure requirements is properly formatted
        if (formData.requirements) {
          payload.requirements = {
            ageRange: Array.isArray(formData.requirements.ageRange) ? formData.requirements.ageRange : [0, 0],
            gender: formData.requirements.gender || "any",
            traits: Array.isArray(formData.requirements.traits) ? formData.requirements.traits : [],
            maxPrice: Number(formData.requirements.maxPrice) || 0
          };
        }
      }

      // Clean up payload - remove undefined/null values
      const cleanPayload = { ...payload } as any;
      
      // Remove null/undefined values
      Object.keys(cleanPayload).forEach(key => {
        if (cleanPayload[key] === null || cleanPayload[key] === undefined) {
          delete cleanPayload[key];
        }
      });

      // Remove fields undefined/null and userId to let BE infer from JWT
      delete (cleanPayload as any).userId;

      // Remove personalInfo and requirements for rent posts
      if (postType === 'rent') {
        delete cleanPayload.personalInfo;
        delete cleanPayload.requirements;
      }

      
      const result = await createPost(cleanPayload);
      
      const statusText = (result as any)?.status === 'active' 
        ? 'Bài đăng đã được duyệt và hiển thị.' 
        : 'Bài đăng đã gửi và đang chờ admin duyệt.';
      showSuccess("Thành công", statusText);
      
      // Phát tín hiệu toàn cục để các trang/listen reload
      try { if (typeof window !== 'undefined') window.dispatchEvent(new Event('posts:changed')); } catch {}

      // Delay onSuccess to ensure toast is visible
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      const errorMessage = extractApiErrorMessage(err);
      showError("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const commonFormFields = (
    <>
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Tiêu đề bài đăng <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title || ""}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-lg"
          placeholder="Ví dụ: Cho thuê phòng trọ giá rẻ, gần trường học"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Hình ảnh, mô tả chi tiết và thông tin liên hệ sẽ được lấy từ thông tin phòng đã có
        </p>
      </div>
    </>
  );

  const roommateSpecificFields = (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Yêu cầu đối với người ở ghép</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="ageRangeMin" className="block text-sm font-medium text-gray-700 mb-1">
            Độ tuổi từ
          </label>
          <input
            type="number"
            id="ageRangeMin"
            name="ageRangeMin"
            value={formData.requirements?.ageRange?.[0] || ""}
            onChange={(e) => handleAgeRangeChange(0, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label htmlFor="ageRangeMax" className="block text-sm font-medium text-gray-700 mb-1">
            Đến
          </label>
          <input
            type="number"
            id="ageRangeMax"
            name="ageRangeMax"
            value={formData.requirements?.ageRange?.[1] || ""}
            onChange={(e) => handleAgeRangeChange(1, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label htmlFor="preferredGender" className="block text-sm font-medium text-gray-700 mb-1">
            Giới tính ưu tiên
          </label>
          <select
            id="preferredGender"
            name="preferredGender"
            value={formData.requirements?.gender || "any"}
            onChange={(e) => handleRequirementsChange("gender", e.target.value as "male" | "female" | "any")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="any">Không yêu cầu</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Giá thuê tối đa (đ/tháng)
          </label>
          <input
            type="number"
            id="maxPrice"
            name="maxPrice"
            value={formData.requirements?.maxPrice || ""}
            onChange={(e) => handleRequirementsChange("maxPrice", Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="traits" className="block text-sm font-medium text-gray-700 mb-1">
          Đặc điểm mong muốn (chọn nhiều)
        </label>
        <select
          id="traits"
          name="traits"
          multiple
          value={formData.requirements?.traits || []}
          onChange={(e) =>
            handleMultiSelectChange(
              "traits",
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 h-24"
        >
          <option value="sạch sẽ">Sạch sẽ</option>
          <option value="yên tĩnh">Yên tĩnh</option>
          <option value="hòa đồng">Hòa đồng</option>
          <option value="ít nói">Ít nói</option>
          <option value="thân thiện">Thân thiện</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Quay lại"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
          Đăng bài {postType === "rent" ? "cho thuê" : "tìm ở ghép"}
        </h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-blue-700 text-sm font-medium mb-1">
              Bạn đang đăng bài cho phòng: <span className="font-semibold">Phòng {selectedRoom.roomNumber}</span>
            </p>
            <p className="text-blue-600 text-sm">
              Tại: {selectedRoom.buildingName ? `${selectedRoom.buildingName} - ` : ''}
              {selectedRoom.address ? `${selectedRoom.address.street}, ${selectedRoom.address.ward}, ${selectedRoom.address.city}` : 'Địa chỉ không xác định'}
            </p>
            <p className="text-blue-600 text-xs mt-1">
              Hình ảnh, mô tả, thông tin liên hệ và tất cả thông tin chi tiết sẽ được lấy từ thông tin phòng đã có
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {commonFormFields}
        {postType === "roommate" && roommateSpecificFields}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Quay lại
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang đăng...
              </div>
            ) : (
              "Đăng bài"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}