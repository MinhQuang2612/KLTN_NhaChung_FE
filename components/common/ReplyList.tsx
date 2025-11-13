'use client';

import React, { useState, useEffect } from 'react';
import { Reply, deleteReply, voteReply, updateReply } from '@/services/reviews';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/hooks/useConfirm';
import ConfirmModal from '@/components/common/ConfirmModal';
import { extractApiErrorMessage } from '@/utils/api';
import { FaUserCircle, FaEdit, FaTrash, FaSearchPlus, FaCrown, FaThumbsUp, FaThumbsDown, FaPoll, FaCheck, FaTimes } from 'react-icons/fa';
import EditForm from '@/components/reviews/EditForm';

interface ReplyListProps {
  reviewId: number;
  replies: Reply[];
  repliesCount: number;
  onReplyUpdated: () => void;
  onEditReply: (reply: Reply) => void;
  onOpenVote?: (reply: Reply) => void;
}

export default function ReplyList({
  reviewId,
  replies,
  repliesCount,
  onReplyUpdated,
  onEditReply,
  onOpenVote
}: ReplyListProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { confirm, showConfirm, hideConfirm, setLoading: setConfirmLoading, handleConfirm, handleCancel } = useConfirm();
  const [deletingReplyId, setDeletingReplyId] = useState<number | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [updatingReplyId, setUpdatingReplyId] = useState<number | null>(null);
  // Vote via modal in parent – không hiển thị chọn inline nữa

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

  const handleDeleteReply = (replyId: number) => {
    if (!user) {
      showError('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để thao tác');
      return;
    }

    showConfirm(
      'Xóa phản hồi',
      'Bạn có chắc muốn xóa phản hồi này?',
      async () => {
        setDeletingReplyId(replyId);
        setConfirmLoading(true);
        try {
          await deleteReply(reviewId, replyId, user.userId);
          showSuccess('Đã xóa phản hồi', 'Phản hồi đã được xóa');
          onReplyUpdated();
          hideConfirm();
        } catch (error: any) {
          showError('Không thể xóa phản hồi', error.message || 'Đã xảy ra lỗi');
        } finally {
          setDeletingReplyId(null);
          setConfirmLoading(false);
        }
      },
      {
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        type: 'danger'
      }
    );
  };

  if (replies.length === 0) {
    return null;
  }

  return (
    <>
      <ConfirmModal
        isOpen={confirm.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        type={confirm.type}
        loading={confirm.loading}
      />
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
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
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
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Tác giả
                </span>
              )}
            </div>
            {/* Timestamp on the top-right */}
            <span className="text-[11px] text-gray-500 whitespace-nowrap">
              {formatDate(reply.createdAt)}
              {reply.isEdited && ' (đã chỉnh sửa)'}
            </span>
          </div>

          {/* Owner actions placed above content like main comment */}
          {user && reply.userId === user.userId && (
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => {
                  if (editingReplyId === reply.replyId) {
                    // Cancel edit
                    setEditingReplyId(null);
                  } else {
                    // Start edit
                    setEditingReplyId(reply.replyId);
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                <FaEdit className="w-3 h-3" />
                {editingReplyId === reply.replyId ? 'Hủy sửa' : 'Sửa'}
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

          {/* Edit Reply Form */}
          {editingReplyId === reply.replyId && (
            <EditForm
              type="reply"
              initialData={{
                content: reply.content || "",
                media: reply.media || [],
              }}
              onSubmit={async (data) => {
                if (!user || !data.content?.trim()) return;
                setUpdatingReplyId(reply.replyId);
                try {
                  await updateReply(reviewId, reply.replyId, {
                    content: data.content.trim(),
                    userId: user.userId,
                    media: data.media && data.media.length > 0 ? data.media : undefined
                  });
                  showSuccess('Đã cập nhật phản hồi', 'Phản hồi đã được cập nhật.');
                  setEditingReplyId(null);
                  onReplyUpdated();
                } catch (err: any) {
                  const msg = extractApiErrorMessage(err);
                  showError('Không thể cập nhật phản hồi', msg);
                  throw err;
                } finally {
                  setUpdatingReplyId(null);
                }
              }}
              onCancel={() => {
                setEditingReplyId(null);
              }}
              loading={updatingReplyId === reply.replyId}
              maxLength={500}
            />
          )}

          {/* Only show content and media when not editing */}
          {editingReplyId !== reply.replyId && (
            <>
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
            </>
          )}

          {/* Reply Footer */}
          <div className="flex items-center justify-between gap-3">
            <div />
            <div className="flex items-center gap-3">
              {/* Counts (readable) */}
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs border-teal-400 text-teal-700">
                <FaThumbsUp className="w-3 h-3" />
                {reply.votesHelpful ?? 0}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs border-gray-300 text-gray-700">
                <FaThumbsDown className="w-3 h-3" />
                {reply.votesUnhelpful ?? 0}
              </span>
              {/* Vote action similar to review (mở modal từ parent) */}
              <button
                className={`text-xs px-2 py-1.5 rounded font-medium transition-all flex items-center justify-center gap-1 ${
                  reply.myVote === 'helpful'
                    ? 'bg-teal-600 text-white border border-teal-600 hover:bg-teal-700'
                    : reply.myVote === 'unhelpful'
                    ? 'bg-gray-600 text-white border border-gray-600 hover:bg-gray-700'
                    : 'border border-teal-400 text-teal-700 hover:bg-teal-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!user}
                onClick={() => onOpenVote && onOpenVote(reply)}
              >
                {reply.myVote ? (
                  reply.myVote === 'helpful' ? (
                    <>
                      <FaCheck className="w-3 h-3" />
                      Đã vote hữu ích
                    </>
                  ) : (
                    <>
                      <FaTimes className="w-3 h-3" />
                      Đã vote không hữu ích
                    </>
                  )
                ) : (
                  <>
                    <FaPoll className="w-3 h-3" />
                    Vote
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
      </div>
    </>
  );
}

