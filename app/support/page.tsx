"use client";

import { useState } from "react";
import { FaFacebook, FaEnvelope, FaInstagram, FaHeadset, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Footer from "@/components/common/Footer";

export default function SupportPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const contactInfo = {
    facebook: "https://www.facebook.com/minhquang.tran.9822/",
    email: "minhquang.yi@gmail.com",
    zalo: "0838849375",
    instagram: "https://www.instagram.com/_minhhquag.263/",
  };

  const handleOpenMail = () => {
    const to = encodeURIComponent(contactInfo.email);
    const subject = encodeURIComponent('Yêu cầu hỗ trợ');
    const body = encodeURIComponent('Xin chào,\n\nTôi cần hỗ trợ về:\n\n\n\nCảm ơn bạn!');
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
    
    // Mở Gmail ở tab mới; nếu bị chặn hoặc không khả dụng => fallback mailto
    const opened = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    
    // Một số trình duyệt/thiết lập có thể block window.open -> fallback
    if (!opened) {
      window.location.href = `mailto:${contactInfo.email}?subject=${subject}&body=${body}`;
    }
  };

  const faqs = [
    {
      question: "Làm thế nào để đăng tin cho thuê phòng?",
      answer: "Bạn có thể đăng tin bằng cách đăng nhập vào tài khoản, chọn \"Đăng tin\" và điền đầy đủ thông tin về phòng của bạn. Hệ thống sẽ yêu cầu bạn cung cấp thông tin về địa chỉ, giá thuê, diện tích, tiện ích và hình ảnh phòng."
    },
    {
      question: "Tôi gặp lỗi khi sử dụng hệ thống, phải làm sao?",
      answer: "Vui lòng liên hệ với chúng tôi qua email, Zalo hoặc Instagram. Chúng tôi sẽ hỗ trợ bạn giải quyết vấn đề trong thời gian sớm nhất. Bạn cũng có thể mô tả chi tiết lỗi gặp phải để chúng tôi xử lý nhanh hơn."
    },
    {
      question: "Làm sao để tìm phòng phù hợp với nhu cầu?",
      answer: "Bạn có thể sử dụng bộ lọc tìm kiếm trên trang chủ để tìm phòng theo khu vực, giá cả, loại phòng và các tiêu chí khác. Hệ thống sẽ hiển thị danh sách phòng phù hợp với yêu cầu của bạn."
    },
    {
      question: "Tôi có thể xem phòng trước khi thuê không?",
      answer: "Có, bạn có thể liên hệ trực tiếp với chủ nhà qua thông tin liên hệ được cung cấp trong bài đăng để sắp xếp lịch xem phòng. Chúng tôi khuyến khích bạn xem phòng trực tiếp để đảm bảo phòng đáp ứng đúng nhu cầu của mình."
    },
    {
      question: "Làm thế nào để thanh toán tiền thuê phòng?",
      answer: "Hệ thống hỗ trợ nhiều phương thức thanh toán như ZaloPay, MoMo, thẻ ngân hàng và tiền mặt. Bạn có thể chọn phương thức thanh toán phù hợp khi thực hiện giao dịch trên hệ thống."
    },
    {
      question: "Tôi có thể hủy hợp đồng thuê phòng không?",
      answer: "Việc hủy hợp đồng phụ thuộc vào điều khoản trong hợp đồng thuê. Bạn nên thảo luận với chủ nhà về điều kiện hủy hợp đồng và các khoản phí (nếu có) trước khi ký kết."
    },
    {
      question: "Làm sao để báo cáo tin đăng giả mạo hoặc lừa đảo?",
      answer: "Nếu bạn phát hiện tin đăng giả mạo hoặc có dấu hiệu lừa đảo, vui lòng liên hệ ngay với chúng tôi qua email hoặc Zalo. Chúng tôi sẽ xử lý và gỡ bỏ tin đăng vi phạm trong thời gian sớm nhất."
    },
    {
      question: "Tôi có thể chỉnh sửa thông tin phòng đã đăng không?",
      answer: "Có, bạn có thể chỉnh sửa thông tin phòng đã đăng bằng cách vào mục \"Quản lý tin đăng\" trong tài khoản của bạn. Tại đây, bạn có thể cập nhật giá, mô tả, hình ảnh và các thông tin khác."
    },
    {
      question: "Hệ thống có hỗ trợ tìm người ở ghép không?",
      answer: "Có, hệ thống có tính năng tìm người ở ghép. Bạn có thể đăng tin tìm người ở ghép hoặc tìm kiếm các tin đăng ở ghép phù hợp với nhu cầu của mình trên trang \"Tìm phòng/Ở ghép\"."
    }
  ];

  const totalPages = Math.ceil(faqs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFaqs = faqs.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-100 mb-6">
            <FaHeadset className="h-10 w-10 text-teal-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Trung tâm hỗ trợ</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn mọi lúc, mọi nơi. Liên hệ với chúng tôi qua các kênh dưới đây.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Facebook */}
          <a
            href={contactInfo.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-teal-500 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                <FaFacebook className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Facebook</h3>
              <p className="text-sm text-gray-600 mb-4">Kết nối với chúng tôi</p>
              <span className="text-sm font-medium text-teal-600 group-hover:text-teal-700">
                Truy cập trang →
              </span>
            </div>
          </a>

          {/* Email */}
          <button
            type="button"
            onClick={handleOpenMail}
            className="w-full bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-teal-500 group text-left"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4 group-hover:bg-teal-500 transition-colors">
                <FaEnvelope className="h-8 w-8 text-teal-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-sm text-gray-600 mb-4 break-all">{contactInfo.email}</p>
              <span className="text-sm font-medium text-teal-600 group-hover:text-teal-700">
                Gửi email →
              </span>
            </div>
          </button>

          {/* Zalo */}
          <a
            href={`https://zalo.me/${contactInfo.zalo.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-teal-500 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                <svg className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.57L5.06 16.27C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.4 7.87 7.54C7.65 7.68 7.5 7.93 7.5 8.28L7.58 8.5L8.04 9.93L6.8 10.45L6.8 10.46C6.54 10.58 6.3 10.84 6.3 11.24C6.3 11.5 6.42 11.7 6.59 11.85C6.76 12 7 12.1 7.27 12.1H11.18C11.18 12.1 11.32 12.09 11.32 11.96C11.32 11.94 11.33 11.92 11.33 11.91C11.33 11.8 11.31 11.73 11.25 11.65C11.19 11.57 11.1 11.5 10.96 11.5C10.96 11.5 9.78 11.5 9.65 11.5C9.5 11.5 9.35 11.4 9.3 11.25C9.25 11.1 9.3 10.95 9.4 10.85L11.18 9.18C11.24 9.12 11.3 9.06 11.3 8.96C11.3 8.85 11.24 8.76 11.18 8.7L9.4 7.03C9.3 6.93 9.25 6.78 9.3 6.63C9.35 6.48 9.5 6.38 9.65 6.38C9.78 6.38 10.96 6.38 10.96 6.38C11.1 6.38 11.19 6.31 11.25 6.23C11.31 6.15 11.33 6.08 11.33 5.97C11.33 5.85 11.31 5.74 11.25 5.66C11.19 5.58 11.1 5.5 10.96 5.5H7.27C6.95 5.5 6.68 5.65 6.5 5.85C6.31 6.05 6.2 6.33 6.2 6.65C6.2 7.1 6.42 7.5 6.8 7.75L8.04 8.27L7.58 9.7L7.5 9.92C7.5 10.27 7.35 10.52 7.13 10.66C6.9 10.8 6.63 10.87 6.47 10.87H6.26C6.1 10.87 5.95 10.8 5.84 10.67C5.73 10.54 5.67 10.4 5.67 10.24V9.97C5.67 9.65 5.78 9.37 5.97 9.17C6.15 8.97 6.42 8.82 6.74 8.82H8.53V7.33M16.59 9.3C16.5 9.3 16.41 9.33 16.33 9.35C16.25 9.37 16.18 9.4 16.12 9.44L13.5 11.5C13.42 11.55 13.37 11.61 13.37 11.71C13.37 11.86 13.5 11.96 13.67 11.96C13.67 11.96 14.85 11.96 14.98 11.96C15.13 11.96 15.28 12.06 15.33 12.21C15.38 12.36 15.33 12.51 15.23 12.61L13.45 14.28C13.39 14.34 13.33 14.4 13.33 14.5C13.33 14.61 13.39 14.7 13.45 14.76L15.23 16.43C15.33 16.53 15.38 16.68 15.33 16.83C15.28 16.98 15.13 17.08 14.98 17.08C14.85 17.08 13.67 17.08 13.67 17.08C13.5 17.08 13.37 17.18 13.37 17.33C13.37 17.44 13.42 17.5 13.5 17.55L16.12 19.61C16.18 19.65 16.25 19.68 16.33 19.7C16.41 19.72 16.5 19.75 16.59 19.75H20.28C20.6 19.75 20.87 19.6 21.05 19.4C21.24 19.2 21.35 18.92 21.35 18.6C21.35 18.15 21.13 17.75 20.75 17.5L19.51 16.98L20.03 15.55L20.11 15.33C20.11 14.98 20.26 14.73 20.48 14.59C20.71 14.45 20.98 14.38 21.14 14.38H21.35C21.51 14.38 21.66 14.45 21.77 14.58C21.88 14.71 21.94 14.85 21.94 15.01V15.28C21.94 15.6 21.83 15.88 21.64 16.08C21.46 16.28 21.19 16.43 20.87 16.43H19.08V17.92H20.87C21.19 17.92 21.46 18.07 21.64 18.27C21.83 18.47 21.94 18.75 21.94 19.07C21.94 19.39 21.83 19.67 21.64 19.87C21.46 20.07 21.19 20.22 20.87 20.22H16.59Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Zalo</h3>
              <p className="text-sm text-gray-600 mb-4">{contactInfo.zalo}</p>
              <span className="text-sm font-medium text-teal-600 group-hover:text-teal-700">
                Nhắn tin Zalo →
              </span>
            </div>
          </a>

          {/* Instagram */}
          <a
            href={contactInfo.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-teal-500 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center mb-4 group-hover:opacity-90 transition-opacity">
                <FaInstagram className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instagram</h3>
              <p className="text-sm text-gray-600 mb-4">@_minhhquag.263</p>
              <span className="text-sm font-medium text-teal-600 group-hover:text-teal-700">
                Theo dõi ngay →
              </span>
            </div>
          </a>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin hỗ trợ</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Giờ làm việc
                </h3>
                <p className="text-gray-600 ml-7">Thứ 2 - Thứ 6: 9:00 - 20:00</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Thời gian phản hồi
                </h3>
                <p className="text-gray-600 ml-7">
                  Chúng tôi cam kết phản hồi trong vòng 24 giờ qua email và trong vòng 2 giờ qua Zalo/Instagram.
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Dịch vụ hỗ trợ
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Hướng dẫn sử dụng hệ thống</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Giải đáp thắc mắc về dịch vụ</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Hỗ trợ kỹ thuật</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Tư vấn về đăng tin và tìm phòng</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Xử lý khiếu nại và phản ánh</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Câu hỏi thường gặp</h2>
          <div className="space-y-6 mb-6">
            {currentFaqs.map((faq, index) => (
              <div key={startIndex + index}>
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                }`}
              >
                <FaChevronLeft className="h-4 w-4" />
                Trước
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                      currentPage === page
                        ? "bg-teal-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                }`}
              >
                Sau
                <FaChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

