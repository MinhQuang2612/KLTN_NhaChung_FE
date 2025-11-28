"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Requirements } from '@/types/Post';

export interface FindRoommateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    requirements: Requirements,
    seekerTraits: string[], // ⭐ Traits của Seeker (User B)
    seekerSmoking?: 'smoker' | 'non_smoker', // ⭐ Mới
    seekerPets?: 'has_pets' | 'no_pets' // ⭐ Mới
    // ❌ KHÔNG CẦN personalInfo NỮA - Backend tự động lấy age và gender từ verification
  ) => void;
  initialRequirements?: Requirements | null;
  initialSeekerTraits?: string[] | null; // ⭐ Traits của Seeker đã lưu
  initialSeekerSmoking?: 'smoker' | 'non_smoker' | null; // ⭐ Mới
  initialSeekerPets?: 'has_pets' | 'no_pets' | null; // ⭐ Mới
  seekerAge?: number | null; // ⭐ Tuổi từ preferences (read-only)
  seekerGender?: string | null; // ⭐ Giới tính từ preferences (read-only)
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
  initialSeekerTraits,
  initialSeekerSmoking,
  initialSeekerPets,
  seekerAge,
  seekerGender,
  loading = false,
}: FindRoommateFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showWarning } = useToast();
  
  const [requirements, setRequirements] = useState<Requirements>({
    ageRange: initialRequirements?.ageRange || [20, 30],
    gender: initialRequirements?.gender || 'any',
    traits: initialRequirements?.traits || [], // Yêu cầu về traits của người ở ghép
    maxPrice: initialRequirements?.maxPrice || 3000000,
    smokingPreference: initialRequirements?.smokingPreference || 'any', // ⭐ Mới
    petsPreference: initialRequirements?.petsPreference || 'any', // ⭐ Mới
  });

  const [seekerTraits, setSeekerTraits] = useState<string[]>(
    initialSeekerTraits || [] // ⭐ Traits của Seeker (User B)
  );

  const [seekerSmoking, setSeekerSmoking] = useState<'smoker' | 'non_smoker' | undefined>(
    initialSeekerSmoking ?? undefined // ⭐ Mới - dùng ?? để xử lý null
  );

  const [seekerPets, setSeekerPets] = useState<'has_pets' | 'no_pets' | undefined>(
    initialSeekerPets ?? undefined // ⭐ Mới - dùng ?? để xử lý null
  );

  useEffect(() => {
    if (initialRequirements) {
      setRequirements({
        ageRange: initialRequirements.ageRange || [20, 30],
        gender: initialRequirements.gender || 'any',
        traits: initialRequirements.traits || [],
        maxPrice: initialRequirements.maxPrice || 3000000,
        smokingPreference: initialRequirements.smokingPreference || 'any',
        petsPreference: initialRequirements.petsPreference || 'any',
      });
    }
    if (initialSeekerTraits) {
      setSeekerTraits(initialSeekerTraits);
    }
    if (initialSeekerSmoking !== undefined && initialSeekerSmoking !== null) {
      setSeekerSmoking(initialSeekerSmoking);
    } else {
      setSeekerSmoking(undefined);
    }
    if (initialSeekerPets !== undefined && initialSeekerPets !== null) {
      setSeekerPets(initialSeekerPets);
    } else {
      setSeekerPets(undefined);
    }
  }, [initialRequirements, initialSeekerTraits, initialSeekerSmoking, initialSeekerPets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra xác thực tài khoản
    if (!user?.isVerified) {
      showWarning('Cần xác thực tài khoản', 'Vui lòng xác thực tài khoản trước khi thiết lập form tìm người ở ghép.');
      router.push('/profile');
      return;
    }
    
    // ❌ KHÔNG GỬI personalInfo NỮA - Backend tự động lấy age và gender từ verification
    onSave(requirements, seekerTraits, seekerSmoking, seekerPets);
  };

  const getGenderDisplay = (gender?: string | null): string => {
    if (!gender) return 'Đang tải...';
    if (gender === 'male') return 'Nam';
    if (gender === 'female') return 'Nữ';
    if (gender === 'other') return 'Khác';
    return gender;
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
              {/* Cột trái: Thông tin của bạn */}
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Thông tin của bạn</h3>
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
                    value={seekerAge ? `${seekerAge}` : 'Đang tải...'}
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
                    value={getGenderDisplay(seekerGender)}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Giới tính được lấy từ thông tin xác thực</p>
                </div>

                {/* Đặc điểm của bạn (Seeker Traits) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đặc điểm của bạn
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Chọn các đặc điểm mô tả về bạn
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {TRAITS_OPTIONS.map((trait) => (
                      <label
                        key={trait}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200"
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

                {/* Hút thuốc - Thông tin của bạn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bạn có hút thuốc không?
                  </label>
                  <select
                    value={seekerSmoking || ''}
                    onChange={(e) => setSeekerSmoking(e.target.value as 'smoker' | 'non_smoker' | undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Chọn</option>
                    <option value="non_smoker">Không</option>
                    <option value="smoker">Có</option>
                  </select>
                </div>

                {/* Thú cưng - Thông tin của bạn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bạn có nuôi thú cưng không?
                  </label>
                  <select
                    value={seekerPets || ''}
                    onChange={(e) => setSeekerPets(e.target.value as 'has_pets' | 'no_pets' | undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Chọn</option>
                    <option value="no_pets">Không</option>
                    <option value="has_pets">Có</option>
                  </select>
                </div>
              </div>

              {/* Cột phải: Yêu cầu về người ở ghép */}
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Yêu cầu về người ở ghép</h3>
                  <p className="text-xs text-gray-500">Thiết lập tiêu chí cho người bạn muốn tìm</p>
                </div>

                {/* Độ tuổi mong muốn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Độ tuổi mong muốn
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={requirements.ageRange[0] === 0 ? '' : requirements.ageRange[0]}
                      onChange={(e) =>
                        setRequirements({
                          ...requirements,
                          ageRange: [Number(e.target.value) || 0, requirements.ageRange[1]],
                        })
                      }
                      onFocus={(e) => {
                        if (requirements.ageRange[0] === 0) {
                          e.target.select();
                        }
                      }}
                      className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    />
                    <span className="text-gray-500 font-medium flex-shrink-0">-</span>
                    <input
                      type="text"
                      value={requirements.ageRange[1] === 0 ? '' : requirements.ageRange[1]}
                      onChange={(e) =>
                        setRequirements({
                          ...requirements,
                          ageRange: [requirements.ageRange[0], Number(e.target.value) || 0],
                        })
                      }
                      onFocus={(e) => {
                        if (requirements.ageRange[1] === 0) {
                          e.target.select();
                        }
                      }}
                      className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                {/* Giới tính ưu tiên */}
                <div>
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
                    type="text"
                    value={requirements.maxPrice === 0 ? '' : requirements.maxPrice}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        maxPrice: Number(e.target.value) || 0,
                      })
                    }
                    onFocus={(e) => {
                      if (requirements.maxPrice === 0) {
                        e.target.select();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                </div>

                {/* Hút thuốc - Yêu cầu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hút thuốc
                  </label>
                  <select
                    value={requirements.smokingPreference || 'any'}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        smokingPreference: e.target.value as 'smoker' | 'non_smoker' | 'any',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="any">Không quan trọng</option>
                    <option value="non_smoker">Không hút thuốc</option>
                    <option value="smoker">Hút thuốc</option>
                  </select>
                </div>

                {/* Thú cưng - Yêu cầu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thú cưng
                  </label>
                  <select
                    value={requirements.petsPreference || 'any'}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        petsPreference: e.target.value as 'has_pets' | 'no_pets' | 'any',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="any">Không quan trọng</option>
                    <option value="no_pets">Không có thú cưng</option>
                    <option value="has_pets">Có thú cưng</option>
                  </select>
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

