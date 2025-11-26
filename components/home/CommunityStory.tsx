export default function CommunityStory(){
    return (
      <section className="py-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h3 className="text-2xl md:text-3xl font-bold text-teal-600 mb-3">
            Câu chuyện cộng đồng
          </h3>
          
          {/* Card layout với ảnh nền */}
          <div className="relative overflow-hidden rounded-2xl shadow-lg">
            <img 
              className="w-full h-80 md:h-96 object-cover"
              src="/home/community.jpg" 
              alt="Cộng đồng nhà chung" 
            />
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Content overlay */}
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-center">
              <div className="max-w-md">
                <blockquote className="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">
                  "Nhờ Nhà Chung, mình tìm được bạn ở ghép hợp ý"
                </blockquote>
                
                <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-sm">
                  Chia sẻ câu chuyện của bạn đến với cộng đồng "Nhà Chung"
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
  