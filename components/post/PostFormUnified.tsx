"use client";

import React, { useState, useEffect } from "react";
import { PostType, CreatePostPayload, PersonalInfo, Requirements } from "@/types/Post";
import { RoomForPost } from "@/types/Post";
import { createPost } from "@/services/posts";
import { uploadFiles } from "@/utils/upload";
import { LocalMediaItem } from "../common/MediaPickerLocal";
import MediaPickerLocal from "../common/MediaPickerLocal";
import { extractApiErrorMessage } from "@/utils/api";
import { useNotification } from "@/hooks/useNotification";
import { addressService } from "@/services/address";

// Sử dụng RoomForPost type từ types/Post.ts

interface PostFormUnifiedProps {
  postType: PostType;
  selectedRoom: RoomForPost;
  onBack: () => void;
  onSuccess: () => void;
}

export default function PostFormUnified({ postType, selectedRoom, onBack, onSuccess }: PostFormUnifiedProps) {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState<Partial<CreatePostPayload>>({
    postType: postType,
    roomId: selectedRoom.roomId,
    title: "",
    description: "",
    images: [],
    videos: [],
    phone: "",
    email: "",
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
  });
  const [loading, setLoading] = useState(false);
  const [localImages, setLocalImages] = useState<LocalMediaItem[]>([]);
  const [localVideos, setLocalVideos] = useState<LocalMediaItem[]>([]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      postType: postType,
      roomId: selectedRoom.roomId,
      // Reset personalInfo/requirements if switching postType
      personalInfo: postType === "roommate" ? prev.personalInfo : undefined,
      requirements: postType === "roommate" ? prev.requirements : undefined,
    }));
  }, [postType, selectedRoom]);

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
    setLoading(true);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
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
      if (!formData.description?.trim()) {
        throw new Error('Vui lòng nhập mô tả bài đăng');
      }
      if (!formData.phone?.trim()) {
        throw new Error('Vui lòng nhập số điện thoại');
      }
      if (!formData.email?.trim()) {
        throw new Error('Vui lòng nhập email');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        throw new Error('Email không đúng định dạng');
      }

      // Validate roommate-specific required fields
      if (postType === "roommate") {
        if (!formData.personalInfo?.fullName?.trim()) {
          throw new Error('Vui lòng nhập họ và tên');
        }
        if (!formData.personalInfo?.age || formData.personalInfo.age <= 0) {
          throw new Error('Vui lòng nhập tuổi hợp lệ');
        }
        if (!formData.personalInfo?.gender) {
          throw new Error('Vui lòng chọn giới tính');
        }
        // Ensure dateOfBirth is calculated
        if (!formData.personalInfo?.dateOfBirth && formData.personalInfo?.age > 0) {
          const currentYear = new Date().getFullYear();
          const birthYear = currentYear - formData.personalInfo.age;
          formData.personalInfo.dateOfBirth = `${birthYear}-01-01T00:00:00.000Z`;
        }
      }

      let imageUrls: string[] = [];
      if (localImages.length > 0) {
        const imageFiles = localImages.map((item) => item.file);
        imageUrls = await uploadFiles(imageFiles, userId, 'images');
      }

      let videoUrls: string[] = [];
      if (localVideos.length > 0) {
        const videoFiles = localVideos.map((item) => item.file);
        videoUrls = await uploadFiles(videoFiles, userId, 'videos');
      }

      // Map postType to backend format
      const backendPostType = formData.postType === 'rent' ? 'cho-thue' : 'tim-o-ghep';
      
      const payload: CreatePostPayload = {
        postType: backendPostType as any, // Cast to satisfy TypeScript
        roomId: formData.roomId!,
        title: formData.title!.trim(),
        description: formData.description!.trim(),
        images: imageUrls,
        videos: videoUrls,
        phone: formData.phone!.trim(),
        email: formData.email!.trim(),
      };

      if (postType === "roommate") {
        // Ensure personalInfo is properly formatted
        if (formData.personalInfo) {
          // Calculate dateOfBirth if not already set
          let dateOfBirth = formData.personalInfo.dateOfBirth;
          if (!dateOfBirth && formData.personalInfo.age > 0) {
            const currentYear = new Date().getFullYear();
            const birthYear = currentYear - formData.personalInfo.age;
            dateOfBirth = `${birthYear}-01-01T00:00:00.000Z`;
          }

          payload.personalInfo = {
            fullName: formData.personalInfo.fullName?.trim() || "",
            age: Number(formData.personalInfo.age) || 0,
            dateOfBirth: dateOfBirth || `${new Date().getFullYear() - 25}-01-01T00:00:00.000Z`, // Default to 25 years old
            gender: formData.personalInfo.gender || "male",
            occupation: formData.personalInfo.occupation?.trim() || "",
            hobbies: Array.isArray(formData.personalInfo.hobbies) ? formData.personalInfo.hobbies : [],
            habits: Array.isArray(formData.personalInfo.habits) ? formData.personalInfo.habits : [],
            lifestyle: formData.personalInfo.lifestyle || "normal",
            cleanliness: formData.personalInfo.cleanliness || "normal"
          };
        }
        
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
      const cleanPayload = JSON.parse(JSON.stringify(payload, (key, value) => {
        if (value === null || value === undefined) {
          return undefined; // Remove null/undefined values
        }
        return value;
      }));


      await createPost(cleanPayload);
      showSuccess("Thành công", "Đăng bài thành công!");
      onSuccess();
    } catch (err: any) {
      const errorMessage = extractApiErrorMessage(err);
      showError("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const commonFormFields = (
    <>
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Tiêu đề bài đăng <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả chi tiết <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleInputChange}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          required
        ></textarea>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
        <MediaPickerLocal 
          mediaItems={localImages} 
          onMediaChange={setLocalImages} 
          accept="image/*" 
          max={10} 
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Video</label>
        <MediaPickerLocal 
          mediaItems={localVideos} 
          onMediaChange={setLocalVideos} 
          accept="video/*" 
          max={1} 
        />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin liên hệ</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone || ""}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ""}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            required
            placeholder="example@email.com"
          />
        </div>
      </div>
    </>
  );

  const roommateSpecificFields = (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin cá nhân của bạn</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.personalInfo?.fullName || ""}
            onChange={(e) => handlePersonalInfoChange("fullName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
            Tuổi <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.personalInfo?.age || ""}
            onChange={(e) => handlePersonalInfoChange("age", Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Giới tính <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.personalInfo?.gender || "any"}
            onChange={(e) => handlePersonalInfoChange("gender", e.target.value as "male" | "female" | "other")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            required
          >
            <option value="any">Không yêu cầu</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>
        <div>
          <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
            Nghề nghiệp
          </label>
          <input
            type="text"
            id="occupation"
            name="occupation"
            value={formData.personalInfo?.occupation || ""}
            onChange={(e) => handlePersonalInfoChange("occupation", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="hobbies" className="block text-sm font-medium text-gray-700 mb-1">
          Sở thích (chọn nhiều)
        </label>
        <select
          id="hobbies"
          name="hobbies"
          multiple
          value={formData.personalInfo?.hobbies || []}
          onChange={(e) =>
            handleMultiSelectChange(
              "hobbies",
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 h-24"
        >
          <option value="đọc sách">Đọc sách</option>
          <option value="xem phim">Xem phim</option>
          <option value="nghe nhạc">Nghe nhạc</option>
          <option value="chơi game">Chơi game</option>
          <option value="thể thao">Thể thao</option>
          <option value="nấu ăn">Nấu ăn</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="habits" className="block text-sm font-medium text-gray-700 mb-1">
          Thói quen (chọn nhiều)
        </label>
        <select
          id="habits"
          name="habits"
          multiple
          value={formData.personalInfo?.habits || []}
          onChange={(e) =>
            handleMultiSelectChange(
              "habits",
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 h-24"
        >
          <option value="dậy sớm">Dậy sớm</option>
          <option value="ngủ muộn">Ngủ muộn</option>
          <option value="tập thể dục">Tập thể dục</option>
          <option value="hút thuốc">Hút thuốc</option>
          <option value="uống rượu">Uống rượu</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="lifestyle" className="block text-sm font-medium text-gray-700 mb-1">
            Lối sống
          </label>
          <select
            id="lifestyle"
            name="lifestyle"
            value={formData.personalInfo?.lifestyle || "normal"}
            onChange={(e) => handlePersonalInfoChange("lifestyle", e.target.value as "early" | "normal" | "late")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="early">Dậy sớm</option>
            <option value="normal">Bình thường</option>
            <option value="late">Ngủ muộn</option>
          </select>
        </div>
        <div>
          <label htmlFor="cleanliness" className="block text-sm font-medium text-gray-700 mb-1">
            Mức độ sạch sẽ
          </label>
          <select
            id="cleanliness"
            name="cleanliness"
            value={formData.personalInfo?.cleanliness || "normal"}
            onChange={(e) => handlePersonalInfoChange("cleanliness", e.target.value as "very_clean" | "clean" | "normal" | "flexible")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="very_clean">Rất sạch sẽ</option>
            <option value="clean">Sạch sẽ</option>
            <option value="normal">Bình thường</option>
            <option value="flexible">Linh hoạt</option>
          </select>
        </div>
      </div>

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
        <p className="text-blue-700 text-sm font-medium">
          Bạn đang đăng bài cho phòng:{" "}
          <span className="font-semibold">Phòng {selectedRoom.roomNumber}</span> tại{" "}
          <span className="font-semibold">
            {selectedRoom.buildingName ? `${selectedRoom.buildingName} - ` : ''}
            {selectedRoom.address ? `${selectedRoom.address.street}, ${selectedRoom.address.ward}, ${selectedRoom.address.city}` : 'Địa chỉ không xác định'}
          </span>
        </p>
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