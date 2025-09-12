"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useRegister } from "@/hooks/useRegister";
import { resendRegistrationOtp, verifyRegistration, loginService } from "@/services/auth";
import { extractApiErrorMessage } from "@/utils/api";

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
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "landlord",
    phone: "",
    avatar: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await register({ ...form });
    if (res.success) {
      setStep("otp");
      return;
    }
    setError(extractApiErrorMessage({ body: { message: res.message } }));
  };

  const onVerify = async () => {
    try {
      setError("");
      const otp = otpDigits.join("");
      if (!/^\d{6}$/.test(otp)) {
        setError("OTP gồm 6 chữ số");
        return;
      }
      await verifyRegistration(form.email, otp);
      // Sau khi verify thành công, login để có JWT cho bước survey
      const { access_token, user } = await loginService(form.email, form.password);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(user));
      }
      router.push(`/profile/survey?role=${form.role}`);
    } catch (e: any) {
      setError(extractApiErrorMessage(e));
    }
  };

  const onResend = async () => {
    try {
      setError("");
      await resendRegistrationOtp(form.email);
    } catch (e: any) {
      setError(extractApiErrorMessage(e));
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      {step === "form" ? (
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="bg-white rounded-2xl shadow p-6 space-y-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">Tạo tài khoản</h1>
                <p className="text-gray-600">Đăng ký để bắt đầu hành trình tìm nhà</p>
              </div>
              
              {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

              <form onSubmit={onSubmit} className="space-y-4">
                <FieldBox label="Họ tên" required>
                  <input 
                    className="w-full px-2 py-1.5 text-sm outline-none" 
                    value={form.name} 
                    onChange={e=>setForm(f=>({...f, name:e.target.value}))} 
                    placeholder="Nhập họ và tên"
                  />
                </FieldBox>

                <FieldBox label="Email" required>
                  <input 
                    type="email" 
                    className="w-full px-2 py-1.5 text-sm outline-none" 
                    value={form.email} 
                    onChange={e=>setForm(f=>({...f, email:e.target.value}))} 
                    placeholder="example@email.com"
                  />
                </FieldBox>

                <FieldBox label="Mật khẩu" required>
                  <input 
                    type="password" 
                    className="w-full px-2 py-1.5 text-sm outline-none" 
                    value={form.password} 
                    onChange={e=>setForm(f=>({...f, password:e.target.value}))} 
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </FieldBox>

                <FieldBox label="Vai trò" required>
                  <select 
                    className="w-full px-2 py-1.5 text-sm outline-none" 
                    value={form.role} 
                    onChange={e=>setForm(f=>({...f, role: e.target.value as "user" | "landlord"}))}
                  >
                    <option value="user">Người dùng</option>
                    <option value="landlord">Chủ nhà</option>
                  </select>
                </FieldBox>

                <button 
                  disabled={loading} 
                  className="w-full h-10 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Đang đăng ký..." : "Đăng ký"}
                </button>
              </form>
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
                
                <div className="bg-white rounded-2xl border p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Mẹo nhanh</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {currentRoleInfo.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-teal-50 rounded-2xl p-4 text-sm">
                  <div className="font-medium text-teal-800 mb-1">Lưu ý</div>
                  <div className="text-teal-700">
                    Sau khi đăng ký, bạn sẽ được chuyển đến trang khảo sát để hoàn thiện hồ sơ.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Xác thực OTP</h1>
            <p className="text-sm text-gray-600">Nhập mã OTP 6 số đã được gửi tới email của bạn</p>
          </div>
          
          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          
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
                className="w-12 h-12 border rounded-lg text-center text-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                maxLength={1}
              />
            ))}
          </div>
          
          <button 
            onClick={onVerify} 
            className="w-full h-10 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
          >
            Xác thực
          </button>
          
          <div className="space-y-2">
            <button 
              onClick={onResend} 
              className="w-full h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Gửi lại OTP
            </button>
            <button 
              onClick={()=>setStep("form")} 
              className="w-full h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


