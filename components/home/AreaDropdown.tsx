'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AddressSelector from '@/components/common/AddressSelector';
import type { Address } from '@/services/address';

interface AreaDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AreaDropdown({ isOpen, onClose }: AreaDropdownProps) {
  const { user } = useAuth();
  const userCity = (user as any)?.address?.city || (user as any)?.city || '';
  // Khởi tạo AddressSelector với city của user (nếu có)
  const [addr, setAddr] = useState<Address | null>(userCity ? ({ provinceName: userCity, city: userCity, provinceCode: '', ward: '', wardCode: '', wardName: '' } as any) : null);

  if (!isOpen) return null;

  // Lấy city từ hồ sơ user nếu có (tùy server trả về). Hiện chưa có type, nên dùng any an toàn.
  // Không cần thêm logic prefill khác; AddressSelector đã nhận value ban đầu từ userCity

  return (
    <div className="absolute top-full left-0 mt-2 z-50">
      {/* Modal */}
      <div className="relative bg-white/95 backdrop-blur-xl rounded-xl p-5 w-80 shadow-2xl border border-white/20">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Khu vực</h3>

        <div className="space-y-4">
          <AddressSelector
            value={addr}
            onChange={setAddr}
            fields={{ province: true, ward: false, street: false, specificAddress: false, additionalInfo: false, preview: false }}
          />
        </div>

        {/* Apply Button */}
        <button
          onClick={() => {
            try {
              const city = addr?.provinceName || userCity || 'TP. Hồ Chí Minh';
              if (typeof window !== 'undefined' && city) {
                localStorage.setItem('selectedCity', city);
                window.dispatchEvent(new CustomEvent('app:cityChanged', { detail: { city } }));
              }
            } catch {}
            onClose();
          }}
          className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
}
