"use client";

import React, { useState, useEffect } from 'react';
import { Requirements } from '@/types/Post';

export interface RoommateRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (requirements: Requirements, posterTraits: string[]) => void; // ⭐ Thêm posterTraits
  initialRequirements?: Requirements | null;
  initialPosterTraits?: string[] | null; // ⭐ Traits của Poster (User A)
  loading?: boolean;
}

const TRAITS_OPTIONS = [
  'Sạch sẽ',
  'Yên tĩnh',
  'Hòa đồng',
  'Ít nói',
  'Thân thiện',
];

export default function RoommateRequirementsModal({
  isOpen,
  onClose,
  onSave,
  initialRequirements,
  initialPosterTraits,
  loading = false,
}: RoommateRequirementsModalProps) {
  const [formData, setFormData] = useState<Requirements>({
    ageRange: initialRequirements?.ageRange || [20, 30],
    gender: initialRequirements?.gender || 'any',
    traits: initialRequirements?.traits || [], // Yêu cầu về traits của người ở ghép
    maxPrice: initialRequirements?.maxPrice || 3000000,
  });

  const [posterTraits, setPosterTraits] = useState<string[]>(
    initialPosterTraits || [] // ⭐ Traits của Poster (User A)
  );

  useEffect(() => {
    if (initialRequirements) {
      setFormData({
        ageRange: initialRequirements.ageRange || [20, 30],
        gender: initialRequirements.gender || 'any',
        traits: initialRequirements.traits || [],
        maxPrice: initialRequirements.maxPrice || 3000000,
      });
    }
    if (initialPosterTraits) {
      setPosterTraits(initialPosterTraits);
    }
  }, [initialRequirements, initialPosterTraits]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, posterTraits); // ⭐ Gửi cả requirements và posterTraits
  };

  const handleTraitToggle = (trait: string, isPosterTrait: boolean = false) => {
    if (isPosterTrait) {
      // Toggle poster traits (traits của chính Poster)
      setPosterTraits((prev) =>
        prev.includes(trait)
          ? prev.filter((t) => t !== trait)
          : [...prev, trait]
      );
    } else {
      // Toggle required traits (yêu cầu về traits của người ở ghép)
      setFormData((prev) => ({
        ...prev,
        traits: prev.traits.includes(trait)
          ? prev.traits.filter((t) => t !== trait)
          : [...prev.traits, trait],
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Cấu hình yêu cầu tìm ở ghép</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Độ tuổi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Độ tuổi
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={formData.ageRange[0]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ageRange: [Number(e.target.value), formData.ageRange[1]],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={formData.ageRange[1]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ageRange: [formData.ageRange[0], Number(e.target.value)],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            {/* Giới tính */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giới tính ưu tiên
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value as 'male' | 'female' | 'any',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="any">Không yêu cầu</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            {/* Đặc điểm mong muốn ở người ở ghép */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đặc điểm mong muốn ở người ở ghép
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Chọn các đặc điểm bạn mong muốn ở người ở ghép
              </p>
              <div className="space-y-2">
                {TRAITS_OPTIONS.map((trait) => (
                  <label
                    key={trait}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.traits.includes(trait)}
                      onChange={() => handleTraitToggle(trait, false)}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">{trait}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Đặc điểm của bạn (Poster Traits) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đặc điểm của bạn <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Chọn các đặc điểm mô tả về bạn (để matching chính xác hơn)
              </p>
              <div className="space-y-2">
                {TRAITS_OPTIONS.map((trait) => (
                  <label
                    key={trait}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={posterTraits.includes(trait)}
                      onChange={() => handleTraitToggle(trait, true)}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">{trait}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Giá thuê tối đa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá thuê tối đa (đ/tháng)
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxPrice: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            {/* Actions */}
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
                  'Lưu và đăng bài'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

