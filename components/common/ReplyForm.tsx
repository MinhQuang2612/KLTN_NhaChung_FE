'use client';

import React, { useState, useEffect } from 'react';
import { createReply, updateReply, Reply } from '@/services/reviews';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { uploadFiles } from '@/utils/upload';
import { extractApiErrorMessage } from '@/utils/api';
import { FaImage, FaTimes } from 'react-icons/fa';

interface ReplyFormProps {
  reviewId: number;
  editingReply?: Reply | null;
  onCancel: () => void;
  onReplyCreated: () => void;
}

export default function ReplyForm({
  reviewId,
  editingReply,
  onCancel,
  onReplyCreated
}: ReplyFormProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingReply) {
      setContent(editingReply.content);
      setMedia(editingReply.media || []);
    } else {
      setContent('');
      setMedia([]);
    }
  }, [editingReply]);

  const handleSubmit = async () => {
    if (!user) {
      showError('Vui lòng đăng nhập để trả lời');
      return;
    }

    if (content.trim().length === 0) {
      showError('Vui lòng nhập nội dung phản hồi');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        content: content.trim(),
        userId: user.userId,
        media: media.length > 0 ? media : undefined
      };

      if (editingReply) {
        await updateReply(reviewId, editingReply.replyId, payload);
        showSuccess('Đã cập nhật phản hồi');
      } else {
        await createReply(reviewId, payload);
        showSuccess('Đã gửi phản hồi');
      }

      setContent('');
      setMedia([]);
      onReplyCreated();
    } catch (error: any) {
      showError(error.message || 'Không thể gửi phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check limit
    if (media.length + files.length > 3) {
      showError('Chỉ được tải tối đa 3 ảnh');
      return;
    }

    try {
      const uploaded = await uploadFiles(files);
      setMedia(prev => [...prev, ...uploaded]);
      showSuccess('Đã tải ảnh lên');
    } catch (err: any) {
      const msg = extractApiErrorMessage(err);
      showError(msg || 'Không thể tải ảnh lên');
    } finally {
      // Reset input
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
      <textarea
        placeholder={editingReply ? 'Chỉnh sửa phản hồi...' : 'Viết phản hồi của bạn...'}
        maxLength={500}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={3}
      />
      
      {/* Image upload section */}
      <div className="mt-2">
        <label className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
          <FaImage className="w-4 h-4" />
          <span>Thêm ảnh (tối đa 3)</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            disabled={media.length >= 3 || submitting}
            className="hidden"
          />
        </label>
        <span className="ml-2 text-xs text-gray-500">
          {media.length}/3
        </span>
      </div>

      {/* Preview uploaded images */}
      {media.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {media.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-20 h-20 object-cover rounded border border-gray-300"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={submitting}
                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs text-gray-500">
          {content.length}/500 ký tự
        </span>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={content.trim().length === 0 || submitting}
            className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? 'Đang gửi...'
              : editingReply
              ? 'Cập nhật'
              : 'Gửi'}
          </button>
        </div>
      </div>
    </div>
  );
}

