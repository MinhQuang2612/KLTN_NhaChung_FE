"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "@/types/User";
import { AuthContextType } from "@/types/Auth";
import { loginService, logoutService } from "@/services/auth";
import { getUserProfile } from "@/services/user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      const tokenIssuedAt = localStorage.getItem("token_issued_at");
      const isRegistrationFlow = localStorage.getItem("isRegistrationFlow");
      const registrationData = localStorage.getItem("registrationData");
      
      // Nếu đang trong quá trình đăng ký và chưa có user thật, không tự động đăng nhập
      if (isRegistrationFlow === "true" && registrationData && !storedUser) {
        setIsLoading(false);
        return;
      }
      
      // Kiểm tra token đã quá hạn (24h) thì xoá ngay, tránh hiển thị user ảo
      if (token && tokenIssuedAt) {
        const issuedAtMs = Number(tokenIssuedAt);
        const isExpired = Number.isFinite(issuedAtMs) && Date.now() - issuedAtMs > 24 * 60 * 60 * 1000;
        if (isExpired) {
          try {
            localStorage.removeItem("token");
            localStorage.removeItem("token_issued_at");
            localStorage.removeItem("user");
          } catch {}
          setUser(null);
          setIsLoading(false);
          return;
        }
      }

      if (token) {
        // Tạm thời sử dụng storedUser thay vì gọi API để tránh logout tự động
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            
            // Đồng bộ trạng thái xác thực từ API verification khi khởi tạo
            try {
              const { getMyVerificationStatus } = await import("@/services/verification");
              const verificationStatus = await getMyVerificationStatus();
              parsedUser.isVerified = verificationStatus.isVerified;
              localStorage.setItem("user", JSON.stringify(parsedUser));
            } catch (verificationError: any) {
              // Nếu không lấy được verification status, giữ nguyên giá trị từ storedUser
              console.warn("⚠️ API Verification Error (khởi tạo):", {
                status: verificationError?.status,
                message: verificationError?.message,
                endpoint: 'GET /users/me/verification'
              });
              // 401 = Backend chưa implement hoặc có bug authentication
              // Giữ nguyên isVerified từ storedUser
            }
            
            setUser(parsedUser);
          } catch (error) {
            setUser(null);
          }
        } else {
          // Chỉ gọi API nếu không có storedUser
          try {
            const userData = await getUserProfile();
            
            // Đồng bộ trạng thái xác thực từ API verification
            try {
              const { getMyVerificationStatus } = await import("@/services/verification");
              const verificationStatus = await getMyVerificationStatus();
              userData.isVerified = verificationStatus.isVerified;
            } catch (verificationError: any) {
              // Nếu không lấy được verification status, giữ nguyên giá trị từ userData
              console.warn("⚠️ API Verification Error (load profile):", {
                status: verificationError?.status,
                message: verificationError?.message,
                endpoint: 'GET /users/me/verification'
              });
            }
            
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } catch (error) {
            // KHÔNG tự động logout, chỉ set user = null
            setUser(null);
          }
        }
      } else if (storedUser) {
        // Không có token nhưng còn dữ liệu user cũ: dọn dẹp để tránh UI hiển thị sai
        localStorage.removeItem("user");
        setUser(null);
      }
      
      setIsLoading(false);
    };

    initializeAuth();
    
    // Lắng nghe sự kiện đăng xuất toàn cục (ví dụ phát từ utils/api khi 401)
    const onGlobalLogout = () => {
      setUser(null);
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("token_issued_at");
        localStorage.removeItem("user");
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('app:logout', onGlobalLogout);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('app:logout', onGlobalLogout);
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { access_token, user } = await loginService(email, password);
      
      // 🔥 LƯU TOKEN TRƯỚC để các API call tiếp theo có token
      if (typeof window !== 'undefined') {
        localStorage.setItem("token", access_token);
        localStorage.setItem("token_issued_at", String(Date.now()));
      }
      
      // Đồng bộ trạng thái xác thực từ API verification (SAU KHI đã có token)
      let userWithVerification = user;
      try {
        const { getMyVerificationStatus } = await import("@/services/verification");
        const verificationStatus = await getMyVerificationStatus();
        userWithVerification = { ...user, isVerified: verificationStatus.isVerified };
      } catch (verificationError: any) {
        // Nếu không lấy được verification status, giữ nguyên giá trị từ user
        console.warn("⚠️ API Verification Error (login):", {
          status: verificationError?.status,
          message: verificationError?.message,
          endpoint: 'GET /users/me/verification'
        });
      }
      
      // Lưu user info vào localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem("user", JSON.stringify(userWithVerification));
      }
      setUser(userWithVerification);
      return { success: true, message: "Đăng nhập thành công" };
    } catch (err: any) {
      return { success: false, message: err.message || "Đăng nhập thất bại" };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (typeof window === 'undefined') return { success: false, message: "Server side" };
    
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const userData = await getUserProfile();
        
        // Đồng bộ trạng thái xác thực từ API verification
        try {
          const { getMyVerificationStatus } = await import("@/services/verification");
          const verificationStatus = await getMyVerificationStatus();
          userData.isVerified = verificationStatus.isVerified;
        } catch (verificationError: any) {
          // Nếu không lấy được verification status, giữ nguyên giá trị từ userData
          console.warn("⚠️ API Verification Error (refreshUser):", {
            status: verificationError?.status,
            message: verificationError?.message,
            endpoint: 'GET /users/me/verification'
          });
        }
        
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return { success: true };
      } catch (error) {
        return { success: false, message: "Không thể tải thông tin user" };
      }
    }
    return { success: false, message: "Không có token" };
  };

  const logout = () => {
    setUser(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        localStorage.removeItem("token_issued_at");
        localStorage.removeItem("user");
      }
    } catch {}
    try { logoutService(); } catch {}
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <div suppressHydrationWarning={true}>
      <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading }}>
        {children}
      </AuthContext.Provider>
    </div>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
