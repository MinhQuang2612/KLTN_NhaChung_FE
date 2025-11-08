"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProfile, UserProfile } from "@/services/userProfiles";
import { parseIntent } from "@/utils/searchIntent";

// Filter cơ bản (luôn hiển thị)
const BASE_CHIPS = [
  "Giá dưới 3 triệu",
  "Giá từ 3-5 triệu", 
  "Giá từ 5-10 triệu",
  "Diện tích trên 20m²",
  "Diện tích trên 30m²",
  "Có máy lạnh",
  "Có ban công",
  "Có gác",
  "Bao điện nước",
  "2 phòng ngủ",
  "3 phòng ngủ",
];

// Filter đơn giản (ít hơn)
const SIMPLIFIED_CHIPS = [
  "Giá dưới 5 triệu",
  "Có máy lạnh",
  "Gần Quận 1",
  "Phòng trọ",
];

const FILTER_OPTIONS = {
  rentType: ["Cho thuê", "Ở ghép", "Tất cả"],
  roomType: ["Phòng trọ", "Chung cư", "Nhà nguyên căn", "Tất cả"],
  furniture: ["Có nội thất", "Không nội thất", "Bán nội thất", "Tất cả"],
  demand: ["Nam", "Nữ", "Nam/Nữ", "Tất cả"]
};

