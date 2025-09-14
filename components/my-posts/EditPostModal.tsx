"use client";

import { useState, useEffect } from "react";
import { updateRentPost } from "../../services/rentPosts";
import { updateRoommatePost } from "../../services/roommatePosts";
import { uploadFiles } from "../../utils/upload";
import { AgeUtils } from "../../utils/ageUtils";
import type { Category } from "../../types/RentPostApi";
import type { LocalMediaItem } from "../common/MediaPickerLocal";
import EditFormRenderer from "./EditFormRenderer";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
  onSuccess: () => void;
}

export default function EditPostModal({ isOpen, onClose, post, onSuccess }: EditPostModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean } | null>(null);

  // Initialize form data when post changes
  useEffect(() => {
    if (post) {
      const category = post.category as Category;
      
      // Xác định roommate: kiểm tra category trực tiếp
      let isRoommatePost = String(category || '').toLowerCase() === 'roommate';
      
      // Fallback: nếu category không đúng, thử detect bằng structure
      if (!isRoommatePost) {
        isRoommatePost = 'currentRoom' in post && 'personalInfo' in post;
      }
      
      // Common fields
      let data: any = {
        title: post.title || '',
        description: post.description || '',
        category: category
      };

      // Initialize based on category or detected type
      if (isRoommatePost) {
        
        // Roommate posts have different structure - match RoommateForm fields
        data = {
          ...data,
          images: [], // file uploads mới (MediaPickerLocal chỉ nhận LocalMediaItem)
          coverImageUrl: Array.isArray(post.images) && post.images.length ? post.images[0] : '',
          coverLocalId: '',
          existingImages: Array.isArray(post.images) ? post.images : [],
          videos: [], // file uploads mới
          existingVideos: post.video ? [post.video] : [],
          // Personal info
          fullName: post.personalInfo?.fullName || '',
          dateOfBirth: post.personalInfo?.dateOfBirth || '',
          gender: post.personalInfo?.gender || '',
          occupation: post.personalInfo?.occupation || '',
          selectedHobbies: Array.isArray(post.personalInfo?.hobbies) ? post.personalInfo.hobbies : 
                          (typeof post.personalInfo?.hobbies === 'string' ? [post.personalInfo.hobbies] : []),
          selectedHabits: Array.isArray(post.personalInfo?.habits) ? post.personalInfo.habits : 
                         (typeof post.personalInfo?.habits === 'string' ? [post.personalInfo.habits] : []),
          lifestyle: post.personalInfo?.lifestyle || '',
          cleanliness: post.personalInfo?.cleanliness || '',

          // Current room info
          roomAddress: typeof post.currentRoom?.address === 'object' && post.currentRoom?.address 
            ? post.currentRoom.address 
            : {
                street: '',
                ward: '',
                district: '',
                city: '',
                houseNumber: '',
                showHouseNumber: false
              },
          roomPrice: post.currentRoom?.price || 0,
          roomArea: post.currentRoom?.area || 0,
          roomDescription: post.currentRoom?.description || '',
          roomType: post.currentRoom?.roomType || '',
          currentOccupants: post.currentRoom?.currentOccupants || 0,
          remainingDuration: post.currentRoom?.remainingDuration || '',

          // Utilities (Roommate currentRoom)
          shareMethod: post.currentRoom?.shareMethod || '',
          estimatedMonthlyUtilities: post.currentRoom?.estimatedMonthlyUtilities || 0,
          capIncludedAmount: post.currentRoom?.capIncludedAmount || 0,
          electricityPricePerKwh: post.currentRoom?.electricityPricePerKwh || 0,
          waterPrice: post.currentRoom?.waterPrice || 0,
          waterBillingType: post.currentRoom?.waterBillingType || '',
          internetFee: post.currentRoom?.internetFee || 0,
          garbageFee: post.currentRoom?.garbageFee || 0,
          cleaningFee: post.currentRoom?.cleaningFee || 0,

          // Requirements
          ageRangeMin: Array.isArray(post.requirements?.ageRange) && post.requirements.ageRange.length > 0 ? post.requirements.ageRange[0] : 0,
          ageRangeMax: Array.isArray(post.requirements?.ageRange) && post.requirements.ageRange.length > 1 ? post.requirements.ageRange[1] : 0,
          preferredGender: post.requirements?.gender || '',
          selectedTraits: Array.isArray(post.requirements?.traits) ? post.requirements.traits : 
                         (typeof post.requirements?.traits === 'string' ? [post.requirements.traits] : []),
          maxPrice: post.requirements?.maxPrice || 0,

          // Contact
          phone: post.phone || '',
          email: post.email || ''
        };
      } else {
        switch (category) {
        case 'phong-tro':
          data = {
            ...data,
            furniture: (post.furniture ?? post.basicInfo?.furniture) || '',
            area: (post.area ?? post.basicInfo?.area) || 0,
            price: (post.price ?? post.basicInfo?.price) || 0,
            deposit: (post.deposit ?? post.basicInfo?.deposit) || 0,
            address: post.address || null,
            utilities: post.utilities || {},
            existingImages: Array.isArray(post.images) ? post.images : [],
            coverImageUrl: Array.isArray(post.images) && post.images.length ? post.images[0] : '',
            coverLocalId: '',
            images: [],
            existingVideos: Array.isArray(post.videos) ? post.videos : [],
            videos: []
          };
          break;

        case 'chung-cu':
          data = {
            ...data,
            buildingName: (post.buildingInfo?.buildingName ?? post.chungCuInfo?.buildingName) || '',
            blockOrTower: (post.buildingInfo?.blockOrTower ?? post.chungCuInfo?.blockOrTower) || '',
            floorNumber: (post.buildingInfo?.floorNumber ?? post.chungCuInfo?.floorNumber) || 0,
            unitCode: (post.buildingInfo?.unitCode ?? post.chungCuInfo?.unitCode) || '',
            propertyType: (post.propertyType ?? post.buildingInfo?.propertyType ?? post.chungCuInfo?.propertyType) || '',
            bedrooms: (post.bedrooms ?? post.basicInfo?.bedrooms) || 0,
            bathrooms: (post.bathrooms ?? post.basicInfo?.bathrooms) || 0,
            direction: (post.direction ?? post.basicInfo?.direction) || '',
            furniture: (post.furniture ?? post.basicInfo?.furniture) || '',
            legalStatus: (post.legalStatus ?? post.basicInfo?.legalStatus) || '',
            area: (post.area ?? post.basicInfo?.area) || 0,
            price: (post.price ?? post.basicInfo?.price) || 0,
            deposit: (post.deposit ?? post.basicInfo?.deposit) || 0,
            address: post.address || null,
            utilities: post.utilities || {},
            existingImages: Array.isArray(post.images) ? post.images : [],
            coverImageUrl: Array.isArray(post.images) && post.images.length ? post.images[0] : '',
            coverLocalId: '',
            images: [],
            existingVideos: Array.isArray(post.videos) ? post.videos : [],
            videos: []
          };
          break;

        case 'nha-nguyen-can':
          data = {
            ...data,
            khuLo: (post.propertyInfo?.khuLo ?? post.nhaNguyenCanInfo?.khuLo) || '',
            unitCode: (post.propertyInfo?.unitCode ?? post.nhaNguyenCanInfo?.unitCode) || '',
            propertyType: (post.propertyInfo?.propertyType ?? post.nhaNguyenCanInfo?.propertyType) || '',
            bedrooms: (post.bedrooms ?? post.basicInfo?.bedrooms) || 0,
            bathrooms: (post.bathrooms ?? post.basicInfo?.bathrooms) || 0,
            direction: (post.direction ?? post.basicInfo?.direction) || '',
            totalFloors: (post.propertyInfo?.totalFloors ?? post.nhaNguyenCanInfo?.totalFloors) || 0,
            furniture: (post.furniture ?? post.basicInfo?.furniture) || '',
            legalStatus: (post.legalStatus ?? post.basicInfo?.legalStatus) || '',
            landArea: (post.propertyInfo?.landArea ?? post.nhaNguyenCanInfo?.landArea) || 0,
            usableArea: (post.propertyInfo?.usableArea ?? post.nhaNguyenCanInfo?.usableArea) || 0,
            width: (post.propertyInfo?.width ?? post.nhaNguyenCanInfo?.width) || 0,
            length: (post.propertyInfo?.length ?? post.nhaNguyenCanInfo?.length) || 0,
            price: (post.price ?? post.basicInfo?.price) || 0,
            deposit: (post.deposit ?? post.basicInfo?.deposit) || 0,
            features: Array.isArray(post.propertyInfo?.features) ? post.propertyInfo.features : (Array.isArray(post.nhaNguyenCanInfo?.features) ? post.nhaNguyenCanInfo.features : []),
            address: post.address || null,
            utilities: post.utilities || {},
            existingImages: Array.isArray(post.images) ? post.images : [],
            coverImageUrl: Array.isArray(post.images) && post.images.length ? post.images[0] : '',
            coverLocalId: '',
            images: [],
            existingVideos: Array.isArray(post.videos) ? post.videos : [],
            videos: []
          };
          break;

        default:
          // Fallback to basic info
          data = {
            ...data,
          area: post.basicInfo?.area || 0,
          price: post.basicInfo?.price || 0,
          deposit: post.basicInfo?.deposit || 0,
          furniture: post.basicInfo?.furniture || '',
          bedrooms: post.basicInfo?.bedrooms || 0,
          bathrooms: post.basicInfo?.bathrooms || 0,
          direction: post.basicInfo?.direction || '',
            address: post.address || null
          };
        }
      }

      setFormData(data);
    }
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const category = post?.category as Category;
    
    // Determine roommate by category
    let isRoommateByCat = String(category || '').toLowerCase() === 'roommate';
    
    // Fallback: nếu category không đúng, thử detect bằng structure
    if (!isRoommateByCat) {
      isRoommateByCat = 'currentRoom' in post && 'personalInfo' in post;
    }

    // Validate required IDs (show error instead of silent return)
    if (isRoommateByCat) {
      if (!post?.roommatePostId && !post?.postId) {
        setError('Không tìm thấy ID bài roommate để cập nhật.');
        return;
      }
    } else {
      if (!post?.rentPostId) {
        setError('Không tìm thấy ID bài thuê để cập nhật.');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Xác định roommate: sử dụng logic đã detect ở trên
      const isRoommatePost = isRoommateByCat;

      // Làm sạch utilities: bỏ unit rỗng/không hợp lệ để tránh 400
      const sanitizeUtilities = (u: any) => {
        if (!u || typeof u !== 'object') return undefined;
        const allowedManagementUnits = ['per_month', 'per_m2_per_month'];
        const allowedWaterUnits = ['per_m3', 'per_person'];
        const result: any = {};

        const maybeAssignNumber = (key: string) => {
          const v = u[key];
          if (v === undefined || v === null || v === '') return;
          const num = typeof v === 'number' ? v : Number(v);
          if (!Number.isNaN(num)) result[key] = num;
        };

        // numeric fields
        [
          'electricityPricePerKwh','waterPrice','internetFee','garbageFee','cleaningFee',
          'parkingMotorbikeFee','parkingCarFee','managementFee','gardeningFee','cookingGasFee'
        ].forEach(maybeAssignNumber);

        // unit fields
        if (u.waterBillingType && allowedWaterUnits.includes(String(u.waterBillingType))) {
          result.waterBillingType = String(u.waterBillingType);
        }
        if (u.managementFeeUnit && allowedManagementUnits.includes(String(u.managementFeeUnit))) {
          result.managementFeeUnit = String(u.managementFeeUnit);
        }

        // includedInRent (nếu có object hợp lệ)
        if (u.includedInRent && typeof u.includedInRent === 'object') {
          result.includedInRent = { ...u.includedInRent };
        }

        return Object.keys(result).length ? result : undefined;
      };

      const cleanedUtilities = sanitizeUtilities(formData.utilities);

      // Construct payload based on category
      let payload: any = {
        title: formData.title,
        description: formData.description
      };

      // Handle roommate posts separately
      if (isRoommatePost) {
        // Upload images for roommate
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?.userId;

        if (!userId) {
          throw new Error('Không tìm thấy thông tin người dùng');
        }

        let imageUrls: string[] = [];
        if (formData.images && formData.images.length > 0) {
          const imageFiles = formData.images.map((item: LocalMediaItem) => item.file);
          imageUrls = await uploadFiles(imageFiles, userId, 'images');
        }

        let videoUrls: string[] = [];
        if (formData.videos && formData.videos.length > 0) {
          const videoFiles = formData.videos.map((item: LocalMediaItem) => item.file);
          videoUrls = await uploadFiles(videoFiles, userId, 'videos');
        }

        // Combine existing videos with new videos
        const allVideoUrls = [
          ...(formData.existingVideos || []),
          ...videoUrls
        ];

        // Partial update per API guide: send only fields with values
        const rmPayload: any = {};
        if (formData.title && formData.title.trim()) rmPayload.title = formData.title.trim();
        if (formData.description && formData.description.trim()) rmPayload.description = formData.description.trim();
        if (imageUrls.length) rmPayload.images = imageUrls;
        // Always send video field - empty array if no videos
        rmPayload.video = allVideoUrls.length > 0 ? allVideoUrls[0] : null;

        // Map personalInfo only if has required fields
        const gender = formData.gender as 'male' | 'female' | 'other';
        if (formData.dateOfBirth && AgeUtils.isAdult(formData.dateOfBirth) && gender) {
          rmPayload.personalInfo = {
            fullName: formData.fullName || '',
            dateOfBirth: formData.dateOfBirth,
            gender: gender,
            occupation: formData.occupation || '',
            hobbies: Array.isArray(formData.selectedHobbies) ? formData.selectedHobbies : [],
            habits: Array.isArray(formData.selectedHabits) ? formData.selectedHabits : [],
            ...(formData.lifestyle ? { lifestyle: formData.lifestyle } : {}),
            ...(formData.cleanliness ? { cleanliness: formData.cleanliness } : {}),
          };
        }

        // Map currentRoom
        if (formData.roomAddress || formData.roomPrice || formData.roomArea || formData.roomDescription ||
            formData.shareMethod || formData.estimatedMonthlyUtilities || formData.capIncludedAmount ||
            formData.electricityPricePerKwh || formData.waterPrice || formData.waterBillingType ||
            formData.internetFee || formData.garbageFee || formData.cleaningFee) {
          rmPayload.currentRoom = {
            address: formData.roomAddress || {
              street: '',
              ward: '',
              district: '',
              city: '',
              houseNumber: '',
              showHouseNumber: false
            },
            price: Number(formData.roomPrice) || 0,
            area: Number(formData.roomArea) || 0,
            description: formData.roomDescription || '',
            ...(formData.roomType ? { roomType: formData.roomType } : {}),
            ...(formData.currentOccupants ? { currentOccupants: Number(formData.currentOccupants) } : {}),
            ...(formData.remainingDuration ? { remainingDuration: formData.remainingDuration } : {}),
            ...(formData.shareMethod ? { shareMethod: formData.shareMethod } : {}),
            ...(Number(formData.estimatedMonthlyUtilities) ? { estimatedMonthlyUtilities: Number(formData.estimatedMonthlyUtilities) } : {}),
            ...(Number(formData.capIncludedAmount) ? { capIncludedAmount: Number(formData.capIncludedAmount) } : {}),
            ...(Number(formData.electricityPricePerKwh) ? { electricityPricePerKwh: Number(formData.electricityPricePerKwh) } : {}),
            ...(Number(formData.waterPrice) ? { waterPrice: Number(formData.waterPrice) } : {}),
            ...(formData.waterBillingType ? { waterBillingType: formData.waterBillingType } : {}),
            ...(Number(formData.internetFee) ? { internetFee: Number(formData.internetFee) } : {}),
            ...(Number(formData.garbageFee) ? { garbageFee: Number(formData.garbageFee) } : {}),
            ...(Number(formData.cleaningFee) ? { cleaningFee: Number(formData.cleaningFee) } : {}),
          };
        }

        // Map requirements if parseable
        const mapReqGender = (val: string): 'male' | 'female' | 'any' | undefined => {
          const g = (val || '').toLowerCase();
          if (g === 'any' || g.includes('không')) return 'any';
          if (g === 'male' || g.includes('nam')) return 'male';
          if (g === 'female' || g.includes('nữ') || g.includes('nu')) return 'female';
          return undefined;
        };
        
        let ageRange: [number, number] | undefined;
        const ageMin = Number(formData.ageRangeMin);
        const ageMax = Number(formData.ageRangeMax);
        if (ageMin && ageMax && ageMin < ageMax) {
          ageRange = [ageMin, ageMax];
        }
        
        const reqGender = mapReqGender(formData.preferredGender || '');
        const maxPrice = Number(formData.maxPrice) || undefined;
        const traits = Array.isArray(formData.selectedTraits) ? formData.selectedTraits : [];
        const requirements: any = {};
        if (ageRange) requirements.ageRange = ageRange;
        if (reqGender) requirements.gender = reqGender;
        if (traits.length) requirements.traits = traits;
        if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice) && maxPrice > 0) requirements.maxPrice = maxPrice;
        if (Object.keys(requirements).length) {
          rmPayload.requirements = requirements;
        }

        // Map contact info
        if (formData.phone) rmPayload.phone = formData.phone;
        if (formData.email) rmPayload.email = formData.email;
        if (!Object.keys(rmPayload).length) {
          setError('Vui lòng thay đổi ít nhất 1 trường (tiêu đề/mô tả/ảnh hoặc thông tin khác)');
          setLoading(false);
          return;
        }
        payload = rmPayload;
      } else {
        // Handle file uploads for rent posts
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?.userId;

        if (!userId) {
          throw new Error('Không tìm thấy thông tin người dùng');
        }

        // Upload new images if any
        let imageUrls: string[] = [];
        if (formData.images && formData.images.length > 0) {
          const imageFiles = formData.images.map((item: LocalMediaItem) => item.file);
          imageUrls = await uploadFiles(imageFiles, userId, 'images');
        }

        // Upload new videos if any
        let videoUrls: string[] = [];
        if (formData.videos && formData.videos.length > 0) {
          const videoFiles = formData.videos.map((item: LocalMediaItem) => item.file);
          videoUrls = await uploadFiles(videoFiles, userId, 'videos');
        }

        // Combine existing videos with new videos
        const allVideoUrls = [
          ...(formData.existingVideos || []),
          ...videoUrls
        ];

        switch (category) {
        case 'phong-tro':
          payload = {
            ...payload,
            basicInfo: {
              area: formData.area,
              price: formData.price,
              deposit: formData.deposit,
              furniture: formData.furniture
            },
            address: formData.address,
            ...(cleanedUtilities ? { utilities: cleanedUtilities } : {}),
            images: imageUrls,
            videos: allVideoUrls.length > 0 ? allVideoUrls : []
          };
          break;

        case 'chung-cu':
          payload = {
            ...payload,
            basicInfo: {
              area: formData.area,
              price: formData.price,
              deposit: formData.deposit,
              furniture: formData.furniture,
              bedrooms: formData.bedrooms,
              bathrooms: formData.bathrooms,
              direction: formData.direction,
              legalStatus: formData.legalStatus
            },
            chungCuInfo: {
              buildingName: formData.buildingName,
              blockOrTower: formData.blockOrTower,
              floorNumber: formData.floorNumber,
              unitCode: formData.unitCode,
              propertyType: formData.propertyType
            },
            address: formData.address,
            ...(cleanedUtilities ? { utilities: cleanedUtilities } : {}),
            images: imageUrls,
            videos: allVideoUrls.length > 0 ? allVideoUrls : []
          };
          break;

        case 'nha-nguyen-can':
          payload = {
            ...payload,
            basicInfo: {
              area: (formData.area || formData.usableArea || formData.landArea || 0),
              price: formData.price,
              deposit: formData.deposit,
              furniture: formData.furniture,
              bedrooms: formData.bedrooms,
              bathrooms: formData.bathrooms,
              direction: formData.direction,
              legalStatus: formData.legalStatus
            },
            nhaNguyenCanInfo: {
              khuLo: formData.khuLo,
              unitCode: formData.unitCode,
              propertyType: formData.propertyType,
              totalFloors: formData.totalFloors,
              landArea: formData.landArea,
              usableArea: formData.usableArea,
              width: formData.width,
              length: formData.length,
              features: formData.features
            },
            address: formData.address,
            ...(cleanedUtilities ? { utilities: cleanedUtilities } : {}),
            images: imageUrls,
            videos: allVideoUrls.length > 0 ? allVideoUrls : []
          };
          break;

        default:
          // Fallback
          payload = {
            ...payload,
            basicInfo: {
              area: formData.area || 0,
              price: formData.price || 0,
              deposit: formData.deposit || 0,
              furniture: formData.furniture || '',
              bedrooms: formData.bedrooms || 0,
              bathrooms: formData.bathrooms || 0,
              direction: formData.direction || ''
            },
            address: formData.address,
            images: imageUrls,
            videos: allVideoUrls.length > 0 ? allVideoUrls : []
          };
        }
      }

      // Tạo danh sách ảnh cuối cùng (giữ ảnh cũ còn lại + ảnh mới), ưu tiên ảnh bìa đứng đầu
      const buildFinalImages = (uploaded: string[]) => {
        const existing: string[] = Array.isArray(formData.existingImages) ? formData.existingImages : [];
        // cover từ ảnh cũ (url) hoặc từ ảnh mới (local id)
        let cover: string | undefined = formData.coverImageUrl;
        // Nếu người dùng chọn bìa từ ảnh mới (coverLocalId), khi đã upload ta ưu tiên ảnh mới đầu tiên làm bìa
        if (!cover && formData.coverLocalId && uploaded.length) {
          cover = uploaded[0];
        }
        let final = [...(existing || []), ...(uploaded || [])];
        if (cover && final.includes(cover)) {
          final = [cover, ...final.filter((u) => u !== cover)];
        }
        return final.slice(0, 12);
      };

      // Use appropriate API based on category
      if (isRoommatePost) {
        const roommateId = post.roommatePostId || post.postId;
        // merge images cũ + mới
        if (payload.images) {
          payload.images = buildFinalImages(payload.images);
        } else if (formData.existingImages) {
          payload.images = buildFinalImages([]);
        }
        await updateRoommatePost(Number(roommateId), payload);
      } else {
        // Use rent post API for other categories
        if (payload.images) {
          payload.images = buildFinalImages(payload.images);
        } else if (formData.existingImages) {
          payload.images = buildFinalImages([]);
        }
        await updateRentPost(post.rentPostId, payload);
      }
      setToast({ message: 'Cập nhật bài đăng thành công!', type: 'success', visible: true });
      // Auto hide toast
      setTimeout(() => setToast((t) => (t ? { ...t, visible: false } : t)), 2200);
      setTimeout(() => {
      onSuccess();
      onClose();
      }, 900);
    } catch (err: any) {
      setError('Không thể cập nhật bài đăng. Vui lòng thử lại.');
      setToast({ message: 'Cập nhật thất bại. Vui lòng thử lại.', type: 'error', visible: true });
      setTimeout(() => setToast((t) => (t ? { ...t, visible: false } : t)), 2200);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev: any) => ({
        ...prev,
        [name]: value
      }));
  };

  const handleNumberChange = (name: string, value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value) || 0;
    handleInputChange(name, numValue);
  };

  // Render form based on category
  const renderFormContent = () => {
    if (!post) return null;
    
    const category = post.category as Category;

    return (
      <EditFormRenderer
        category={category}
        formData={formData}
        onInputChange={handleInputChange}
        onNumberChange={handleNumberChange}
      />
    );
  };

  if (!isOpen) return null;

  return (
    <div 
  className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
  onClick={onClose}
>
  <div 
    className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    onClick={(e) => e.stopPropagation()}
  >
        {/* Toast */}
        {toast && (
          <div className={`fixed right-6 top-6 z-[60] transform transition-all duration-300 ${toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
            <div className={`pointer-events-auto flex items-start gap-3 rounded-xl border backdrop-blur bg-white/90 shadow-lg ring-1 ring-black/10 px-4 py-3 min-w-[280px]`}
            >
              <div className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                {toast.type === 'success' ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                )}
              </div>
              <div className="flex-1 text-sm text-gray-800">
                {toast.message}
              </div>
              <button
                aria-label="Đóng"
                onClick={() => setToast((t) => (t ? { ...t, visible: false } : t))}
                className="ml-2 rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className={`h-1 mt-2 rounded-full ${toast.type === 'success' ? 'bg-green-200' : 'bg-rose-200'}`}>
              <div className={`${toast.type === 'success' ? 'bg-green-600' : 'bg-rose-600'} h-1 rounded-full animate-[shrink_2.2s_linear_forwards]`}/>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa bài đăng</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Dynamic Form Content Based on Category */}
          {renderFormContent()}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang lưu...
                </div>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
