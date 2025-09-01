"use client";
import { useRouter } from "next/navigation";

type Card = { 
  id:number; 
  title:string; 
  price:string; 
  specs:string; 
  area:string; 
  img:string;
  propertyType: string;
};

const items: Card[] = [
  { id:1, title:"Phòng Rộng Có Ban Công",     price:"2,8 triệu / tháng", specs:"25 m² • 01 PN • 01 WC", area:"Gò Vấp, Hồ Chí Minh", img:"/home/room1.png", propertyType: "cho-thue" },
  { id:2, title:"Studio Có Gác Lửng - Ở Ghép", price:"1,9 triệu / tháng", specs:"30 m² • 01 PN • 01 WC", area:"Phú Nhuận, Hồ Chí Minh", img:"/home/room2.png", propertyType: "o-ghep" },
  { id:3, title:"Căn Hộ Mini Có Thang Máy",   price:"4,2 triệu / tháng", specs:"35 m² • 01 PN • 01 WC", area:"Tân Bình, Hồ Chí Minh", img:"/home/room3.png", propertyType: "cho-thue" },
  { id:4, title:"Phòng Rộng Có Ban Công - Ở Ghép", price:"1,4 triệu / tháng", specs:"25 m² • 01 PN • 01 WC", area:"Gò Vấp, Hồ Chí Minh", img:"/home/room4.png", propertyType: "o-ghep" },
  { id:5, title:"Studio Cao Cấp Quận 1",      price:"5,5 triệu / tháng", specs:"40 m² • 01 PN • 01 WC", area:"Quận 1, Hồ Chí Minh", img:"/home/room1.png", propertyType: "cho-thue" },
  { id:6, title:"Căn Hộ Mini Bình Thạnh - Ở Ghép", price:"2,0 triệu / tháng", specs:"32 m² • 01 PN • 01 WC", area:"Bình Thạnh, Hồ Chí Minh", img:"/home/room2.png", propertyType: "o-ghep" },
  { id:7, title:"Phòng Trọ Gò Vấp",           price:"2,5 triệu / tháng", specs:"22 m² • 01 PN • 01 WC", area:"Gò Vấp, Hồ Chí Minh", img:"/home/room3.png", propertyType: "cho-thue" },
  { id:8, title:"Studio Phú Nhuận - Ở Ghép",  price:"2,4 triệu / tháng", specs:"38 m² • 01 PN • 01 WC", area:"Phú Nhuận, Hồ Chí Minh", img:"/home/room4.png", propertyType: "o-ghep" },
];

function CardItem({c}:{c:Card}) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/room_details?id=${c.id}&type=${c.propertyType}`);
  };

  return (
    <div 
      className="rounded-2xl overflow-hidden shadow border border-slate-100 bg-white hover:shadow-lg transition-shadow cursor-pointer hover:scale-105 transition-transform duration-300"
      onClick={handleCardClick}
    >
      <div className="relative">
        <img src={c.img} alt={c.title} className="h-44 w-full object-cover"/>
        <div className="absolute bottom-2 left-2 text-yellow-400 drop-shadow">★★★★★</div>
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-gray-900">{c.title}</h4>
        <p className="mt-1 text-sm text-slate-600">{c.specs}</p>
        <p className="text-sm text-slate-600">{c.area}</p>
        <p className="mt-2 font-bold text-teal-600">{c.price}</p>
      </div>
    </div>
  );
}

export default function Suggestions(){
  const scrollContainer = (direction: 'left' | 'right') => {
    const container = document.getElementById('suggestions-scroll');
    if (container) {
      const scrollAmount = 320; // width of one card + gap
      if (direction === 'left') {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  };

  return (
    <section className="py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between mb-3">
          <h3 className="text-2xl md:text-3xl font-bold text-teal-600">Gợi Ý Cho Bạn</h3>
          <button className="px-6 py-2 rounded-lg border border-slate-200 hover:bg-gray-50 transition-colors">
            Xem thêm
          </button>
        </div>
        
        {/* Slider Container */}
        <div className="relative">
          {/* Cards Container */}
          <div 
            id="suggestions-scroll"
            className="flex gap-6 overflow-x-hidden scroll-smooth pb-4"
          >
            {items.map(i => (
              <div key={i.id} className="flex-shrink-0 w-80">
                <CardItem c={i} />
              </div>
            ))}
          </div>
          
          {/* Chevron Left Button */}
          <button 
            onClick={() => scrollContainer('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Chevron Right Button */}
          <button 
            onClick={() => scrollContainer('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
