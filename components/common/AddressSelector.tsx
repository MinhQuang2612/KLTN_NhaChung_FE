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
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [street, setStreet] = useState('');
  const [specificAddress, setSpecificAddress] = useState('');
  const [showSpecificAddress, setShowSpecificAddress] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // Track last emitted value to avoid redundant onChange causing loops
  const lastEmittedRef = useRef<string | null>(null);
  
  // Search states
  const [provinceSearch, setProvinceSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showWardDropdown, setShowWardDropdown] = useState(false);
  
  // Track if component has been hydrated to prevent initial onChange emission
  const hasHydrated = useRef(false);
  const userTouchedRef = useRef(false);
  const lastHydratedJSON = useRef<string | null>(null);
  const isHydratingRef = useRef(false);
  const prevProvinceRef = useRef<string | null>(null);
  
  // Sync with value prop changes (hydrate once or when value truly changes externally)
  useEffect(() => {
    // If parent cleared value and we currently have something, reset
    if (!value) {
      hasHydrated.current = false;
      lastHydratedJSON.current = null;
      isHydratingRef.current = false;
      prevProvinceRef.current = null;
      setSelectedProvince('');
      setSelectedWard('');
      setProvinceSearch('');
      setWardSearch('');
      setStreet('');
      setSpecificAddress('');
      setShowSpecificAddress(false);
      setAdditionalInfo('');
      return;
    }

    const incoming = JSON.stringify(value);
    // 1) Skip echo from our own emit
    if (incoming === lastEmittedRef.current) return;
    // 2) Skip if identical to last hydration
    if (incoming === lastHydratedJSON.current) return;

    isHydratingRef.current = true;
    hasHydrated.current = true;
    lastHydratedJSON.current = incoming;

    const provinceChanged = value.provinceCode !== prevProvinceRef.current;

    // Always sync text fields
    if (value.street !== undefined) setStreet(value.street || '');
    if (value.specificAddress !== undefined) setSpecificAddress(value.specificAddress || '');
    setShowSpecificAddress(!!value.showSpecificAddress);
    if (value.additionalInfo !== undefined) setAdditionalInfo(value.additionalInfo || '');

    // Province and its name only when changed
    if (provinceChanged) {
      setSelectedProvince(value.provinceCode || '');
      setProvinceSearch(value.provinceName || '');
    }

    // Ward handling
    if (provinceChanged && value.provinceCode) {
      (async () => {
        try {
          const ws = await addressService.getWardsByProvince(value.provinceCode!);
          setWards(ws);
          if (value.wardCode) {
            const found = ws.find(w => w.wardCode === value.wardCode);
            if (found) {
              setSelectedWard(found.wardCode);
              setWardSearch(found.wardName);
            } else {
              setSelectedWard('');
              setWardSearch(value.wardName || '');
            }
          } else {
            setSelectedWard('');
            setWardSearch(value.wardName || '');
          }
        } finally {
          prevProvinceRef.current = value.provinceCode || null;
          isHydratingRef.current = false;
        }
      })();
    } else {
      if (value.wardName !== undefined) setWardSearch(value.wardName || '');
      if (value.wardCode !== undefined) setSelectedWard(value.wardCode || '');
      isHydratingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);


  // Load provinces on mount (separate loading flag)
  useEffect(() => {
    (async () => {
      setLoadingProvinces(true);
      try {
        const provincesData = await addressService.getProvinces();
        setProvinces(provincesData);
      } finally {
        setLoadingProvinces(false);
      }
    })();
  }, []);

  // Load wards when province changes (separate loading flag)
  useEffect(() => {
    if (!selectedProvince) {
      setWards([]);
      setSelectedWard('');
      return;
    }
    (async () => {
      setLoadingWards(true);
      try {
        const ws = await addressService.getWardsByProvince(selectedProvince);
        setWards(ws);
        if (!selectedWard && wardSearch) {
          const found = ws.find(w => w.wardName.toLowerCase().trim() === wardSearch.toLowerCase().trim());
          if (found) setSelectedWard(found.wardCode);
        }
      } finally {
        setLoadingWards(false);
      }
    })();
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

    // Do not emit while hydrating
    if (isHydratingRef.current) return;

    // Prefer resolving names from lists, but fall back to current search text to avoid races
    const provinceObj = selectedProvince ? provinces.find(p => p.provinceCode === selectedProvince) : undefined;
    const wardObj = selectedWard ? wards.find(w => w.wardCode === selectedWard) : undefined;

    const provinceNameResolved = provinceObj?.provinceName || provinceSearch || '';
    const wardNameResolved = wardObj?.wardName || wardSearch || '';

    // Build emitted value as long as codes are present (and ward if required)
    if (selectedProvince && (!showWard || wardNameResolved)) {
      emitted = {
        street: street || '',
        ward: wardNameResolved,
        city: provinceNameResolved,
        specificAddress: specificAddress || undefined,
        showSpecificAddress,
        provinceCode: selectedProvince,
        provinceName: provinceNameResolved,
        wardCode: selectedWard || '',
        wardName: wardNameResolved,
        additionalInfo: additionalInfo || undefined
      } as Address;
    }

    const serialized = emitted ? JSON.stringify(emitted) : 'null';
    // If equal to lastHydratedJSON, skip to avoid ping-pong
    if (serialized !== 'null' && serialized === lastHydratedJSON.current) {
      lastEmittedRef.current = serialized;
      return;
    }
    
    // Only emit if we have a valid address (not empty) and have hydrated
    if (
      lastEmittedRef.current !== serialized &&
      (hasHydrated.current || userTouchedRef.current) &&
      emitted &&
      selectedProvince &&
      (!showWard || wardNameResolved)
    ) {
      lastEmittedRef.current = serialized;
      onChange(emitted);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince, selectedWard, street, specificAddress, showSpecificAddress, additionalInfo, showWard, onChange, provinces, wards, provinceSearch, wardSearch]);

  const handleProvinceSelect = (province: Province) => {
    userTouchedRef.current = true;
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
    userTouchedRef.current = true;
    setSelectedWard(ward.wardCode);
    setWardSearch(ward.wardName);
    setShowWardDropdown(false);
  };

  const handleProvinceSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProvinceSearch(e.target.value);
    setShowProvinceDropdown(true);
  };

  const handleWardSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWardSearch(e.target.value);
    setShowWardDropdown(true);
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
          disabled={loadingProvinces}
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
          disabled={loadingWards || !selectedProvince}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
        />
        
        {/* Ward Dropdown */}
        {showWardDropdown && selectedProvince && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {loadingWards ? (
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
