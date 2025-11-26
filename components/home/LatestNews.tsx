const posts = [
    "Những bí kíp bỏ túi để chọn nhà đẹp và rẻ.",
    "Những mẹo thuê căn hộ an toàn khu quận 7.",
    "Check-list dọn vào nhà mới không thiếu thứ gì.",
    "Cách xem hợp đồng thuê nhà rõ ràng minh bạch.",
    "Ngân sách sinh viên – ở đâu cho hợp lý?",
  ];
  
  export default function LatestNews(){
    return (
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h3 className="text-2xl md:text-3xl font-bold text-teal-600 mb-6">
            Tin Tức Mới Nhất
          </h3>
          
          <div className="grid lg:grid-cols-3 gap-6 items-stretch">
            {/* Main Featured News */}
            <div className="relative h-80 lg:h-96 overflow-hidden rounded-2xl lg:col-span-2 shadow-lg hover:shadow-xl transition-shadow">
              <img src="/home/news.png" className="absolute inset-0 w-full h-full object-cover" alt="Tin nổi bật"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
              <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                <div className="bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-medium w-fit mb-3">
                  Tin Nổi Bật
                </div>
                <h4 className="text-2xl md:text-3xl font-bold max-w-2xl leading-tight">
                  Chung cư cao cấp đi vào hoạt động tại quận 7, nhiều căn hộ cho thuê.
                </h4>
                <p className="text-white/80 mt-2 text-sm">
                  Khám phá những căn hộ mới nhất với đầy đủ tiện nghi hiện đại
                </p>
              </div>
            </div>
    
            {/* Sidebar Articles */}
            <aside className="bg-white rounded-2xl border border-slate-200 p-5 shadow-lg">
              <h5 className="font-bold text-xl text-gray-900 mb-4">Bài viết mới</h5>
              <ul className="space-y-3">
                {posts.map((p,i)=>(
                  <li key={i} className="group cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-teal-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 group-hover:text-teal-600 transition-colors leading-relaxed">
                        {p}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              
              <button className="w-full mt-4 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors">
                Xem tất cả bài viết
              </button>
            </aside>
          </div>
        </div>
      </section>
    )
  }
  