"use client";

import React from 'react';
import Link from 'next/link';
import { MatchingRequest } from '@/types/RoommatePreference';

export interface MatchingRequestCardProps {
  request: MatchingRequest;
  onAccept?: (requestId: number) => void;
  onReject?: (requestId: number) => void;
  onViewDetails?: (requestId: number) => void;
  onContact?: (requestId: number) => void;
  loading?: boolean;
  isPoster?: boolean; // true nếu là người đăng bài (người thuê A), false nếu là người tìm phòng (người thuê B)
}

export default function MatchingRequestCard({
  request,
  onAccept,
  onReject,
  onViewDetails,
  onContact,
  loading = false,
  isPoster = true,
}: MatchingRequestCardProps) {
  const getStatusBadge = () => {
    const statusConfig = {
      pending: {
        label: 'Chờ duyệt',
        className: 'bg-yellow-100 text-yellow-800',
      },
      accepted: {
        label: 'Đã chấp nhận',
        className: 'bg-green-100 text-green-800',
      },
      rejected: {
        label: 'Đã từ chối',
        className: 'bg-red-100 text-red-800',
      },
    };

    const config = statusConfig[request.status];
    if (!config) return null;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getMatchScoreStars = (score: number) => {
    if (score >= 80) return '⭐⭐⭐⭐';
    if (score >= 60) return '⭐⭐⭐';
    return '⭐⭐';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {isPoster ? (
            <h3 className="text-lg font-semibold text-gray-900">
              {request.seeker?.name || 'Người tìm phòng'}
            </h3>
          ) : (
            <h3 className="text-lg font-semibold text-gray-900">
              {request.room?.roomNumber ? `Phòng ${request.room.roomNumber}` : 'Phòng'}
            </h3>
          )}
          {getStatusBadge()}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(request.matchScore)}`}>
          {request.matchScore}/100 {getMatchScoreStars(request.matchScore)}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-2 mb-4">
        {isPoster ? (
          <>
            {/* Hiển thị thông tin người tìm phòng (người thuê B) */}
            {request.seeker && (
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Tuổi:</strong> {request.seeker.age || 'N/A'} tuổi
                </p>
                <p>
                  <strong>Giới tính:</strong>{' '}
                  {request.seeker.gender === 'male' ? 'Nam' : request.seeker.gender === 'female' ? 'Nữ' : 'Khác'}
                </p>
                {request.seeker.occupation && (
                  <p>
                    <strong>Nghề nghiệp:</strong> {request.seeker.occupation}
                  </p>
                )}
                {request.seeker.traits && request.seeker.traits.length > 0 && (
                  <div>
                    <strong>Đặc điểm:</strong>{' '}
                    <span className="text-gray-700">{request.seeker.traits.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Hiển thị thông tin phòng (người thuê B xem) */}
            {request.room && (
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Tòa nhà:</strong> {request.room.buildingName || 'N/A'}
                </p>
                {request.room.address && (
                  <p>
                    <strong>Địa chỉ:</strong> {request.room.address}
                  </p>
                )}
              </div>
            )}
            {request.post && (
              <p className="text-sm text-gray-600">
                <strong>Bài đăng:</strong> {request.post.title}
              </p>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(request.requestId)}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Xem chi tiết
          </button>
        )}
        {request.status === 'pending' && isPoster && (
          <>
            {onAccept && (
              <button
                onClick={() => onAccept(request.requestId)}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xử lý...' : 'Chấp nhận'}
              </button>
            )}
            {onReject && (
              <button
                onClick={() => onReject(request.requestId)}
                disabled={loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Từ chối
              </button>
            )}
          </>
        )}
        {request.status === 'accepted' && onContact && (
          <button
            onClick={() => onContact(request.requestId)}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Liên hệ
          </button>
        )}
      </div>
    </div>
  );
}

