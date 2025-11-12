"use client";

import React, { useState, useEffect } from 'react';
import { Requirements } from '@/types/Post';

export interface FindRoommateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    requirements: Requirements,
    personalInfo: { age: number; gender: 'male' | 'female' | 'other' },
    seekerTraits: string[] // ⭐ Traits của Seeker (User B)
  ) => void;
  initialRequirements?: Requirements | null;
  initialPersonalInfo?: { age?: number; gender?: 'male' | 'female' | 'other' } | null;
  initialSeekerTraits?: string[] | null; // ⭐ Traits của Seeker đã lưu
  loading?: boolean;
}

const TRAITS_OPTIONS = [
  'Sạch sẽ',
  'Yên tĩnh',
  'Hòa đồng',
  'Ít nói',
  'Thân thiện',
];

export default function FindRoommateForm({
  isOpen,
  onClose,
  onSave,
  initialRequirements,
  initialPersonalInfo,
  initialSeekerTraits,
  loading = false,
}: FindRoommateFormProps) {
  const [requirements, setRequirements] = useState<Requirements>({
    ageRange: initialRequirements?.ageRange || [20, 30],
    gender: initialRequirements?.gender || 'any',
    traits: initialRequirements?.traits || [], // Yêu cầu về traits của người ở ghép
    maxPrice: initialRequirements?.maxPrice || 3000000,
  });

  const [personalInfo, setPersonalInfo] = useState<{
    age: number;
    gender: 'male' | 'female' | 'other';
  }>({
    age: initialPersonalInfo?.age || 22,
    gender: initialPersonalInfo?.gender || 'male',
  });

  const [seekerTraits, setSeekerTraits] = useState<string[]>(
    initialSeekerTraits || [] // ⭐ Traits của Seeker (User B)
  );

  useEffect(() => {
    if (initialRequirements) {
      setRequirements({
        ageRange: initialRequirements.ageRange || [20, 30],
        gender: initialRequirements.gender || 'any',
        traits: initialRequirements.traits || [],
        maxPrice: initialRequirements.maxPrice || 3000000,
      });
    }
    if (initialPersonalInfo) {
      setPersonalInfo({
        age: initialPersonalInfo.age || 25,
        gender: initialPersonalInfo.gender || 'male',
      });
    }
    if (initialSeekerTraits) {
      setSeekerTraits(initialSeekerTraits);
    }
  }, [initialRequirements, initialPersonalInfo, initialSeekerTraits]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(requirements, personalInfo, seekerTraits);
  };

  const handleTraitToggle = (trait: string, isSeekerTrait: boolean = false) => {
    if (isSeekerTrait) {
      // Toggle seeker traits
      setSeekerTraits((prev) =>
        prev.includes(trait)
          ? prev.filter((t) => t !== trait)
          : [...prev, trait]
      );
    } else {
      // Toggle required traits (yêu cầu về traits của người ở ghép)
      setRequirements((prev) => ({
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
            <h2 className="text-xl font-bold text-gray-900">Tìm phòng ở ghép</h2>
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
            {/* Thông tin cá nhân */}
            <div className="border-b pb-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Thông tin của bạn</h3>
              
              {/* Tuổi của bạn */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tuổi của bạn <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={personalInfo.age}
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      age: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              {/* Giới tính của bạn */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới tính của bạn <span className="text-red-500">*</span>
                </label>
                <select
                  value={personalInfo.gender}
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      gender: e.target.value as 'male' | 'female' | 'other',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              {/* Đặc điểm của bạn (Seeker Traits) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đặc điểm của bạn
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
                        checked={seekerTraits.includes(trait)}
                        onChange={() => handleTraitToggle(trait, true)}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">{trait}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Yêu cầu về người ở ghép */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Yêu cầu về người ở ghép</h3>
              
              {/* Độ tuổi mong muốn */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Độ tuổi mong muốn
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={requirements.ageRange[0]}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        ageRange: [Number(e.target.value), requirements.ageRange[1]],
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
                    value={requirements.ageRange[1]}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        ageRange: [requirements.ageRange[0], Number(e.target.value)],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Giới tính ưu tiên */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới tính ưu tiên
                </label>
                <select
                  value={requirements.gender}
                  onChange={(e) =>
                    setRequirements({
                      ...requirements,
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

              {/* Đặc điểm mong muốn (Required Traits) */}
              <div className="mb-3">
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
                        checked={requirements.traits.includes(trait)}
                        onChange={() => handleTraitToggle(trait, false)}
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
                  value={requirements.maxPrice}
                  onChange={(e) =>
                    setRequirements({
                      ...requirements,
                      maxPrice: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
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
                    Đang tìm kiếm...
                  </div>
                ) : (
                  'Tìm kiếm'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

