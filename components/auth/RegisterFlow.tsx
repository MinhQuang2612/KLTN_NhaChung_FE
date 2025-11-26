"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useRegister } from "@/hooks/useRegister";
import { useAuth } from "@/contexts/AuthContext";
import { resendRegistrationOtp, verifyRegistration, loginService } from "@/services/auth";
import { extractApiErrorMessage } from "@/utils/api";
import { ErrorMessageMapper, validateEmailFormat, validatePassword, validatePhone, validateName } from "@/utils/errorMessages";
import { getRandomVideo } from "@/config/cloudinary";

function FieldBox({ label, children, className = "", required = false }: { label: string; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <fieldset
      className={`rounded-lg border ${className}`}
      onClick={(e) => {
        const el = (e.currentTarget as HTMLElement).querySelector(
          "input, select, textarea, [contenteditable=true]"
        ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null);
        el?.focus();
      }}
    >
      <legend className="px-2 ml-2 text-sm text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </legend>
      <div className="px-3 pb-2 pt-0.5">
        {children}
      </div>
    </fieldset>
  );
}

export default function RegisterFlow() {
  const router = useRouter();
  const { register, loading } = useRegister();
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [backgroundVideo, setBackgroundVideo] = useState("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" as "user" | "landlord",
    phone: "",
    avatar: "",
  });

  useEffect(() => {
    // Random chọn video nền từ Cloudinary
    setBackgroundVideo(getRandomVideo());
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation chi tiết từng trường
    const nameValidation = validateName(form.name);
    if (!nameValidation.isValid) {
      setError(nameValidation.message!);
      return;
    }

    const emailValidation = validateEmailFormat(form.email);
    if (!emailValidation.isValid) {
      setError(emailValidation.message!);
      return;
    }

    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message!);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (!form.role) {
      setError("Vui lòng chọn vai trò");
      return;
    }

    // Validation phone nếu có
    const phoneValidation = validatePhone(form.phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.message!);
      return;
    }
    
    try {
      const res = await register({ ...form });
      if (res.success) {
        setStep("otp");
        return;
      }
      
      // Xử lý lỗi từ API với thông báo thân thiện
      let errorMessage = extractApiErrorMessage({ body: { message: res.message } });
      errorMessage = ErrorMessageMapper.mapRegistrationError(errorMessage);
      setError(errorMessage);
    } catch (e: any) {
      // Xử lý lỗi từ exception
      let errorMessage = extractApiErrorMessage(e);
      errorMessage = ErrorMessageMapper.mapRegistrationError(errorMessage);
      setError(errorMessage);
    }
  };

  const onVerify = async () => {
    try {
      setError("");
      const otp = otpDigits.join("");
      if (!/^\d{6}$/.test(otp)) {
        setError("OTP gồm 6 chữ số");
        return;
      }
      const verifyResult = await verifyRegistration(form.email, otp);
      
      // LƯU TOKEN để dùng cho survey/verification
      if (typeof window !== "undefined" && verifyResult?.access_token && verifyResult?.user) {
        localStorage.setItem("token", verifyResult.access_token);
        localStorage.setItem("user", JSON.stringify(verifyResult.user));
        
        localStorage.setItem("registrationData", JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone,
          avatar: form.avatar,
          userId: verifyResult.user?.userId || 0,
          verifiedAt: new Date().toISOString()
        }));
        localStorage.setItem("isRegistrationFlow", "true");
      }
      
      // Chuyển đến trang phù hợp theo role
      setTimeout(() => {
        if (form.role === 'landlord') {
          // Chủ nhà: chuyển đến trang xác thực
          router.push('/verification/landlord');
        } else {
          // User thường: chuyển đến survey
          router.push(`/profile/survey?role=${form.role}`);
        }
      }, 100);
    } catch (e: any) {
      let errorMessage = extractApiErrorMessage(e);
      errorMessage = ErrorMessageMapper.mapOtpError(errorMessage);
      setError(errorMessage);
    }
  };

  const onResend = async () => {
    try {
      setError("");
      await resendRegistrationOtp(form.email);
      setError("Đã gửi lại mã OTP. Vui lòng kiểm tra email.");
    } catch (e: any) {
      let errorMessage = extractApiErrorMessage(e);
      errorMessage = ErrorMessageMapper.mapOtpError(errorMessage);
      setError(errorMessage);
    }
  };

  const roleInfo = {
    user: {
      title: "Tìm phòng phù hợp",
      subtitle: "Kết nối với chủ nhà uy tín",
      image: "/home/room.png",
      color: "from-blue-500 to-teal-500",
      tips: [
        "Hoàn thiện khảo sát để gợi ý phòng chuẩn hơn",
        "Chọn khu vực ưa thích để tìm kiếm nhanh",
        "Cập nhật ngân sách để match chính xác"
      ]
    },
    landlord: {
      title: "Cho thuê hiệu quả",
      subtitle: "Tìm khách thuê phù hợp",
      image: "/home/landlord-bg.png",
      color: "from-orange-500 to-red-500",
      tips: [
        "Tải ảnh giấy phép để tăng độ tin cậy",
        "Chọn thành phố và phường mục tiêu",
        "Nhập khoảng giá để hệ thống match nhu cầu"
      ]
    }
  };

  const currentRoleInfo = roleInfo[form.role];

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4">
      {/* Video Background */}
      <div className="absolute inset-0 -z-10">
        {backgroundVideo && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {step === "form" ? (
        <div className="w-full max-w-4xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 space-y-4 border border-white/20 relative overflow-hidden">
              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2 text-white">Tạo tài khoản</h1>
                  <p className="text-white/80">Đăng ký để bắt đầu hành trình tìm nhà</p>
                </div>
                
                {error && <div className="text-red-100 text-sm bg-red-500/20 backdrop-blur-sm border border-red-400/30 p-3 rounded-lg">{error}</div>}

                <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Họ tên <span className="text-red-400">*</span>
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all duration-300 text-white placeholder-white/60 hover:bg-white/15" 
                    value={form.name} 
                    onChange={e=>setForm(f=>({...f, name:e.target.value}))} 
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all duration-300 text-white placeholder-white/60 hover:bg-white/15" 
                    value={form.email} 
                    onChange={e=>setForm(f=>({...f, email:e.target.value}))} 
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Số điện thoại
                  </label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all duration-300 text-white placeholder-white/60 hover:bg-white/15" 
                    value={form.phone} 
                    onChange={e=>setForm(f=>({...f, phone:e.target.value}))} 
                    placeholder="0123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Mật khẩu <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all duration-300 text-white placeholder-white/60 hover:bg-white/15" 
                    value={form.password} 
                    onChange={e=>setForm(f=>({...f, password:e.target.value}))} 
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nhập lại mật khẩu <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all duration-300 text-white placeholder-white/60 hover:bg-white/15" 
                    value={form.confirmPassword} 
                    onChange={e=>setForm(f=>({...f, confirmPassword:e.target.value}))} 
                    placeholder="Nhập lại mật khẩu"
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <div className="text-red-300 text-xs mt-1">
                      Mật khẩu không khớp
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Vai trò <span className="text-red-400">*</span>
                  </label>
                  <select 
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all duration-300 text-white hover:bg-white/15" 
                    value={form.role} 
                    onChange={e=>setForm(f=>({...f, role: e.target.value as "user" | "landlord"}))}
                  >
                    <option value="user" className="bg-gray-800 text-white">Người dùng</option>
                    <option value="landlord" className="bg-gray-800 text-white">Chủ nhà</option>
                  </select>
                </div>

                <button 
                  disabled={loading} 
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  {loading ? "Đang đăng ký..." : "Đăng ký"}
                </button>
                </form>
              </div>
            </div>

            {/* Right: Role Info */}
            <div className="hidden lg:block">
              <div className="sticky top-20 space-y-4">
                <div className="relative h-64 rounded-2xl overflow-hidden">
                  <img
                    src={currentRoleInfo.image}
                    alt={currentRoleInfo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${currentRoleInfo.color} opacity-80`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h2 className="text-2xl font-bold mb-2">{currentRoleInfo.title}</h2>
                      <p className="text-lg opacity-90">{currentRoleInfo.subtitle}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 relative overflow-hidden">
                  {/* Glass effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <h3 className="font-semibold text-white mb-3">Mẹo nhanh</h3>
                    <ul className="space-y-2 text-sm text-white/80">
                      {currentRoleInfo.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-teal-500/20 backdrop-blur-sm rounded-2xl border border-teal-400/30 p-4 text-sm">
                  <div className="font-medium text-teal-200 mb-1">Lưu ý</div>
                  <div className="text-teal-100">
                    Sau khi đăng ký, bạn sẽ được chuyển đến trang khảo sát để hoàn thiện hồ sơ.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 space-y-4 border border-white/20 relative z-10 overflow-hidden">
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2 text-white">Xác thực OTP</h1>
              <p className="text-sm text-white/80">Nhập mã OTP 6 số đã được gửi tới email của bạn</p>
            </div>
            
            {error && <div className="text-red-100 text-sm bg-red-500/20 backdrop-blur-sm border border-red-400/30 p-3 rounded-lg">{error}</div>}
          
          <div className="flex gap-2 justify-center">
            {otpDigits.map((d, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpRefs.current[idx] = el;
                }}
                value={d}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                  const next = [...otpDigits];
                  next[idx] = v;
                  setOtpDigits(next);
                  if (v && idx < 5) otpRefs.current[idx + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
                    otpRefs.current[idx - 1]?.focus();
                  }
                }}
                onPaste={(e) => {
                  const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                  if (!txt) return;
                  const arr = Array(6)
                    .fill("")
                    .map((_, i) => txt[i] || "");
                  setOtpDigits(arr);
                  otpRefs.current[5]?.focus();
                  e.preventDefault();
                }}
                inputMode="numeric"
                className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-center text-lg text-white placeholder-white/60 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all duration-300 hover:bg-white/15"
                maxLength={1}
              />
            ))}
          </div>
          
          <button 
            onClick={onVerify} 
            className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 transition-all duration-300 hover:shadow-lg hover:scale-105"
          >
            Xác thực
          </button>
          
          <div className="space-y-2">
            <button 
              onClick={onResend} 
              className="w-full h-10 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all duration-300"
            >
              Gửi lại OTP
            </button>
            <button 
              onClick={()=>setStep("form")} 
              className="w-full h-10 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all duration-300"
            >
              Quay lại
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}


