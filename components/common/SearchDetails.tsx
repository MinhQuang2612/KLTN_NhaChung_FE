"use client";
import { useState } from "react";

const ALL_CHIPS = [
  "Phường Hạnh Thông",
  "Có gác",
  "Giá dưới 5 triệu",
  "Phường Bến Thành",
  "Có ban công",
  "2 phòng ngủ",
  "Máy lạnh",
];

const FILTER_OPTIONS = {
  rentType: ["Cho thuê", "Ở ghép", "Tất cả"],
  roomType: ["Phòng trọ", "Chung cư", "Nhà nguyên căn", "Tất cả"],
  furniture: ["Có nội thất", "Không nội thất", "Bán nội thất", "Tất cả"],
  demand: ["Nam", "Nữ", "Nam/Nữ", "Tất cả"]
};

export default function SearchDetails() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState({
    rentType: "Tất cả",
    roomType: "Tất cả",
    furniture: "Tất cả",
    demand: "Tất cả"
  });

  const toggle = (name: string) => {
    setSelected((cur) => (cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]));
  };

  const handleSearch = () => {
    // Lưu từ khóa từ ô input nếu có
    if (q.trim()) {
      setRecentSearches(prev => {
        const newSearches = [q.trim(), ...prev.filter(item => item !== q.trim())];
        return newSearches.slice(0, 5);
      });
    }
    
    // Lưu các chips đã được chọn
    if (selected.length > 0) {
      setRecentSearches(prev => {
        const newSearches = [...selected, ...prev.filter(item => !selected.includes(item))];
        return newSearches.slice(0, 5);
      });
    }
    
    console.log("search:", q, selected, activeFilters);
  };

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
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <section className="relative bg-gray-50 pt-12 pb-6" data-search-details>
      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-600 mb-4">
          <span className="hover:text-teal-600 cursor-pointer">Nhà chung</span>
          <span className="mx-2">/</span>
          <span className="hover:text-teal-600 cursor-pointer">Thuê phòng trọ TP. Hồ Chí Minh</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium">Phòng trọ Quận Gò Vấp</span>
        </div>

        {/* Main heading */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Hơn 500 phòng trọ ở Quận Gò Vấp cập nhật 07/2025
          </h1>
        </div>

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
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_CHIPS.map((c) => {
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

          {/* Recent searches and clear filters */}
          <div className="flex items-center gap-3 text-sm text-gray-600 border-t border-gray-200 pt-3">
            {recentSearches.length > 0 ? (
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
        </div>
      </div>
    </section>
  );
}
