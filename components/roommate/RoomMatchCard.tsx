"use client";

import React from 'react';
import Link from 'next/link';
import { RoomMatch } from '@/types/RoommatePreference';
import { formatVND } from '@/utils/format';

export interface RoomMatchCardProps {
  match: RoomMatch;
  onSave?: (postId: number) => void;
}

export default function RoomMatchCard({
  match,
  onSave,
}: RoomMatchCardProps) {
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
        {match.images && match.images.length > 0 ? (
          <img
            src={match.images[0]}
            alt={`Phòng ${match.roomNumber}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
          </div>
        )}
        
        {/* Match Score Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(match.matchScore)}`}>
            {match.matchScore}/100
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Room Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Phòng {match.roomNumber} - {match.buildingName}
          </h3>
          <p className="text-sm text-gray-600 truncate">{match.address}</p>
        </div>

        {/* Poster Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>
            {match.posterName} ({match.posterAge} tuổi) - {match.posterOccupation}
          </span>
        </div>

        {/* Room Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="font-semibold text-teal-600">{formatVND(match.price)}/tháng</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4a1 1 0 00-1-1H9a1 1 0 00-1 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V8z" />
            </svg>
            <span>{match.area}m²</span>
          </div>
        </div>

        {/* Traits */}
        {match.traits && match.traits.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {match.traits.map((trait, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full"
              >
                {trait}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <Link
            href={`/room_details/roommate-${match.postId}`}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors text-center"
          >
            Xem chi tiết
          </Link>
          {onSave && (
            <button
              onClick={() => onSave(match.postId)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

