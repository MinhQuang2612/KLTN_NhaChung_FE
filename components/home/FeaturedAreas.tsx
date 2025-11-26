"use client";

const areas = [
    { name:"TP. Hồ Chí Minh", stat:"20,000+ nơi ở chờ bạn", img:"/home/hcm.png" },
    { name:"TP. Đà Nẵng",     stat:"5,000+ nơi ở chờ bạn",  img:"/home/dn.png" },
    { name:"TP. Hà Nội",      stat:"15,000+ nơi ở chờ bạn", img:"/home/hn.png" },
    { name:"TP. Cần Thơ",     stat:"3,000+ nơi ở chờ bạn",  img:"/home/hcm.png" },
    { name:"TP. Đà Lạt",      stat:"2,500+ nơi ở chờ bạn",  img:"/home/dn.png" },
    { name:"TP. Nha Trang",   stat:"4,000+ nơi ở chờ bạn",  img:"/home/hn.png" },
  ];
  
  export default function FeaturedAreas(){
    const scrollContainer = (direction: 'left' | 'right') => {
      const container = document.getElementById('areas-scroll');
      if (container) {
        const scrollAmount = 400; // width of one card + gap
        if (direction === 'left') {
          container.scrollLeft -= scrollAmount;
        } else {
          container.scrollLeft += scrollAmount;
        }
      }
    };

    return (
      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl md:text-3xl font-bold text-teal-600 mb-4">Khu vực nổi bật</h3>
          
          {/* Slider Container */}
          <div className="relative">
            {/* Cards Container */}
            <div 
              id="areas-scroll"
              className="flex gap-6 overflow-x-hidden scroll-smooth pb-4"
            >
              {areas.map((a, index) => (
                <div key={index} className="flex-shrink-0 w-80 relative overflow-hidden rounded-2xl shadow-lg group cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <img src={a.img} alt={a.name} className="h-48 w-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors duration-300" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                    <div className="text-lg font-semibold group-hover:text-xl transition-all duration-300">{a.name}</div>
                    <div className="text-sm opacity-90 group-hover:opacity-100 group-hover:text-base transition-all duration-300">{a.stat}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chevron Left Button */}
            <button 
              onClick={() => scrollContainer('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-2 shadow-lg hover:shadow-xl hover:scale-110 hover:bg-gray-50 transition-all duration-300 z-10"
            >
              <svg className="w-6 h-6 text-slate-600 hover:text-teal-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Chevron Right Button */}
            <button 
              onClick={() => scrollContainer('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-2 shadow-lg hover:shadow-xl hover:scale-110 hover:bg-gray-50 transition-all duration-300 z-10"
            >
              <svg className="w-6 h-6 text-slate-600 hover:text-teal-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    )
  }
  