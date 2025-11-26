// Generic toast messages có thể dùng chung cho nhiều nghiệp vụ

export const ToastMessages = {
  // Success messages
  success: {
    save: (item: string = 'Dữ liệu') => ({
      title: 'Lưu thành công!',
      message: `${item} đã được lưu thành công`
    }),
    
    update: (item: string = 'Dữ liệu') => ({
      title: 'Cập nhật thành công!',
      message: `${item} đã được cập nhật thành công`
    }),
    
    delete: (item: string = 'Dữ liệu') => ({
      title: 'Xóa thành công!',
      message: `${item} đã được xóa thành công`
    }),
    
    create: (item: string = 'Dữ liệu') => ({
      title: 'Tạo thành công!',
      message: `${item} đã được tạo thành công`
    }),
    
    upload: (item: string = 'File') => ({
      title: 'Tải lên thành công!',
      message: `${item} đã được tải lên thành công`
    }),
    
    download: (item: string = 'File') => ({
      title: 'Tải xuống thành công!',
      message: `${item} đã được tải xuống thành công`
    }),
    
    send: (item: string = 'Thông tin') => ({
      title: 'Gửi thành công!',
      message: `${item} đã được gửi thành công`
    }),
    
    connect: () => ({
      title: 'Kết nối thành công!',
      message: 'Đã kết nối thành công'
    }),
    
    process: (item: string = 'Yêu cầu') => ({
      title: 'Xử lý thành công!',
      message: `${item} đã được xử lý thành công`
    })
  },

  // Error messages
  error: {
    save: (item: string = 'Dữ liệu') => ({
      title: 'Lưu thất bại!',
      message: `Không thể lưu ${item.toLowerCase()}, vui lòng thử lại`
    }),
    
    update: (item: string = 'Dữ liệu') => ({
      title: 'Cập nhật thất bại!',
      message: `Không thể cập nhật ${item.toLowerCase()}, vui lòng thử lại`
    }),
    
    delete: (item: string = 'Dữ liệu') => ({
      title: 'Xóa thất bại!',
      message: `Không thể xóa ${item.toLowerCase()}, vui lòng thử lại`
    }),
    
    create: (item: string = 'Dữ liệu') => ({
      title: 'Tạo thất bại!',
      message: `Không thể tạo ${item.toLowerCase()}, vui lòng thử lại`
    }),
    
    load: (item: string = 'Dữ liệu') => ({
      title: 'Tải dữ liệu thất bại!',
      message: `Không thể tải ${item.toLowerCase()}, vui lòng thử lại sau`
    }),
    
    upload: (item: string = 'File') => ({
      title: 'Tải lên thất bại!',
      message: `Không thể tải lên ${item.toLowerCase()}, vui lòng thử lại`
    }),
    
    download: (item: string = 'File') => ({
      title: 'Tải xuống thất bại!',
      message: `Không thể tải xuống ${item.toLowerCase()}, vui lòng thử lại`
    }),
    
    send: (item: string = 'Thông tin') => ({
      title: 'Gửi thất bại!',
      message: `Không thể gửi ${item.toLowerCase()}, vui lòng thử lại`
    }),
    
    connect: () => ({
      title: 'Kết nối thất bại!',
      message: 'Không thể kết nối, vui lòng kiểm tra mạng và thử lại'
    }),
    
    validate: (item: string = 'Dữ liệu') => ({
      title: 'Dữ liệu không hợp lệ!',
      message: `Vui lòng kiểm tra lại ${item.toLowerCase()}`
    }),
    
    permission: () => ({
      title: 'Không có quyền!',
      message: 'Bạn không có quyền thực hiện hành động này'
    }),
    
    network: () => ({
      title: 'Lỗi mạng!',
      message: 'Không thể kết nối đến máy chủ, vui lòng thử lại sau'
    }),
    
    server: () => ({
      title: 'Lỗi máy chủ!',
      message: 'Máy chủ đang gặp sự cố, vui lòng thử lại sau'
    }),
    
    timeout: () => ({
      title: 'Hết thời gian chờ!',
      message: 'Yêu cầu mất quá nhiều thời gian, vui lòng thử lại'
    })
  },

  // Warning messages
  warning: {
    unsaved: () => ({
      title: 'Có thay đổi chưa lưu!',
      message: 'Bạn có thay đổi chưa được lưu, có chắc muốn rời khỏi trang?'
    }),
    
    delete: (item: string = 'Dữ liệu') => ({
      title: 'Xác nhận xóa!',
      message: `Bạn có chắc muốn xóa ${item.toLowerCase()} này?`
    }),
    
    limit: (item: string = 'Dữ liệu') => ({
      title: 'Đã đạt giới hạn!',
      message: `Bạn đã đạt giới hạn tối đa cho ${item.toLowerCase()}`
    }),
    
    expired: (item: string = 'Phiên') => ({
      title: 'Hết hạn!',
      message: `${item} đã hết hạn, vui lòng đăng nhập lại`
    }),
    
    maintenance: () => ({
      title: 'Bảo trì hệ thống!',
      message: 'Hệ thống đang bảo trì, vui lòng quay lại sau'
    })
  },

  // Info messages
  info: {
    processing: (item: string = 'Yêu cầu') => ({
      title: 'Đang xử lý...',
      message: `${item} đang được xử lý, vui lòng chờ`
    }),
    
    pending: (item: string = 'Yêu cầu') => ({
      title: 'Đang chờ xử lý',
      message: `${item} đang chờ được xử lý`
    }),
    
    updated: (item: string = 'Dữ liệu') => ({
      title: 'Đã cập nhật!',
      message: `${item} đã được cập nhật`
    }),
    
    reminder: (message: string) => ({
      title: 'Nhắc nhở',
      message: message
    }),
    
    tip: (message: string) => ({
      title: 'Mẹo',
      message: message
    })
  }
};

// Helper function để dễ sử dụng
export const getToastMessage = (type: keyof typeof ToastMessages, action: string, item?: string) => {
  const messages = ToastMessages[type] as any;
  if (messages && messages[action]) {
    return messages[action](item);
  }
  return {
    title: 'Thông báo',
    message: 'Đã xảy ra lỗi không xác định'
  };
};