export default function SearchDetails({
  hideChips = false,
  hideRecentSearches = false,
  simplifiedChips = false,
  hideTitles = false,
  hideWrapper = false,
  redirectToFindShare = false,
}: {
  hideChips?: boolean;
  hideRecentSearches?: boolean;
  simplifiedChips?: boolean;
  hideTitles?: boolean;
  hideWrapper?: boolean;
  redirectToFindShare?: boolean;
} = {}) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const isFirstLoadRef = useRef(true);
  const [selected, setSelected] = useState<string[]>([]); // Tắt filter sẵn
  const [mounted, setMounted] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    rentType: "Tất cả",
    roomType: "Tất cả",
    furniture: "Tất cả",
    demand: "Tất cả"
  });
  const recentSearchKey = useMemo(() => {
    if (user?.userId) {
      return `recentSearches_user_${user.userId}`;
    }
    return "recentSearches_guest";
  }, [user?.userId]);

  // Sinh filter dựa trên profile user
  const personalizedChips = useMemo(() => {
    if (simplifiedChips) return SIMPLIFIED_CHIPS;
    
    const chips = [...BASE_CHIPS];
    
    // Chỉ sinh filter cá nhân hóa khi có user và profile
    if (user && profile) {
      // Filter theo thành phố
      if (profile.preferredCity) {
        const cityName = profile.preferredCity.replace(/TP\.|Thành phố\s*/i, '').trim();
        chips.unshift(`Gần ${cityName}`);
        chips.unshift(`Phường ${cityName}`);
      }
      
      // Filter theo giới tính (cho ở ghép)
      if ((profile as any).gender) {
        if ((profile as any).gender === 'male') {
          chips.push("Ở ghép nam");
        } else if ((profile as any).gender === 'female') {
          chips.push("Ở ghép nữ");
        }
      }
      
      // Filter theo ngân sách
      if ((profile as any).budgetRange?.max) {
        if ((profile as any).budgetRange.max < 3000000) {
          chips.unshift("Giá dưới 2 triệu");
        } else if ((profile as any).budgetRange.max < 5000000) {
          chips.unshift("Giá dưới 4 triệu");
        } else if ((profile as any).budgetRange.max < 10000000) {
          chips.unshift("Giá dưới 8 triệu");
        }
      }
      
      // Filter theo quận/phường ưa thích
      if ((profile as any).preferredDistricts?.length) {
        (profile as any).preferredDistricts.slice(0, 2).forEach((district: any) => {
          chips.unshift(`Quận ${district}`);
        });
      }
      
      if (profile.preferredWards?.length) {
        profile.preferredWards.slice(0, 2).forEach(ward => {
          chips.unshift(`Phường ${ward}`);
        });
      }
      
      // Filter theo loại phòng ưa thích
      if (profile.roomType?.length) {
        profile.roomType.forEach(type => {
          if (type === 'phong-tro') chips.push("Phòng trọ");
          else if (type === 'chung-cu') chips.push("Chung cư");
          else if (type === 'nha-nguyen-can') chips.push("Nhà nguyên căn");
        });
      }
      
      // Filter theo tiện ích ưa thích
      if ((profile as any).amenities?.length) {
        (profile as any).amenities.forEach((amenity: any) => {
          if (amenity === 'air_conditioning') chips.push("Có máy lạnh");
          else if (amenity === 'balcony') chips.push("Có ban công");
          else if (amenity === 'parking') chips.push("Có chỗ đỗ xe");
          else if (amenity === 'elevator') chips.push("Có thang máy");
        });
      }
      
      // Filter theo lifestyle
      if ((profile as any).lifestyle === 'quiet') {
        chips.push("Yên tĩnh");
      } else if ((profile as any).lifestyle === 'social') {
        chips.push("Năng động");
      }
    }
    
    return chips;
  }, [profile, user, simplifiedChips]);

  // Load profile khi component mount (bỏ qua landlord)
  useEffect(() => {
    (async () => {
      try {
        // Chỉ gọi khi user đã sẵn sàng và không phải landlord
        if (user && (user as any)?.role !== 'landlord') {
          const userProfile = await getMyProfile();
          setProfile(userProfile as any);
        } else {
          setProfile(null);
        }
      } catch (error) {
        // Không có profile, dùng filter cơ bản
      }
    })();
  }, [user?.role]);

  // Load recent searches từ localStorage sau khi mount (chỉ trên client)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(recentSearchKey);
        if (saved) {
          setRecentSearches(JSON.parse(saved));
        } else {
          setRecentSearches([]);
        }
      } catch {
        // Ignore
      }
    }
  }, [recentSearchKey]);

  const toggle = (name: string) => {
    setSelected((cur) => (cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]));
  };

  const pushQueryToUrl = (value: string) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set('q', value.trim());
    else url.searchParams.delete('q');
    
    // Suy luận ý định "ở ghép" và giới tính từ câu truy vấn tự nhiên
    const { isRoommate, gender } = parseIntent(value);
    
    if (isRoommate) {
      url.searchParams.set('roommate', 'true');
      if (gender) url.searchParams.set('searcherGender', gender);
      else url.searchParams.delete('searcherGender');
    } else {
      url.searchParams.delete('roommate');
      url.searchParams.delete('searcherGender');
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const emitSearchEvent = (value: string) => {
    if (typeof window === 'undefined') return;
    const trimmed = value.trim();
    window.dispatchEvent(new CustomEvent('app:nlp-search', { detail: { q: trimmed } }));
    // Nếu sử dụng ở trang không có PropertyList (ví dụ trang chủ), điều hướng sang /find_share
    try {
      const curPath = window.location.pathname;
      if (redirectToFindShare && curPath !== '/find_share') {
        const url = new URL(window.location.origin + '/find_share');
        if (trimmed) url.searchParams.set('q', trimmed);
        window.location.href = url.toString();
      }
    } catch {}
  };

  const handleSearch = () => {
    // Lưu từ khóa từ ô input nếu có
    if (q.trim()) {
      setRecentSearches(prev => {
        const newSearches = [q.trim(), ...prev.filter(item => item !== q.trim())];
        const limited = newSearches.slice(0, 5);
        // Lưu vào localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(recentSearchKey, JSON.stringify(limited));
          } catch {}
        }
        return limited;
      });
    }
    
    // Lưu các chips đã được chọn
    if (selected.length > 0) {
      setRecentSearches(prev => {
        const newSearches = [...selected, ...prev.filter(item => !selected.includes(item))];
        const limited = newSearches.slice(0, 5);
        // Lưu vào localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(recentSearchKey, JSON.stringify(limited));
          } catch {}
        }
        return limited;
      });
    }
    
    pushQueryToUrl(q);
    emitSearchEvent(q);
  };

  // Clear query từ URL khi reload (user reload = không muốn search nữa)
  // Input luôn trống khi mount để load suggestions
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const urlQ = url.searchParams.get('q');
    
    // Clear query params khi có query trong URL (coi như reload)
    // Để input trống và PropertyList sẽ load suggestions
    if (urlQ) {
      url.searchParams.delete('q');
      url.searchParams.delete('roommate');
      url.searchParams.delete('searcherGender');
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
    
    // Input luôn trống khi mount
    setQ("");
  }, []);

  const clearFilters = () => {
    setSelected([]); // Xóa chips được chọn
    setActiveFilters({
      rentType: "Tất cả",
      roomType: "Tất cả", 
      furniture: "Tất cả",
      demand: "Tất cả"
    }); // Trả về mặc định
  };

  const clearSearch = () => {
    setQ("");
  };

  const handleRecentClick = (searchTerm: string) => {
    setQ(searchTerm);
    // Trigger search ngay khi click vào recent search
    pushQueryToUrl(searchTerm);
    emitSearchEvent(searchTerm);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const content = (
    <>
      {/* Breadcrumbs */}
      {!hideTitles && (
        <div className="text-sm text-gray-600 mb-4">
          <span className="hover:text-teal-600 cursor-pointer">Nhà chung</span>
          <span className="mx-2">/</span>
          <span className="hover:text-teal-600 cursor-pointer">Thuê phòng trọ TP. Hồ Chí Minh</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium">Phòng trọ Quận Gò Vấp</span>
        </div>
      )}

      {/* Main heading */}
      {!hideTitles && (
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Hơn 500 phòng trọ ở Quận Gò Vấp cập nhật 07/2025
          </h1>
        </div>
      )}

      {/* Search card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full border border-gray-200">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Phòng trọ Hạnh thông, có máy lạnh, dưới 5 triệu"
                className="w-full rounded-xl border border-gray-200 px-10 py-3 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent pr-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              {q && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              className="shrink-0 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              onClick={handleSearch}
            >
              Tìm
            </button>
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Cho thuê dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium flex items-center gap-2 hover:bg-teal-600 transition-colors">
                {activeFilters.rentType}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                {FILTER_OPTIONS.rentType.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleFilterChange('rentType', option)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Phòng trọ dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium flex items-center gap-2 hover:bg-teal-600 transition-colors">
                {activeFilters.roomType}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                {FILTER_OPTIONS.roomType.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleFilterChange('roomType', option)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Tình trạng nội thất dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium flex items-center gap-2 hover:bg-teal-600 transition-colors">
                {activeFilters.furniture}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                {FILTER_OPTIONS.furniture.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleFilterChange('furniture', option)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Nhu cầu dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium flex items-center gap-2 hover:bg-teal-600 transition-colors">
                {activeFilters.demand}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                {FILTER_OPTIONS.demand.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleFilterChange('demand', option)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter chips (gợi ý tìm kiếm) */}
          {!hideChips && (
            <div className="flex flex-wrap gap-2 mb-4">
              {personalizedChips.map((c) => {
                const active = selected.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggle(c)}
                    aria-pressed={active}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 select-none ${
                      active
                        ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md ring-1 ring-teal-500/30 hover:from-teal-600 hover:to-teal-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800 border border-gray-200"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent searches and clear filters */}
          {!hideRecentSearches && (
            <div className="flex items-center gap-3 text-sm text-gray-600 border-t border-gray-200 pt-3">
              {mounted && recentSearches.length > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span className="font-medium">Đã tìm gần đây:</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {recentSearches.map((r, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentClick(r)}
                        className="px-2 py-1 bg-gray-100 rounded-md text-gray-700 border border-gray-200 hover:bg-gray-200 hover:text-gray-800 transition-colors cursor-pointer"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <span className="font-medium text-gray-500">Chưa có tìm kiếm gần đây</span>
                </div>
              )}
              <button 
                onClick={clearFilters} 
                className="ml-auto text-teal-600 hover:text-teal-700 font-medium hover:underline transition-colors"
              >
                Xóa lọc
              </button>
            </div>
          )}
        </div>
    </>
  );

  if (hideWrapper) {
    return content;
  }

  return (
    <section className="relative bg-gray-50 pt-12 pb-6" data-search-details>
      <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
        {content}
      </div>
    </section>
  );
}
