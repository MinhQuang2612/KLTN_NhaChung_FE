"use client";

import { useState, useEffect, useRef } from "react";
import { uploadFiles } from "@/utils/upload";
import { extractApiErrorMessage } from "@/utils/api";
import { useToast } from "@/contexts/ToastContext";

interface EditFormData {
  content: string;
  rating?: number;
  media: string[];
  isAnonymous?: boolean;
}

interface EditFormProps {
  type: 'review' | 'reply';
  initialData: EditFormData;
  onSubmit: (data: EditFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  maxLength?: number;
  title?: string;
}

export default function EditForm({
  type,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  maxLength,
  title
}: EditFormProps) {
  const { showSuccess, showError } = useToast();
  const [content, setContent] = useState(initialData.content || "");
  const [rating, setRating] = useState(initialData.rating || 0);
  const [media, setMedia] = useState<string[]>(initialData.media || []);
  const [isAnonymous, setIsAnonymous] = useState(initialData.isAnonymous || false);
  const [uploaderVersion, setUploaderVersion] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track first render and snapshot of initial media
  const isFirstRenderRef = useRef(true);
  const initialMediaSnapshotRef = useRef<string[]>(initialData.media || []);
  
  // Compare media arrays by value (order-independent)
  const areMediaArraysEqual = (a: string[], b: string[]): boolean => {
    if (a.length !== b.length) return false;
    const aSet = new Set(a);
    const bSet = new Set(b);
    if (aSet.size !== bSet.size) return false;
    return Array.from(aSet).every(url => bSet.has(url));
  };
  
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      initialMediaSnapshotRef.current = initialData.media || [];
      return;
    }
    
    const newMedia = initialData.media || [];
    const initialMedia = initialMediaSnapshotRef.current;
    
    setMedia(prev => {
      const userHasChangedMedia = !areMediaArraysEqual(prev, initialMedia);
      
      if (userHasChangedMedia) {
        const newMediaHasNewItems = newMedia.some(url => !prev.includes(url));
        const isCompleteReplace = !areMediaArraysEqual(newMedia, initialMedia) && 
                                   newMedia.length >= prev.length &&
                                   newMediaHasNewItems;
        
        if (isCompleteReplace) {
          initialMediaSnapshotRef.current = newMedia;
          return newMedia;
        }
        return prev;
      }
      
      if (!areMediaArraysEqual(newMedia, initialMedia)) {
        initialMediaSnapshotRef.current = newMedia;
        return newMedia;
      }
      return prev;
    });
    
    setContent(initialData.content || "");
    setRating(initialData.rating || 0);
    setIsAnonymous(initialData.isAnonymous || false);
  }, [initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const inputElement = e.currentTarget;
    
    if (media.length + files.length > 3) {
      showError('Lỗi', 'Chỉ được tải tối đa 3 ảnh');
      if (inputElement) {
        inputElement.value = '';
      }
      return;
    }

    try {
      const uploaded = await uploadFiles(files);
      
      if (!Array.isArray(uploaded)) {
        throw new Error('Phản hồi từ server không hợp lệ');
      }
      
      if (uploaded.length === 0) {
        throw new Error('Không có ảnh nào được tải lên thành công');
      }

      const validUrls = uploaded.filter(url => {
        const isValid = typeof url === 'string' && url.trim().length > 0;
        return isValid;
      });
      
      if (validUrls.length === 0) {
        throw new Error('URLs ảnh không hợp lệ');
      }

      setMedia(prev => {
        const newMedia = [...prev, ...validUrls];
        return newMedia;
      });
      
      showSuccess('Đã tải ảnh', `Đã tải ${validUrls.length} ảnh thành công.`);
    } catch (err: any) {
      const msg = extractApiErrorMessage(err);
      showError('Tải ảnh thất bại', msg || 'Có lỗi xảy ra khi tải ảnh');
    } finally {
      if (inputElement) {
        inputElement.value = '';
      } else if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (type === 'review' && !rating) {
      showError('Lỗi', 'Vui lòng chọn số sao đánh giá');
      return;
    }
    if (type === 'reply' && !content.trim()) {
      showError('Lỗi', 'Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      await onSubmit({
        content: content.trim() || "",
        rating: type === 'review' ? rating : undefined,
        media: media.length > 0 ? media : [],
        isAnonymous: type === 'review' ? isAnonymous : undefined,
      });
    } catch (err: any) {
      // Error handling is done in parent component
      throw err;
    }
  };

  const formTitle = title || (type === 'review' ? 'Sửa đánh giá' : 'Sửa phản hồi');
  const showRating = type === 'review';
  const showAnonymous = type === 'review';
  const showCharCount = type === 'reply' && maxLength !== undefined;
  const contentPlaceholder = type === 'review' 
    ? 'Chia sẻ trải nghiệm của bạn (tùy chọn)'
    : 'Chia sẻ phản hồi của bạn';

  const canSubmit = type === 'review' 
    ? rating > 0 
    : content.trim().length > 0;

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900">{formTitle}</h4>
        {showRating && (
          <div className="flex items-center gap-1" aria-label="Chọn số sao">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = rating >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 transition-colors ${
                    active ? 'text-yellow-400' : 'text-gray-300 hover:text-gray-400'
                  }`}
                  aria-pressed={active}
                  aria-label={`${star} sao`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.347l5.518.442c.499.04.701.663.321.988l-4.204 3.57a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0l-4.725 2.885a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557l-4.204-3.57a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.347l2.125-5.111z" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => {
          const newContent = e.target.value;
          if (maxLength && newContent.length > maxLength) return;
          setContent(newContent);
        }}
        placeholder={contentPlaceholder}
        className="w-full rounded-md border border-gray-200 focus:border-teal-500 focus:ring-teal-500 text-sm p-2 min-h-[80px]"
        maxLength={maxLength}
      />

      <div className="mt-2">
        <input
          key={`edit-uploader-${uploaderVersion}`}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="block text-sm text-gray-600"
          disabled={media.length >= 3}
        />
        {media.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {media.map((url, idx) => (
              <div key={idx} className="relative w-14 h-14 border rounded overflow-hidden">
                <img src={url} alt="media" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  aria-label="Xóa ảnh"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {showCharCount && (
            <span className="text-xs text-gray-500">
              {content.length}/{maxLength} ký tự
            </span>
          )}
          {showAnonymous && (
            <label className="inline-flex items-center text-sm text-gray-600 select-none">
              <input
                type="checkbox"
                className="mr-2 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Ẩn danh khi hiển thị
            </label>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-1 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              canSubmit && !loading
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        </div>
      </div>
    </div>
  );
}

