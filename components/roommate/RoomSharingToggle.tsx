"use client";

import React, { useState } from 'react';

export interface RoomSharingToggleProps {
  roomId: number;
  enabled: boolean;
  postStatus?: 'pending' | 'active' | 'inactive' | null;
  postId?: number | null;
  onToggle: (enabled: boolean) => void;
  onEdit?: () => void;
  onViewPost?: () => void;
  loading?: boolean;
}

export default function RoomSharingToggle({
  roomId,
  enabled,
  postStatus,
  postId,
  onToggle,
  onEdit,
  onViewPost,
  loading = false,
}: RoomSharingToggleProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (checked: boolean) => {
    if (isToggling || loading) return;
    
    setIsToggling(true);
    try {
      await onToggle(checked);
    } finally {
      setIsToggling(false);
    }
  };

  const getStatusBadge = () => {
    if (!postStatus) return null;

    const statusConfig = {
      active: {
        label: 'Đang hoạt động',
        className: 'bg-green-100 text-green-800',
      },
      pending: {
        label: 'Chờ duyệt',
        className: 'bg-yellow-100 text-yellow-800',
      },
      inactive: {
        label: 'Đã ẩn',
        className: 'bg-gray-100 text-gray-800',
      },
    };

    const config = statusConfig[postStatus];
    if (!config) return null;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleToggle(e.target.checked)}
              disabled={isToggling || loading}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center ${
                enabled ? 'bg-teal-600' : 'bg-gray-300'
              } ${isToggling || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                  enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-700">
            Tìm người ở ghép
          </span>
        </label>

        {enabled && postStatus && getStatusBadge()}
      </div>

      {/* Actions */}
      {enabled && (
        <div className="flex flex-wrap gap-2">
          {postId && onViewPost && (
            <button
              onClick={onViewPost}
              className="px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
            >
              Xem bài đăng
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Chỉnh sửa yêu cầu
            </button>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {(isToggling || loading) && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Đang xử lý...</span>
        </div>
      )}
    </div>
  );
}

