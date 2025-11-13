"use client";

import React, { useState, useEffect } from 'react';
import { Requirements } from '@/types/Post';

export interface RoommateRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (requirements: Requirements, posterTraits: string[]) => void; // ⭐ Thêm posterTraits
  initialRequirements?: Requirements | null;
  initialPosterTraits?: string[] | null; // ⭐ Traits của Poster (User A)
  posterAge?: number | null; // ⭐ Tuổi của Poster từ verification (read-only)
  posterGender?: string | null; // ⭐ Giới tính của Poster từ verification (read-only)
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
  posterAge,
  posterGender,
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

  const getGenderDisplay = (gender?: string | null): string => {
    if (!gender) return 'Đang tải...';
    if (gender === 'male') return 'Nam';
    if (gender === 'female') return 'Nữ';
    if (gender === 'other') return 'Khác';
    return gender;
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Close button - absolute position */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          disabled={loading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Layout 2 cột */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cột trái: Yêu cầu về người ở ghép */}
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Yêu cầu về người ở ghép</h3>
                  <p className="text-xs text-gray-500">Thiết lập tiêu chí cho người bạn muốn tìm</p>
                </div>

                {/* Độ tuổi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Độ tuổi
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.ageRange[0] === 0 ? '' : formData.ageRange[0]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ageRange: [Number(e.target.value) || 0, formData.ageRange[1]],
                        })
                      }
                      onFocus={(e) => {
                        if (formData.ageRange[0] === 0) {
                          e.target.select();
                        }
                      }}
                      className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    />
                    <span className="text-gray-500 font-medium flex-shrink-0">-</span>
                    <input
                      type="text"
                      value={formData.ageRange[1] === 0 ? '' : formData.ageRange[1]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ageRange: [formData.ageRange[0], Number(e.target.value) || 0],
                        })
                      }
                      onFocus={(e) => {
                        if (formData.ageRange[1] === 0) {
                          e.target.select();
                        }
                      }}
                      className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                    Đặc điểm mong muốn
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Chọn các đặc điểm bạn mong muốn ở người ở ghép
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {TRAITS_OPTIONS.map((trait) => (
                      <label
                        key={trait}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200"
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

                {/* Giá thuê tối đa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá thuê tối đa (đ/tháng)
                  </label>
                  <input
                    type="text"
                    value={formData.maxPrice === 0 ? '' : formData.maxPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxPrice: Number(e.target.value) || 0,
                      })
                    }
                    onFocus={(e) => {
                      if (formData.maxPrice === 0) {
                        e.target.select();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Cột phải: Đặc điểm của bạn */}
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Đặc điểm của bạn <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-xs text-gray-500">Mô tả về bạn để matching chính xác hơn</p>
                </div>

                {/* Thông báo về tuổi và giới tính */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Lưu ý:</strong> Tuổi và giới tính của bạn sẽ được lấy tự động từ thông tin xác thực (verification). 
                    Nếu bạn chưa xác thực tài khoản, vui lòng thực hiện xác thực để sử dụng tính năng này.
                  </p>
                </div>

                {/* Tuổi của bạn (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tuổi
                  </label>
                  <input
                    type="text"
                    value={posterAge ? `${posterAge}` : 'Đang tải...'}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tuổi được lấy từ thông tin xác thực</p>
                </div>

                {/* Giới tính của bạn (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới tính 
                  </label>
                  <input
                    type="text"
                    value={getGenderDisplay(posterGender)}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Giới tính được lấy từ thông tin xác thực</p>
                </div>

                {/* Đặc điểm của bạn (Poster Traits) */}
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    {TRAITS_OPTIONS.map((trait) => (
                      <label
                        key={trait}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200"
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
                  {posterTraits.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Vui lòng chọn ít nhất một đặc điểm
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                disabled={loading || posterTraits.length === 0}
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

