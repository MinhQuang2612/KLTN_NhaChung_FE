// utils/api.ts
// Wrapper gọi API cho Next.js:
// - Base URL .env: NEXT_PUBLIC_API_URL=http://localhost:3001/api
// - Tự gắn Bearer token nếu có
// - 401: xóa token + user, KHÔNG redirect
// - Helpers: apiGet/apiPost/apiPut/apiDel

export const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

const join = (base: string, path: string) =>
  `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

export class ApiError extends Error {
  status: number;
  body?: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const safeParse = (txt: string) => {
  try {
    return txt ? JSON.parse(txt) : undefined;
  } catch {
    return txt;
  }
};

const getToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem("token");

export async function api<T = any>(
  path: string,
  init: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const token = getToken();
  const isFD = typeof FormData !== "undefined" && init.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    ...(!isFD ? { "Content-Type": "application/json" } : {}),
    ...(token && !init.skipAuth ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Debug logging
  if (init.skipAuth) {
    console.log("API call with skipAuth:", { path, headers, body: init.body });
  }

  const res = await fetch(join(API_BASE, path), { ...init, headers });

  if (res.status === 204) return undefined as T;

  const raw = await res.text();
  const data = safeParse(raw);

  if (res.status === 401) {
    // Không tự động xóa token ở đây để tránh UI bị đá khỏi phiên khi gặp 401 do thiếu quyền.
    // Trang gọi API sẽ tự quyết định xử lý (redirect/login/thông báo...).
    throw new ApiError(
      typeof data === "string" ? data : data?.message ?? "Unauthorized",
      401,
      data
    );
  }

  if (!res.ok) {
    throw new ApiError(
      typeof data === "string" ? data : data?.message ?? res.statusText,
      res.status,
      data
    );
  }

  return data as T;
}

export const apiGet = <T = any>(p: string, o?: RequestInit) =>
  api<T>(p, { ...o, method: "GET" });

export const apiPost = <T = any>(p: string, body?: any, o?: RequestInit & { skipAuth?: boolean }) =>
  api<T>(p, {
    ...o,
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
    skipAuth: o?.skipAuth,
  });

export const apiPut = <T = any>(p: string, body?: any, o?: RequestInit) =>
  api<T>(p, {
    ...o,
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const apiDel = <T = any>(p: string, o?: RequestInit) =>
  api<T>(p, { ...o, method: "DELETE" });

export const apiPatch = <T = any>(p: string, body?: any, o?: RequestInit) =>
  api<T>(p, {
    ...o,
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

// Helper: trích xuất thông báo lỗi thân thiện từ ApiError/Fetch error
export function extractApiErrorMessage(err: any): string {
  if (!err) return "Đã xảy ra lỗi không xác định";
  
  // Nếu err là string, trả về luôn
  if (typeof err === "string") {
    return err;
  }
  
  // ApiError từ api.ts
  if (typeof err === "object" && "status" in err && (err as any).status) {
    const body = (err as any).body;
    let msg = "";
    
    // Xử lý message từ body
    if (body?.message) {
      if (Array.isArray(body.message)) {
        msg = body.message.join("; ");
      } else if (typeof body.message === "string") {
        msg = body.message;
      } else if (typeof body.message === "object") {
        // Nếu message là object, thử lấy các thuộc tính quan trọng
        const messageObj = body.message;
        if (messageObj.error) {
          msg = messageObj.error;
        } else if (messageObj.details) {
          msg = messageObj.details;
        } else {
          msg = JSON.stringify(messageObj);
        }
      }
    }
    
    // Fallback nếu không có message từ body
    if (!msg) {
      msg = err.message || err.statusText || `Lỗi ${err.status}`;
    }
    
    return msg;
  }
  
  // Xử lý lỗi từ fetch/network
  if (err?.message) {
    const message = String(err.message);
    
    // Lỗi mạng
    if (message.includes("Failed to fetch")) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.";
    }
    if (message.includes("timeout")) {
      return "Kết nối quá chậm. Vui lòng thử lại sau.";
    }
    if (message.includes("NetworkError")) {
      return "Lỗi mạng. Vui lòng kiểm tra kết nối internet.";
    }
    
    return message;
  }
  
  // Xử lý lỗi từ response body
  if (err?.body) {
    const body = err.body;
    if (typeof body === "string") {
      return body;
    }
    if (typeof body === "object" && body.message) {
      if (Array.isArray(body.message)) {
        return body.message.join("; ");
      }
      return String(body.message);
    }
  }
  
  // Fallback cuối cùng
  if (typeof err === "object") {
    // Thử lấy các thuộc tính phổ biến
    if (err.error) return String(err.error);
    if (err.details) return String(err.details);
    if (err.reason) return String(err.reason);
    
    // Nếu là object phức tạp, chuyển thành JSON
    try {
      return JSON.stringify(err);
    } catch {
      return "Đã xảy ra lỗi không xác định";
    }
  }
  
  return String(err);
}
