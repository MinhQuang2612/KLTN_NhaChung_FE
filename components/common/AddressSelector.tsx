"use client";

import { useState, useEffect, useRef } from 'react';
import { addressService, Province, Ward, Address } from '../../services/address';

interface AddressSelectorProps {
  value: Address | null;
  onChange: (address: Address | null) => void;
  className?: string;
  // Cho phép ẩn bớt các phần để dùng ở survey: chỉ cần Tỉnh/Thành + Phường
  fields?: {
    street?: boolean;
    specificAddress?: boolean;
    additionalInfo?: boolean;
    preview?: boolean;
    province?: boolean;
    ward?: boolean;
  };
}

export default function AddressSelector({ value, onChange, className = "", fields }: AddressSelectorProps) {
  const showStreet = fields?.street ?? true;
  const showSpecific = fields?.specificAddress ?? true;
  const showAdditional = fields?.additionalInfo ?? true;
  const showPreview = fields?.preview ?? true;
  const showProvince = fields?.province ?? true;
  const showWard = fields?.ward ?? true;
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string>(value?.provinceCode || '');
  const [selectedWard, setSelectedWard] = useState<string>(value?.wardCode || '');
  const [street, setStreet] = useState(value?.street || '');
  const [specificAddress, setSpecificAddress] = useState(value?.specificAddress || '');
  const [showSpecificAddress, setShowSpecificAddress] = useState(value?.showSpecificAddress || false);
  const [additionalInfo, setAdditionalInfo] = useState(value?.additionalInfo || '');
  
  // Track last emitted value to avoid redundant onChange causing loops
  const lastEmittedRef = useRef<string | null>(null);
  
  // Search states
  const [provinceSearch, setProvinceSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showWardDropdown, setShowWardDropdown] = useState(false);

  // Sync with value prop changes (hydrate once or when value truly changes externally)
  useEffect(() => {
    // If parent cleared value and we currently have something, reset
    if (!value) {
      if (selectedProvince || selectedWard || street || specificAddress || additionalInfo) {
        setSelectedProvince('');
        setSelectedWard('');
        setStreet('');
        setSpecificAddress('');
        setShowSpecificAddress(false);
        setAdditionalInfo('');
        setProvinceSearch('');
        setWardSearch('');
      }
      return;
    }

    // Hydrate only when local state is empty (initial open) or when codes differ
    const needHydrate = (!selectedProvince && !selectedWard && !street && !specificAddress && !additionalInfo)
      || selectedProvince !== (value.provinceCode || '')
      || selectedWard !== (value.wardCode || '');

    if (needHydrate) {
      setSelectedProvince(value.provinceCode || '');
      setSelectedWard(value.wardCode || '');
      setStreet(value.street || '');
      setSpecificAddress(value.specificAddress || '');
      setShowSpecificAddress(value.showSpecificAddress || false);
      setAdditionalInfo(value.additionalInfo || '');
      setProvinceSearch(value.provinceName || '');
      setWardSearch(value.wardName || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      setLoading(true);
      try {
        const provincesData = await addressService.getProvinces();
        setProvinces(provincesData);
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    loadProvinces();
  }, []);

  // Load wards when province changes
  useEffect(() => {
    if (selectedProvince) {
      const loadWards = async () => {
        setLoading(true);
        try {
          console.log('Loading wards for province:', selectedProvince);
          const wardsData = await addressService.getWardsByProvince(selectedProvince);
          console.log('Wards data received:', wardsData);
          setWards(wardsData);
        } catch (error) {
          console.error('Error loading wards:', error);
        } finally {
          setLoading(false);
        }
      };

      loadWards();
    } else {
      setWards([]);
      setSelectedWard('');
    }
  }, [selectedProvince]);

  // Filter provinces based on search
  const filteredProvinces = provinces.filter(province =>
    province.provinceName.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  // Filter wards based on search
  const filteredWards = wards.filter(ward =>
    ward.wardName.toLowerCase().includes(wardSearch.toLowerCase())
  );

  // Update address when form values change
  useEffect(() => {
    let emitted: Address | null = null;

    if (selectedProvince && selectedWard) {
      const province = provinces.find(p => p.provinceCode === selectedProvince);
      const ward = wards.find(w => w.wardCode === selectedWard);
      
      if (province && ward) {
        emitted = {
          street: street || '',
          ward: ward.wardName,
          city: province.provinceName,
          specificAddress: specificAddress || undefined,
          showSpecificAddress,
          provinceCode: selectedProvince,
          provinceName: province.provinceName,
          wardCode: selectedWard,
          wardName: ward.wardName,
          additionalInfo: additionalInfo || undefined
        };
      }
    }

    const serialized = emitted ? JSON.stringify(emitted) : 'null';
    if (lastEmittedRef.current !== serialized) {
      lastEmittedRef.current = serialized;
      onChange(emitted);
    }
  }, [selectedProvince, selectedWard, street, specificAddress, showSpecificAddress, additionalInfo, provinces, wards]);

  const handleProvinceSelect = (province: Province) => {
    console.log('Province selected:', province);
    setSelectedProvince(province.provinceCode);
    setProvinceSearch(province.provinceName);
    setShowProvinceDropdown(false);
    setSelectedWard(''); // Reset ward when province changes
    setWardSearch('');
    setShowWardDropdown(false); // Close ward dropdown when province changes
    
    // Auto-open ward dropdown after a short delay to allow wards to load
    setTimeout(() => {
      setShowWardDropdown(true);
    }, 500);
  };

  const handleWardSelect = (ward: Ward) => {
    setSelectedWard(ward.wardCode);
    setWardSearch(ward.wardName);
    setShowWardDropdown(false);
  };

  const handleProvinceSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProvinceSearch(value);
    setShowProvinceDropdown(true);
    
    // Clear selection if search doesn't match selected province
    if (selectedProvince) {
      const selectedProvinceData = provinces.find(p => p.provinceCode === selectedProvince);
      if (!selectedProvinceData || !selectedProvinceData.provinceName.toLowerCase().includes(value.toLowerCase())) {
        setSelectedProvince('');
      }
    }
  };

  const handleWardSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWardSearch(value);
    setShowWardDropdown(true);
    
    // Clear selection if search doesn't match selected ward
    if (selectedWard) {
      const selectedWardData = wards.find(w => w.wardCode === selectedWard);
      if (!selectedWardData || !selectedWardData.wardName.toLowerCase().includes(value.toLowerCase())) {
        setSelectedWard('');
      }
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.address-selector')) {
        setShowProvinceDropdown(false);
        setShowWardDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`space-y-4 address-selector ${className}`}>
      {/* Province Selection */}
      {showProvince && (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tỉnh/Thành phố <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={provinceSearch}
          onChange={handleProvinceSearchChange}
          onFocus={() => setShowProvinceDropdown(true)}
          placeholder="Tìm kiếm tỉnh/thành phố..."
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
        />
        
        {/* Province Dropdown */}
        {showProvinceDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredProvinces.length > 0 ? (
              filteredProvinces.map((province) => (
                <div
                  key={province.provinceCode}
                  onClick={() => handleProvinceSelect(province)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {province.provinceName}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                Không tìm thấy tỉnh/thành phố
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Ward Selection */}
      {showWard && (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phường/Xã <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={wardSearch}
          onChange={handleWardSearchChange}
          onFocus={() => setShowWardDropdown(true)}
          placeholder="Tìm kiếm phường/xã..."
          disabled={loading || !selectedProvince}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
        />
        
        {/* Ward Dropdown */}
        {showWardDropdown && selectedProvince && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                Đang tải danh sách phường/xã...
              </div>
            ) : filteredWards.length > 0 ? (
              <>
                <div className="px-3 py-1 text-xs text-gray-400 border-b">
                  Tìm thấy {filteredWards.length} phường/xã
                </div>
                {filteredWards.map((ward) => (
                  <div
                    key={ward.wardCode}
                    onClick={() => handleWardSelect(ward)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {ward.wardName}
                  </div>
                ))}
              </>
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                {selectedProvince ? "Không tìm thấy phường/xã" : "Chọn Tỉnh/Thành phố để hiện danh sách phường"}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Street */}
      {showStreet && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên đường
        </label>
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="Nhập tên đường (tùy chọn)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>
      )}

      {/* Specific Address */}
      {showSpecific && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Địa chỉ cụ thể
        </label>
        <div className="flex gap-4">
          <input
            type="text"
            value={specificAddress}
            onChange={(e) => setSpecificAddress(e.target.value)}
            placeholder="Nhập địa chỉ cụ thể (số nhà, tòa nhà...)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSpecificAddress}
              onChange={(e) => setShowSpecificAddress(e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Hiển thị địa chỉ cụ thể</span>
          </label>
        </div>
      </div>
      )}

      {/* Additional Info */}
      {showAdditional && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Thông tin bổ sung
        </label>
        <textarea
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Ví dụ: Gần chợ, trường học, bệnh viện..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>
      )}

      {/* Preview */}
      {showPreview && value && (
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <strong>Địa chỉ:</strong> {addressService.formatAddressForDisplay(value)}
          </p>
        </div>
      )}
    </div>
  );
}
