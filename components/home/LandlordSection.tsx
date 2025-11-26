export default function LandlordSection(){
    return (
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        <img 
          src="/home/landlord-bg.png" 
          alt="Landlord background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
  
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Nếu bạn cũng có nơi ở cần cho thuê?
            </h2>
            <p className="text-xl md:text-2xl font-semibold text-white/90 mb-6">
              Hãy tham gia cùng chúng tôi
            </p>
            <button className="px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Đăng kí ngay để trở thành người cho thuê
            </button>
          </div>
        </div>
      </section>
    )
  }
  