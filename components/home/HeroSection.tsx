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

export default function HeroSection() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>(["Phường Hạnh Thông", "Có gác"]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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
    
    console.log("search:", q, selected);
  };

  const clearFilters = () => {
    setSelected([]); // Chỉ xóa chips được chọn, không xóa recent searches
  };

  const clearSearch = () => {
    setQ("");
  };

  const handleRecentClick = (searchTerm: string) => {
    setQ(searchTerm);
  };

  return (
    <section className="relative min-h-[500px] flex items-center">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 -z-10">
        <img src="/home/hero-pg.jpg" alt="hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white mb-2">
            "Tìm chỗ ở,
          </h1>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            tìm người bạn chung nhà"
          </h1>

        </div>

        {/* Search card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-5 md:p-6 w-full max-w-4xl mx-auto border border-white/20">
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
                placeholder="Phòng trọ Hạnh Thông, có máy lạnh, dưới 5 triệu"
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
              Tìm kiếm
            </button>
          </div>

          {/* Filter chips */}
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
