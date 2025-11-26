const items = [
  {
    number: "1",
    title: "Tìm kiếm nhanh chóng",
    desc:
      "Chỉ vài giây để tìm ra phòng trọ hoặc người ở ghép phù hợp với nhu cầu của bạn. Bộ lọc thông minh và AI hỗ trợ giúp bạn không bỏ lỡ lựa chọn tốt nhất.",
    icon: "/home/icon-search.png",
  },
  {
    number: "2",
    title: "An tâm, uy tín",
    desc:
      "Tất cả thông tin chủ nhà và phòng đều được xác thực rõ ràng. Bạn thuê phòng với sự yên tâm tuyệt đối từ quy trình kiểm duyệt của Nhà Chung.",
    icon: "/home/logo.webp",
  },
  {
    number: "3",
    title: "Kết nối",
    desc:
      "Không chỉ tìm được chỗ ở, bạn còn tìm được những người bạn cùng chia sẻ cuộc sống. Tạo dựng cộng đồng ấm áp, tôn trọng và hỗ trợ lẫn nhau.",
    icon: "/home/icon-network.png",
  },
  {
    number: "4",
    title: "Tiện lợi",
    desc:
      "Thanh toán tiền trọ và nhận thông báo ngay trên điện thoại qua Zalo. Mọi giao dịch minh bạch, nhanh gọn và luôn sẵn sàng 24/7.",
    icon: "/home/icon-money.png",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-10 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-teal-600 mb-8">
          Tại sao nên tìm tổ ấm ở nhà chung?
        </h2>

        {/* Grid Layout 2x2 */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
          {items.map((item, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={item.icon}
                    alt={item.title}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    {item.number}. {item.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-base">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}