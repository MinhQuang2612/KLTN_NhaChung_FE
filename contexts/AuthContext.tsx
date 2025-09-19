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
      const isRegistrationFlow = localStorage.getItem("isRegistrationFlow");
      const registrationData = localStorage.getItem("registrationData");
      
      // Nếu đang trong quá trình đăng ký và chưa có user thật, không tự động đăng nhập
      if (isRegistrationFlow === "true" && registrationData && !storedUser) {
        setIsLoading(false);
        return;
      }
      
      if (token) {
        try {
          // Nếu có token, gọi API để lấy thông tin user mới nhất
          const userData = await getUserProfile();
          setUser(userData);
          // Cập nhật localStorage với dữ liệu mới
          localStorage.setItem("user", JSON.stringify(userData));
        } catch (error) {
          // Nếu API call thất bại, thử dùng dữ liệu từ localStorage
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // Nếu không có dữ liệu nào, xóa token
            localStorage.removeItem("token");
            localStorage.removeItem("user");
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
      if (typeof window !== 'undefined') {
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(user));
      }
      setUser(user);
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
    logoutService();
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
