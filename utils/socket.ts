// utils/socket.ts
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getSocketServerUrl = () => {
  // Lấy base URL từ env, mặc định là localhost:3001
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  // Socket.IO server chạy ở root server (không có /api)
  // Ví dụ: API_URL = http://localhost:3001/api -> Socket URL = http://localhost:3001
  const baseUrl = apiUrl.replace('/api', '');
  
  // Socket.IO client tự động thêm /socket.io/ vào path
  // Để kết nối đến namespace /chat, chúng ta chỉ cần base URL
  // Socket.IO sẽ tự động join namespace từ path trong URL nếu có
  // Nhưng với Socket.IO, namespace được chỉ định qua path trong URL
  // Ví dụ: http://localhost:3001/chat sẽ tự động join namespace /chat
  return baseUrl;
};

/**
 * Khởi tạo kết nối Socket.IO
 */
export const initSocket = (token: string): Socket | null => {
  if (typeof window === 'undefined') return null;

  // Nếu đã có socket và đang connected, trả về socket hiện tại
  if (socket?.connected) {
    return socket;
  }

  // Nếu đã có socket nhưng chưa connected, disconnect trước
  if (socket) {
    socket.disconnect();
  }

  const socketUrl = getSocketServerUrl();
  const namespaceUrl = `${socketUrl}/chat`;

  socket = io(namespaceUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    reconnectionDelayMax: 5000,
    forceNew: false,
    timeout: 20000,
  });

  socket.on('disconnect', (reason: string) => {
    if (reason === 'io server disconnect') {
      socket?.connect();
    }
  });

  return socket;
};

/**
 * Lấy socket instance hiện tại
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Ngắt kết nối socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Kiểm tra socket đã connected chưa
 */
export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

