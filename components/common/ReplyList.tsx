'use client';

import React, { useState } from 'react';
import { Reply, deleteReply } from '@/services/reviews';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { FaUserCircle, FaEdit, FaTrash, FaSearchPlus, FaCrown } from 'react-icons/fa';

interface ReplyListProps {
  reviewId: number;
  replies: Reply[];
  repliesCount: number;
  onReplyUpdated: () => void;
  onEditReply: (reply: Reply) => void;
}

export default function ReplyList({
  reviewId,
  replies,
  repliesCount,
  onReplyUpdated,
  onEditReply
}: ReplyListProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [deletingReplyId, setDeletingReplyId] = useState<number | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!user) {
      showError('Vui lòng đăng nhập');
      return;
    }

    if (!window.confirm('Bạn có chắc muốn xóa phản hồi này?')) {
      return;
    }

    setDeletingReplyId(replyId);
    try {
      await deleteReply(reviewId, replyId, user.userId);
      showSuccess('Đã xóa phản hồi');
      onReplyUpdated();
    } catch (error: any) {
      console.error('Error deleting reply:', error);
      showError(error.message || 'Không thể xóa phản hồi');
    } finally {
      setDeletingReplyId(null);
    }
  };

  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">
        {repliesCount} phản hồi
      </h4>
      {replies.map((reply) => (
        <div
          key={reply.replyId}
          className="border-l-2 border-blue-300 pl-4 py-2 bg-gray-50 rounded-r"
        >
          {/* Reply Header */}
          <div className="flex items-center gap-2 mb-2">
            {reply.userAvatar ? (
              <img
                src={reply.userAvatar}
                alt={reply.userName}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <FaUserCircle className="w-7 h-7 text-gray-400" />
            )}
            <span className="font-semibold text-sm text-gray-800">
              {reply.userName}
            </span>
            {reply.isAuthor && (
              <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full font-semibold border border-blue-300 flex items-center gap-1 shadow-sm">
                <FaCrown className="w-3 h-3 text-blue-600" />
                Tác giả
              </span>
            )}
          </div>

          {/* Reply Content */}
          <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
            {reply.content}
          </p>

          {/* Reply Images */}
          {reply.media && reply.media.length > 0 && (
            <div className="flex gap-2 mt-2 mb-2 flex-wrap">
              {reply.media.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Reply image ${index + 1}`}
                    className="w-20 h-20 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(url, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <FaSearchPlus className="text-white w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply Footer */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {formatDate(reply.createdAt)}
              {reply.isEdited && ' (đã chỉnh sửa)'}
            </span>
            {user && reply.userId === user.userId && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditReply(reply)}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  <FaEdit className="w-3 h-3" />
                  Sửa
                </button>
                <button
                  onClick={() => handleDeleteReply(reply.replyId)}
                  disabled={deletingReplyId === reply.replyId}
                  className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  <FaTrash className="w-3 h-3" />
                  {deletingReplyId === reply.replyId ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

