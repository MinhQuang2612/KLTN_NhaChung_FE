"use client";

import { useState } from "react";
import { registerService, RegisterPayload } from "@/services/auth";

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const register = async (payload: RegisterPayload) => {
    setLoading(true);
    setError("");
    try {
      if (!payload.name?.trim()) throw new Error("Vui lòng nhập họ tên");
      if (!/^\S+@\S+\.\S+$/.test(payload.email)) throw new Error("Email không hợp lệ");
      if (!payload.password || payload.password.length < 6) throw new Error("Mật khẩu tối thiểu 6 ký tự");
      if (payload.role && !["user", "landlord"].includes(payload.role)) throw new Error("Role không hợp lệ");

      // Gửi đăng ký (gửi OTP). Không auto login trong flow OTP.
      await registerService(payload);
      return { success: true } as const;
    } catch (e: any) {
      // Thông báo thân thiện khi BE đang yêu cầu token cho endpoint đăng ký
      if (e?.status === 401) {
        return {
          success: false,
          message:
            "Unauthorized: Endpoint đăng ký đang yêu cầu token. Cần BE bỏ JwtAuthGuard ở /auth/register (hoặc /users) để đăng ký công khai.",
        } as const;
      }
      const msg = e?.body?.message || e?.message || "Đăng ký thất bại";
      return { success: false, message: Array.isArray(msg) ? msg.join(", ") : msg } as const;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error, setError };
}


