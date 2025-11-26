export default function Footer(){
    return (
      <footer className="relative z-10">
        {/* Upper Section - Dark Background */}
        <div className="bg-gray-900 text-white py-8">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {/* Navigation Links */}
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div>
                <h6 className="font-semibold mb-3">Giới Thiệu</h6>
                <ul className="space-y-2 text-sm">
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Về Chúng Tôi</li>
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Đội Ngũ</li>
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Dự Án</li>
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Đối Tác</li>
                </ul>
              </div>

              <div>
                <h6 className="font-semibold mb-3">Dịch Vụ</h6>
                <ul className="space-y-2 text-sm">
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Thuê Nhà Trọ</li>
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Thuê Căn Hộ Mini/Studio</li>
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Thuê Nhà Nguyên Căn</li>
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Đăng Tin Ký Gửi</li>
                </ul>
              </div>

              <div>
                <h6 className="font-semibold mb-3">Hỗ Trợ Pháp Lý</h6>
                <ul className="space-y-2 text-sm">
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Đặt cọc giữ chỗ</li>
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Hợp đồng</li>
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Tư vấn pháp lý</li>
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Thẩm định giá</li>
                </ul>
              </div>

              <div>
                <h6 className="font-semibold mb-3">Liên Kết Đăng Tin</h6>
                <ul className="space-y-2 text-sm">
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Thuê Nhà Ở</li>
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Cho Thuê Nhà</li>
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Tìm Người Ở Ghép</li>
                  <li className="hover:text-teal-400 transition-colors cursor-pointer">Qui Định Đăng Tin</li>
                </ul>
              </div>
            </div>

            {/* Social Media and Payment Methods */}
            <div className="border-t border-gray-700 pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Social Media */}
                <div>
                  <h6 className="font-semibold mb-3">Kết Nối Với Chúng Tôi</h6>
                  <div className="flex gap-4">
                    <img src="/home/icon_social.png" alt="Social Media" className="h-10" />
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h6 className="font-semibold mb-3">Phương Thức Thanh Toán</h6>
                  <div className="flex gap-4 flex-wrap">
                    <img src="/home/zalo.svg" className="h-8" alt="ZaloPay"/>
                    <img src="/home/momo.svg" className="h-8" alt="MoMo"/>
                    <img src="/home/visa.svg" className="h-8" alt="Visa"/>
                    <img src="/home/cash.svg" className="h-8" alt="Cash"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section - Copyright */}
        <div className="bg-gray-800 py-4">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center">
              <p className="text-gray-300 text-sm">
                © 2025. PROPERTY_HOMESWEETHOME. ALL RIGHTS RESERVED.
              </p>
            </div>
          </div>
        </div>
      </footer>
    )
  }
  