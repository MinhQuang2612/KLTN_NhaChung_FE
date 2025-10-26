"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createProfile, createProfilePublic, createProfilePublicFallback, getMyProfile, updateMyProfile, UserProfile } from "@/services/userProfiles";
import AddressSelector from "@/components/common/AddressSelector";
import { addressService, type Address, type Ward } from "@/services/address";
import { uploadFiles } from "@/utils/upload";
import { AgeUtils } from "@/utils/ageUtils";
import { User } from "@/types/User";
import { loginService } from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";

function FieldBox({ label, children, className = "", required = false }: { label: string; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <fieldset
      className={`rounded-lg border ${className}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const tag = target.tagName;
        const isInteractive = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || target.getAttribute("contenteditable") === "true";
        if (isInteractive) return; // Không ép focus nếu đang click trực tiếp vào input
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

export default function ProfileSurvey({ role }: { role: "user" | "landlord" }) {
  // Theo tài liệu: landlord không cần profile, chỉ cần verification
  if (role === "landlord") {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 space-y-6">
        <h1 className="text-2xl font-bold">Chủ nhà không cần hoàn thiện profile</h1>
        <p className="text-gray-600">
          Chủ nhà chỉ cần xác thực danh tính để được duyệt. 
          Vui lòng chuyển đến trang xác thực để upload giấy phép kinh doanh.
        </p>
        <button 
          onClick={() => router.push('/verification/landlord')}
          className="h-10 px-5 rounded-lg bg-orange-600 text-white"
        >
          Đi đến xác thực
        </button>
      </div>
    );
  }
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<UserProfile>({});
  const [currentAddress, setCurrentAddress] = useState<Address | null>(null);
  const [preferredWards, setPreferredWards] = useState<string[]>([]);
  const [wardOptions, setWardOptions] = useState<Ward[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<{ code: string; name: string }[]>([]);
  // UX helpers for required hints
  const [focusedField, setFocusedField] = useState<string>("");
  // Local user state for registration flow
  const [localUser, setLocalUser] = useState<User | null>(null);
  const DRAFT_KEY = `survey_draft_user`;

  // helpers
  const toNumber = (v: string): number | undefined => (v === "" ? undefined : Number(v));
  
  // Helper để format date cho input type="date"
  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return "";
    return dateString;
  };

  // useEffect để load user data từ localStorage (chỉ chạy 1 lần)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const storedUser = localStorage.getItem("user");
    const registrationData = localStorage.getItem("registrationData");
    const isRegistrationFlow = localStorage.getItem("isRegistrationFlow");
    
    // Nếu đã có localUser hoặc user từ AuthContext, không cần làm gì
    if (localUser || user?.userId) return;
    
    if (storedUser && isRegistrationFlow === "true") {
      try {
        const userData = JSON.parse(storedUser);
        setLocalUser(userData);
        return;
      } catch (error) {
      }
    } else if (registrationData && isRegistrationFlow === "true") {
      // Nếu có registrationData nhưng chưa có user (chưa login)
      try {
        const regData = JSON.parse(registrationData);
        // Tạo temporary user object từ registration data
        const tempUser: User = {
          userId: 0, // Temporary ID
          name: regData.name,
          email: regData.email,
          role: regData.role,
          phone: regData.phone,
          avatar: regData.avatar,
          isVerified: true,
          createdAt: regData.verifiedAt
        };
        setLocalUser(tempUser);
        return;
      } catch (error) {
      }
    }
  }, []); // Empty dependency array - chỉ chạy 1 lần

  // Load draft nếu có (chạy 1 lần sau mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw || '{}');
        if (draft.data) setData((prev)=>({ ...prev, ...draft.data }));
        if (draft.currentAddress) setCurrentAddress(draft.currentAddress);
        if (Array.isArray(draft.preferredWards)) setPreferredWards(draft.preferredWards);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft khi thay đổi
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const snapshot = {
        data,
        currentAddress,
        preferredWards,
        savedAt: Date.now(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot));
    } catch {}
  }, [data, currentAddress, preferredWards]);

  // Cảnh báo trước khi rời trang nếu đang có dữ liệu
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const hasData = !!(
        Object.keys(data||{}).length ||
        preferredWards.length ||
        currentAddress?.provinceCode
      );
      if (hasData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [data, preferredWards, currentAddress?.provinceCode]);

  // useEffect để load profile data khi có user
  useEffect(() => {
    const fetch = async () => {
      // Sử dụng localUser nếu có, nếu không thì dùng user từ AuthContext
      const currentUser = localUser || user;
      
      if (!currentUser?.userId) {
        return; // Không có user, không load profile
      }
      
      try {
        setLoading(true);
        const p = await getMyProfile();
        setData(p || {});
        // Hydrate address: sử dụng preferredCity
        if (p?.preferredCity) {
          setCurrentAddress({
            street: "",
            ward: "",
            city: p.preferredCity,
            provinceCode: "", 
            provinceName: p.preferredCity,
            wardCode: "", 
            wardName: ""
          } as Address);
        }
        if (Array.isArray((p as any)?.preferredWards)) setPreferredWards((p as any).preferredWards as string[]);
      } catch {
        setData({});
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.userId, localUser?.userId]); // Chỉ depend vào userId, không phải toàn bộ object

  // Load ward options when city (provinceCode) changes, reset preferred wards if city changes
  useEffect(() => {
    const load = async () => {
      if (!currentAddress?.provinceCode) { setWardOptions([]); setPreferredWards([]); return; }
      try {
        const wards = await addressService.getWardsByProvince(currentAddress.provinceCode);
        setWardOptions(wards);
        // Filter preferredWards to still-valid ward names in this city
        setPreferredWards(prev => prev.filter(w => wards.some(opt => opt.wardName === w)));
      } catch {
        setWardOptions([]);
      }
    };
    load();
  }, [currentAddress?.provinceCode]);

  // Load provinces for address select
  useEffect(() => {
    (async () => {
      try {
        const ps = await addressService.getProvinces();
        setProvinceOptions(ps.map(p => ({ code: p.provinceCode, name: p.provinceName })));
      } catch {
        setProvinceOptions([]);
      }
    })();
  }, []);

  // Helper: lấy userId ổn định để upload
  const getStableUserId = (): number | undefined => {
    if (user?.userId && user.userId > 0) return Number(user.userId);
    if (localUser?.userId && localUser.userId > 0) return Number(localUser.userId);
    if (typeof window !== "undefined") {
      try {
        const reg = localStorage.getItem("registrationData");
        if (reg) {
          const r = JSON.parse(reg);
          if (r?.userId && Number(r.userId) > 0) return Number(r.userId);
        }
      } catch {}
    }
    return undefined;
  };

  const save = async () => {
    const currentUser = localUser || user;
    
    // Nếu không có user, thử lấy từ registrationData
    if (!currentUser?.userId && currentUser?.userId !== 0) {
      if (typeof window !== "undefined") {
        const registrationData = localStorage.getItem("registrationData");
        const isRegistrationFlow = localStorage.getItem("isRegistrationFlow");
        
        if (registrationData && isRegistrationFlow === "true") {
          try {
            const regData = JSON.parse(registrationData);
            // Tạo temporary user object từ registration data
            const tempUser: User = {
              userId: 0, // Temporary ID
              name: regData.name,
              email: regData.email,
              role: regData.role,
              phone: regData.phone,
              avatar: regData.avatar,
              isVerified: true,
              createdAt: regData.verifiedAt
            };
            setLocalUser(tempUser);
            // Tiếp tục với tempUser
          } catch (error) {
            setError("Không thể tải thông tin đăng ký. Vui lòng thử lại.");
            return;
          }
        } else {
          setError("Không tìm thấy thông tin người dùng. Vui lòng đăng ký lại.");
          return;
        }
      } else {
        setError("Không tìm thấy thông tin người dùng. Vui lòng đăng ký lại.");
        return;
      }
    }
    
    const actualUser = localUser || user;
    
    try {
      setLoading(true);
      const errs: string[] = [];

      // Chỉ validate 6 trường còn lại
      if (!data.occupation) {
        errs.push("Vui lòng chọn đối tượng thuê");
      }
      if (data.pets === undefined || data.pets === null) {
        errs.push("Vui lòng chọn thông tin về thú cưng");
      }
      if (!currentAddress?.provinceName) {
        errs.push("Vui lòng chọn thành phố ưu tiên");
      }
      if (!Array.isArray(preferredWards) || preferredWards.length === 0) {
        errs.push("Vui lòng chọn ít nhất 1 phường ưu tiên");
      }
      if (!Array.isArray(data.roomType) || data.roomType.length === 0) {
        errs.push("Vui lòng chọn ít nhất 1 loại phòng/căn hộ quan tâm");
      }
      if (!Array.isArray(data.contactMethod) || data.contactMethod.length === 0) {
        errs.push("Vui lòng chọn ít nhất 1 cách liên hệ");
      }

      if (errs.length > 0) {
        setError(errs.join("\n"));
        setLoading(false);
        return;
      }
      
      // Kiểm tra nếu đang trong quá trình đăng ký
      const isRegistrationFlow = typeof window !== "undefined" && localStorage.getItem("isRegistrationFlow") === "true";
      const registrationData = typeof window !== "undefined" ? localStorage.getItem("registrationData") : null;
      
      let actualUser = localUser || user;
      
      // Nếu đang trong registration flow và có registrationData, tạo user từ đó
      if (isRegistrationFlow && registrationData && actualUser?.userId === 0) {
        try {
          const regData = JSON.parse(registrationData);
          
          // Tạo user object từ registration data với userId thật
          const userFromReg: User = {
            userId: regData.userId || 0, // Sử dụng userId thật từ backend
            name: regData.name,
            email: regData.email,
            role: regData.role,
            phone: regData.phone,
            avatar: regData.avatar,
            isVerified: true,
            createdAt: regData.verifiedAt
          };
          actualUser = userFromReg;
        } catch (error) {
          setError("Không thể tải thông tin đăng ký. Vui lòng thử lại.");
          setLoading(false);
          return;
        }
      }
      
      if (!actualUser) {
        setError("Không tìm thấy thông tin người dùng. Vui lòng thử lại.");
        setLoading(false);
        return;
      }
      
      // Gắn kèm tên Thành phố để phân biệt trùng tên phường ở tỉnh/thành khác nhau
      const preferredCity = currentAddress?.provinceName || currentAddress?.city || undefined;

      const payload: UserProfile = {
        userId: actualUser.userId,
        occupation: data.occupation,
        pets: data.pets,
        preferredCity,
        preferredWards: preferredWards,
        roomType: data.roomType,
        contactMethod: data.contactMethod,
      };

      
      try {
        if (isRegistrationFlow) {
          // Trong registration flow, dùng API public (không cần token)
          await createProfilePublic(payload);
        } else {
          // User đã đăng nhập, thử tạo mới trước, nếu thất bại thì update
          try {
            await createProfile(payload);
          } catch (createError) {
            await updateMyProfile(payload);
          }
        }
      } catch (error) {
        throw new Error("Không thể lưu profile. Vui lòng thử lại.");
      }
      
      // Kiểm tra nếu đang trong registration flow -> redirect về login
      if (isRegistrationFlow) {
        // Xóa flag đăng ký
        if (typeof window !== "undefined") {
          localStorage.removeItem("isRegistrationFlow");
          localStorage.removeItem("registrationData");
          // Xóa bản nháp sau khi lưu thành công
          try { localStorage.removeItem(DRAFT_KEY); } catch {}
        }
        
        // Redirect về trang login
        alert("✅ Đăng ký thành công! Vui lòng đăng nhập.");
        router.push("/login");
      } else {
        // Nếu user đã đăng nhập và đang edit profile -> về trang chủ
        router.push("/");
      }
    } catch (e: any) {
      setError(e?.body?.message || e?.message || "Lưu khảo sát thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 space-y-6">
      <h1 className="text-2xl font-bold">Khảo sát hồ sơ người dùng</h1>
      {error && <div className="text-red-600 text-sm whitespace-pre-line">{error}</div>}

      {(
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. occupation */}
          <FieldBox className="md:col-span-2" label="Thuê cho" required>
            <select
              className="w-full px-2 py-1.5 text-sm outline-none"
              value={data.occupation ?? ""}
              onChange={e=>setData(d=>({ ...d, occupation: e.target.value || undefined }))}
            >
              <option value="">-- Chọn đối tượng --</option>
              <option value="student">Sinh viên</option>
              <option value="office_worker">Nhân viên VP</option>
              <option value="family">Gia đình</option>
              <option value="couple">Cặp đôi</option>
              <option value="group_friends">Nhóm bạn</option>
            </select>
          </FieldBox>

          {/* 2. pets */}
          <FieldBox label="Nuôi thú cưng?" required>
            <select className="w-full px-2 py-1.5 text-sm outline-none" value={String(data.pets ?? false)} onChange={e=>setData(d=>({...d, pets: e.target.value === "true"}))}>
              <option value="false">Không</option>
              <option value="true">Có</option>
            </select>
          </FieldBox>

          {/* 3. preferredCity */}
          <FieldBox className="md:col-span-2" label="Thành phố ưu tiên" required>
            <AddressSelector value={currentAddress} onChange={setCurrentAddress} fields={{ street: false, specificAddress: false, additionalInfo: false, preview: false, ward: false }} />
          </FieldBox>

          {/* 4. preferredWards */}
          <FieldBox className="md:col-span-2" label="Khu vực ưu tiên (phường)" required>
            <div className="max-h-56 overflow-auto rounded-lg p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
              {wardOptions.map((opt) => {
                const checked = preferredWards.includes(opt.wardName);
                return (
                  <label key={opt.wardCode} className="flex items-center gap-2 text-sm px-2 py-1 hover:bg-gray-50 rounded">
                    <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" checked={checked} onChange={(e) => {
                      setPreferredWards(prev => e.target.checked ? Array.from(new Set([...prev, opt.wardName])) : prev.filter(w => w !== opt.wardName));
                    }} />
                    <span>{opt.wardName}</span>
                  </label>
                );
              })}
              {wardOptions.length === 0 && (
                <div className="text-gray-500 text-sm px-2">Chọn Tỉnh/Thành phố để hiện danh sách phường</div>
              )}
            </div>
          </FieldBox>

          {/* 5. roomType */}
          <FieldBox className="md:col-span-2" label="Loại phòng/căn hộ quan tâm" required>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { v: "phong_tro", t: "Phòng trọ" },
                { v: "chung_cu", t: "Chung cư/Căn hộ" },
                { v: "nha_nguyen_can", t: "Nhà nguyên căn" },
                { v: "can_ho_dv", t: "Căn hộ DV" },
                { v: "officetel", t: "Officetel" },
                { v: "studio", t: "Studio" },
              ].map(opt => {
                const checked = (data.roomType||[]).includes(opt.v);
                return (
                  <label key={opt.v} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" checked={checked} onChange={(e)=>{
                      setData(d=>{
                        const set = new Set(d.roomType||[]);
                        e.target.checked ? set.add(opt.v) : set.delete(opt.v);
                        return { ...d, roomType: Array.from(set) };
                      });
                    }} />
                    <span>{opt.t}</span>
                  </label>
                );
              })}
            </div>
          </FieldBox>

          {/* 6. contactMethod */}
          <FieldBox className="md:col-span-2" label="Cách liên hệ ưa thích" required>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Email",
                "Điện thoại", 
                "Zalo",
                "Facebook",
                "Telegram",
                "Viber",
                "Skype",
                "Discord",
                "Instagram",
                "TikTok",
                "Twitter",
                "Line"
              ].map(method => (
                <label key={method} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(data.contactMethod || []).includes(method)}
                    onChange={e => {
                      const current = data.contactMethod || [];
                      if (e.target.checked) {
                        setData(d => ({ ...d, contactMethod: [...current, method] }));
                      } else {
                        setData(d => ({ ...d, contactMethod: current.filter(m => m !== method) }));
                      }
                    }}
                    className="rounded"
                  />
                  <span>{method}</span>
                </label>
              ))}
            </div>
          </FieldBox>
        </div>
      )}

      <div className="flex gap-3">
        <button 
          onClick={() => {
            // Nếu đang trong registration flow, quay về trang đăng ký
            const isRegistrationFlow = typeof window !== "undefined" && localStorage.getItem("isRegistrationFlow") === "true";
            if (isRegistrationFlow) {
              router.push("/register");
            } else {
              // Nếu đang edit profile, quay về trang profile
              router.push("/profile");
            }
          }} 
          className="h-10 px-5 rounded-lg border border-gray-300"
        >
          Trở lại
        </button>
        <button onClick={save} disabled={loading} className="h-10 px-5 rounded-lg bg-teal-600 text-white">{loading ? "Đang lưu..." : "Hoàn tất"}</button>
      </div>
    </div>
  );
}


