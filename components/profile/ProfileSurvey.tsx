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
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<UserProfile>({});
  const [currentAddress, setCurrentAddress] = useState<Address | null>(null);
  const [preferredWards, setPreferredWards] = useState<string[]>([]);
  const [wardOptions, setWardOptions] = useState<Ward[]>([]);
  // Landlord target area
  const [landlordCity, setLandlordCity] = useState<Address | null>(null);
  const [landlordWardOptions, setLandlordWardOptions] = useState<Ward[]>([]);
  const [landlordTargetWards, setLandlordTargetWards] = useState<string[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<{ code: string; name: string }[]>([]);
  const [licensePreview, setLicensePreview] = useState<string>("");
  const [licenseInputKey, setLicenseInputKey] = useState<number>(0);
  const [licenseFileName, setLicenseFileName] = useState<string>("");
  const [licenseUploading, setLicenseUploading] = useState<boolean>(false);
  const licenseInputRef = useRef<HTMLInputElement | null>(null);
  // UX helpers for required hints
  const [focusedField, setFocusedField] = useState<string>("");
  // Local user state for registration flow
  const [localUser, setLocalUser] = useState<User | null>(null);
  const DRAFT_KEY = `survey_draft_${typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('role') || role) : role}`;

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
        console.error("Error parsing stored user:", error);
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
        console.error("Error parsing registration data:", error);
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
        if (draft.landlordCity) setLandlordCity(draft.landlordCity);
        if (Array.isArray(draft.landlordTargetWards)) setLandlordTargetWards(draft.landlordTargetWards);
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
        landlordCity,
        landlordTargetWards,
        savedAt: Date.now(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot));
    } catch {}
  }, [data, currentAddress, preferredWards, landlordCity, landlordTargetWards]);

  // Cảnh báo trước khi rời trang nếu đang có dữ liệu
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const hasData = !!(
        Object.keys(data||{}).length ||
        preferredWards.length ||
        landlordTargetWards.length ||
        currentAddress?.provinceCode ||
        landlordCity?.provinceCode
      );
      if (hasData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [data, preferredWards, landlordTargetWards, currentAddress?.provinceCode, landlordCity?.provinceCode]);

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
        // Hydrate address line to UI (best effort)
        if (p?.currentLocation) setCurrentAddress({
          street: "",
          ward: p.currentLocation.split(",")[0] || "",
          city: p.currentLocation.split(",")[1]?.trim() || "",
          provinceCode: "", provinceName: "",
          wardCode: "", wardName: ""
        } as Address);
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

  // Landlord wards list reacts to landlordCity
  useEffect(() => {
    const load = async () => {
      if (!landlordCity?.provinceCode) { setLandlordWardOptions([]); setLandlordTargetWards([]); return; }
      try {
        let code = String(landlordCity.provinceCode || "");
        let wards = await addressService.getWardsByProvince(code);
        if (!Array.isArray(wards) || wards.length === 0) {
          const padded = code.padStart(2, '0');
          if (padded !== code) {
            wards = await addressService.getWardsByProvince(padded);
          }
        }
        setLandlordWardOptions(wards);
        setLandlordTargetWards(prev => prev.filter(w => wards.some(opt => opt.wardName === w)));
      } catch {
        setLandlordWardOptions([]);
      }
    };
    load();
  }, [landlordCity?.provinceCode]);

  // Load provinces for landlord city select
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

  // Đồng bộ preview với businessLicense nếu đã có URL từ server
  useEffect(() => {
    if (!licensePreview && data.businessLicense) {
      setLicensePreview(data.businessLicense);
    }
  }, [data.businessLicense]);

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
      const normalizedLifestyle = role === "user" ? (data.lifestyle ?? "quiet") : data.lifestyle;

      if (role === "user") {
        // User Preferences (40% completion) - cần 1 trong nhóm preferred* + budgetRange + roomType + amenities + lifestyle
        const hasPreferredLocation = Array.isArray(preferredWards) && preferredWards.length > 0;
        
        if (!hasPreferredLocation) {
          errs.push("Vui lòng chọn ít nhất 1 khu vực ưu tiên (phường/xã)");
        }
        if (!data.budgetRange || data.budgetRange.min == null || data.budgetRange.max == null) {
          errs.push("Vui lòng nhập khoảng ngân sách (tối thiểu và tối đa)");
        } else if (data.budgetRange.min > data.budgetRange.max) {
          errs.push("Ngân sách: tối thiểu phải nhỏ hơn hoặc bằng tối đa");
        }
        if (!Array.isArray(data.roomType) || data.roomType.length === 0) {
          errs.push("Vui lòng chọn ít nhất 1 loại phòng/căn hộ quan tâm");
        }
        if (!Array.isArray(data.amenities) || data.amenities.length === 0) {
          errs.push("Vui lòng chọn ít nhất 1 tiện ích mong muốn");
        }
        if (!normalizedLifestyle) {
          errs.push("Vui lòng chọn phong cách sống");
        }

        // Basic (30% completion) - dateOfBirth, gender, occupation, income, currentLocation
        if (!data.dateOfBirth) {
          errs.push("Vui lòng nhập ngày sinh");
        } else {
          const dateValidation = AgeUtils.validateDateOfBirth(data.dateOfBirth);
          if (!dateValidation.isValid) {
            errs.push(dateValidation.message || "Ngày sinh không hợp lệ");
          } else if (!AgeUtils.isAdult(data.dateOfBirth)) {
            errs.push("Bạn phải đủ 18 tuổi để sử dụng dịch vụ này");
          }
        }
        if (!data.gender) errs.push("Vui lòng chọn giới tính");
        if (!data.occupation) errs.push("Vui lòng chọn đối tượng thuê");
        if (data.income != null && data.income < 0) errs.push("Thu nhập không hợp lệ");
        if (!currentAddress?.provinceCode) {
          errs.push("Vui lòng chọn Thành phố để tìm trọ");
        }
      } else if (role === "landlord") {
        // Landlord Role (30% completion) - cần experience + propertyTypes + priceRange + 1 trong nhóm target*
        if (!data.experience) errs.push("Vui lòng chọn kinh nghiệm");
        if (!Array.isArray(data.propertyTypes) || data.propertyTypes.length === 0) {
          errs.push("Vui lòng chọn ít nhất 1 loại BĐS cho thuê");
        }
        if (!data.priceRange || data.priceRange.min == null || data.priceRange.max == null) {
          errs.push("Vui lòng nhập khoảng giá (tối thiểu và tối đa)");
        } else if (data.priceRange.min > data.priceRange.max) {
          errs.push("Khoảng giá: tối thiểu phải nhỏ hơn hoặc bằng tối đa");
        }
        
        // Cần 1 trong nhóm target* (targetWards|targetWardCodes|targetDistricts|targetCityCode|targetCityName)
        const hasTargetLocation = Array.isArray(landlordTargetWards) && landlordTargetWards.length > 0;
        
        if (!hasTargetLocation) {
          errs.push("Vui lòng chọn ít nhất 1 khu vực mục tiêu (thành phố/phường/xã)");
        }
        // Không bắt buộc các trường Basic cho role chủ nhà theo tài liệu
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
          console.log("Registration data:", regData);
          console.log("UserId from registration data:", regData.userId);
          
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
          console.log("User from registration:", userFromReg);
          actualUser = userFromReg;
        } catch (error) {
          console.error("Error parsing registration data:", error);
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
      
      // Không còn gửi địa chỉ hiện tại; giữ lại text để hiển thị nội bộ nếu cần
      const currentLocationText = undefined;

      // Chuẩn hóa dữ liệu gửi lên BE (map key nếu cần)
      const mapTargetTenantToBE = (v: string) => {
        switch (v) {
          case 'student': return 'sinh_vien';
          case 'office_worker': return 'nhan_vien_vp';
          case 'family': return 'gia_dinh';
          case 'couple': return 'cap_doi';
          case 'group_friends': return 'nhom_ban';
          default: return v;
        }
      };

      const normalizedTargetTenants = role === 'landlord'
        ? (data.targetTenants || []).map(mapTargetTenantToBE)
        : data.targetTenants;

      // Chuẩn hóa tiện ích/dịch vụ để đồng bộ và loại key cũ
      const validFeatureKeys = new Set<string>([
        "wifi","internet","camera_an_ninh","bao_ve_24_7","thang_may","gym",
        "dieu_hoa","tu_lanh","may_giat","bep","ban_cong","nuoc_nong","san_thuong",
        "san_vuon","ho_boi","sieu_thi","cho","truong_hoc","benh_vien","ben_xe","ga_tau",
        "bai_do_xe"
      ]);

      const normalizeFeatures = (arr?: string[]) => {
        const mapped = (arr || []).map(k => (k === "phong_gym" ? "gym" : k));
        const filtered = mapped.filter(k => validFeatureKeys.has(k));
        return Array.from(new Set(filtered));
      };

      const normalizedAmenities = normalizeFeatures(data.amenities);
      const normalizedAdditionalServices = normalizeFeatures(data.additionalServices);

      // Gắn kèm tên Thành phố để phân biệt trùng tên phường ở tỉnh/thành khác nhau
      const preferredCity = role === 'user' ? (currentAddress?.provinceName || currentAddress?.city || undefined) : undefined;
      const targetCity = role === 'landlord' ? (landlordCity?.provinceName || landlordCity?.city || undefined) : undefined;

      const payload: UserProfile = {
        ...data,
        lifestyle: normalizedLifestyle as any,
        userId: actualUser.userId,
        currentLocation: currentLocationText,
        // Theo role: chỉ dùng WARDS (phường) cho cả user và landlord
        preferredWards: role === 'user' ? preferredWards : undefined,
        targetWards: role === 'landlord' ? landlordTargetWards : undefined,
        // Đính kèm city để BE lưu cặp (city, ward)
        preferredCity,
        targetCity,
        targetTenants: normalizedTargetTenants,
        amenities: normalizedAmenities,
        additionalServices: normalizedAdditionalServices,
      } as UserProfile;

      console.log("Creating profile with userId:", actualUser.userId);
      console.log("Is registration flow:", isRegistrationFlow);
      console.log("Payload:", payload);
      
      try {
        if (isRegistrationFlow) {
          // Trong registration flow, profile đã được tạo sau OTP, chỉ cần update
          console.log("Updating profile in registration flow:", payload);
          await updateMyProfile(payload);
        } else {
          // User đã đăng nhập, thử tạo mới trước, nếu thất bại thì update
          try {
            console.log("Creating profile with regular API:", payload);
            await createProfile(payload);
          } catch (createError) {
            console.log("Create failed, trying to update profile instead");
            await updateMyProfile(payload);
          }
        }
      } catch (error) {
        console.error("Profile operation error:", error);
        throw new Error("Không thể lưu profile. Vui lòng thử lại.");
      }
      
      // Xóa flag đăng ký và chuyển về trang chủ
      if (typeof window !== "undefined") {
        localStorage.removeItem("isRegistrationFlow");
        localStorage.removeItem("registrationData");
        // Xóa bản nháp sau khi lưu thành công
        try { localStorage.removeItem(DRAFT_KEY); } catch {}
      }
      
      // Gọi refreshUser sau khi lưu thành công để hiển thị trạng thái đăng nhập
      try { const { refreshUser } = (await import("@/contexts/AuthContext")).useAuth(); await (refreshUser?.()); } catch {}
      // Sử dụng router.push thay vì window.location.href để giữ state
      router.push("/");
    } catch (e: any) {
      setError(e?.body?.message || e?.message || "Lưu khảo sát thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 space-y-6">
      <h1 className="text-2xl font-bold">Khảo sát hồ sơ ({role === "landlord" ? "Chủ nhà" : "Người dùng"})</h1>
      {error && <div className="text-red-600 text-sm whitespace-pre-line">{error}</div>}

      {role === "user" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldBox label="Ngày sinh" required>
            <input 
              type="date" 
              className="w-full px-2 py-1.5 text-sm outline-none" 
              value={formatDateForInput(data.dateOfBirth)} 
              onChange={e => setData(d => ({ ...d, dateOfBirth: e.target.value }))}
              max={new Date().toISOString().split('T')[0]} // Không cho phép chọn ngày trong tương lai
              required
            />
            {data.dateOfBirth && (
              <div className="text-xs mt-1">
                <span className="text-gray-500">
                  {AgeUtils.getAgeInfo(data.dateOfBirth).ageText}
                </span>
                {!AgeUtils.isAdult(data.dateOfBirth) && (
                  <span className="text-red-500 ml-2">
                    ⚠️ Phải đủ 18 tuổi
                  </span>
                )}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              * Bạn phải đủ 18 tuổi để sử dụng dịch vụ này
            </div>
          </FieldBox>
          <FieldBox label="Giới tính">
            <select className="w-full px-2 py-1.5 text-sm outline-none" value={data.gender ?? ""} onChange={e=>setData(d=>({...d, gender: (e.target.value || undefined) as UserProfile["gender"]}))}>
              <option value="" disabled>Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Thuê cho">
            <select
              className="w-full px-2 py-1.5 text-sm outline-none"
              value={data.occupation ?? ""}
              onChange={e=>setData(d=>({ ...d, occupation: e.target.value }))}
            >
              <option value="">-- Chọn đối tượng --</option>
              <option value="student">Sinh viên</option>
              <option value="office_worker">Nhân viên VP</option>
              <option value="family">Gia đình</option>
              <option value="couple">Cặp đôi</option>
              <option value="group_friends">Nhóm bạn</option>
            </select>
          </FieldBox>
          <FieldBox label="Thu nhập (ước tính)">
            <input type="number" className="w-full px-2 py-1.5 text-sm outline-none" value={data.income ?? ""} onChange={e=>setData(d=>({...d, income: toNumber(e.target.value)}))} />
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Thành phố để tìm trọ">
            <AddressSelector value={currentAddress} onChange={setCurrentAddress} fields={{ street: false, specificAddress: false, additionalInfo: false, preview: false, ward: false }} />
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Khu vực ưu tiên (nhiều)">
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
          <FieldBox label="Ngân sách tối thiểu">
            <input type="number" className="w-full px-2 py-1.5 text-sm outline-none" value={data.budgetRange?.min ?? ""} onChange={e=>setData(d=>({...d, budgetRange: { ...(d.budgetRange||{}), min: toNumber(e.target.value) }}))} />
          </FieldBox>
          <FieldBox label="Ngân sách tối đa">
            <input type="number" className="w-full px-2 py-1.5 text-sm outline-none" value={data.budgetRange?.max ?? ""} onChange={e=>setData(d=>({...d, budgetRange: { ...(d.budgetRange||{}), max: toNumber(e.target.value) }}))} />
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Tiện ích ưu tiên">
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { v: "wifi", t: "Wifi" },
                  { v: "bai_do_xe", t: "Bãi đỗ xe" },
                  { v: "gym", t: "Gym" },
                  { v: "dieu_hoa", t: "Điều hòa" },
                  { v: "tu_lanh", t: "Tủ lạnh" },
                  { v: "may_giat", t: "Máy giặt" },
                  { v: "bep", t: "Bếp" },
                  { v: "ban_cong", t: "Ban công" },
                  { v: "thang_may", t: "Thang máy" },
                  { v: "bao_ve_24_7", t: "Bảo vệ 24/7" },
                  { v: "camera_an_ninh", t: "Camera an ninh" },
                  { v: "internet", t: "Internet" },
                  { v: "nuoc_nong", t: "Nước nóng" },
                  { v: "san_thuong", t: "Sân thượng" },
                  { v: "san_vuon", t: "Sân vườn" },
                  { v: "ho_boi", t: "Hồ bơi" },
                  { v: "khu_vui_choi", t: "Khu vui chơi" },
                  { v: "sieu_thi", t: "Siêu thị" },
                  { v: "cho", t: "Chợ" },
                  { v: "truong_hoc", t: "Trường học" },
                  { v: "benh_vien", t: "Bệnh viện" },
                  { v: "ben_xe", t: "Bến xe" },
                  { v: "ga_tau", t: "Ga tàu" },
                ].map(opt => {
                  const checked = (data.amenities||[]).includes(opt.v);
                  return (
                    <label key={opt.v} className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                        checked={checked} 
                        onChange={(e)=>{
                          setData(d=>{
                            const set = new Set(d.amenities||[]);
                            e.target.checked ? set.add(opt.v) : set.delete(opt.v);
                            return { ...d, amenities: Array.from(set) };
                          });
                        }} 
                      />
                      <span>{opt.t}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Phong cách sống">
            <select className="w-full px-2 py-1.5 text-sm outline-none" value={data.lifestyle ?? "quiet"} onChange={e=>setData(d=>({...d, lifestyle: e.target.value as UserProfile["lifestyle"]}))}>
              <option value="quiet">Yên tĩnh</option>
              <option value="social">Xã hội</option>
              <option value="party">Thích tiệc tùng</option>
              <option value="study">Học tập</option>
            </select>
          </FieldBox>
          <FieldBox label="Hút thuốc?">
            <select className="w-full px-2 py-1.5 text-sm outline-none" value={String(data.smoking ?? false)} onChange={e=>setData(d=>({...d, smoking: e.target.value === "true"}))}>
              <option value="false">Không</option>
              <option value="true">Có</option>
            </select>
          </FieldBox>
          <FieldBox label="Nuôi thú cưng?">
            <select className="w-full px-2 py-1.5 text-sm outline-none" value={String(data.pets ?? false)} onChange={e=>setData(d=>({...d, pets: e.target.value === "true"}))}>
              <option value="false">Không</option>
              <option value="true">Có</option>
            </select>
          </FieldBox>
          <FieldBox label="Mức độ gọn gàng (1-5)">
            <input type="number" min={1} max={5} className="w-full px-2 py-1.5 text-sm outline-none" value={data.cleanliness ?? ""} onChange={e=>setData(d=>({...d, cleanliness: toNumber(e.target.value)}))} />
          </FieldBox>
          <FieldBox label="Mức độ hòa đồng (1-5)">
            <input type="number" min={1} max={5} className="w-full px-2 py-1.5 text-sm outline-none" value={data.socialLevel ?? ""} onChange={e=>setData(d=>({...d, socialLevel: toNumber(e.target.value)}))} />
          </FieldBox>
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
          <FieldBox className="md:col-span-2" label="Cách liên hệ ưa thích">
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
          <FieldBox className="md:col-span-2" label="Khung giờ liên hệ (ngày thường)">
            <input className="w-full px-2 py-1.5 text-sm outline-none" value={data.availableTime?.weekdays ?? ""} onChange={e=>setData(d=>({...d, availableTime: { ...(d.availableTime||{}), weekdays: e.target.value }}))} />
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Khung giờ liên hệ (cuối tuần)">
            <input className="w-full px-2 py-1.5 text-sm outline-none" value={data.availableTime?.weekends ?? ""} onChange={e=>setData(d=>({...d, availableTime: { ...(d.availableTime||{}), weekends: e.target.value }}))} />
          </FieldBox>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldBox label="Loại hình kinh doanh" required>
            <select className="w-full px-2 py-1.5 text-sm outline-none" value={data.businessType ?? ""} onChange={e=>setData(d=>({...d, businessType: (e.target.value || undefined) as UserProfile["businessType"]}))}>
              <option value="" disabled>Chọn loại hình</option>
              <option value="individual">Cá nhân</option>
              <option value="company">Công ty</option>
              <option value="agency">Môi giới</option>
            </select>
          </FieldBox>
          <FieldBox label="Kinh nghiệm" required>
            <select className="w-full px-2 py-1.5 text-sm outline-none" value={data.experience ?? ""} onChange={e=>setData(d=>({...d, experience: (e.target.value || undefined) as UserProfile["experience"]}))}>
              <option value="" disabled>Chọn kinh nghiệm</option>
              <option value="new">Mới</option>
              <option value="1-2_years">1-2 năm</option>
              <option value="3-5_years">3-5 năm</option>
              <option value="5+_years">5+ năm</option>
            </select>
          </FieldBox>
          {/* Bỏ trường Số bất động sản theo yêu cầu */}
          <FieldBox className="md:col-span-2" label="Thành phố mục tiêu" required>
            <select className="w-full px-2 py-1.5 text-sm outline-none" value={landlordCity?.provinceCode || ""} onChange={(e) => {
              const code = e.target.value;
              const name = provinceOptions.find(p=>p.code===code)?.name || "";
              setLandlordCity({ street: "", ward: "", city: name, specificAddress: "", provinceCode: code, provinceName: name, wardCode: "", wardName: "" } as Address);
            }}>
              <option value="">-- Chọn Tỉnh/Thành phố --</option>
              {provinceOptions.map(p => (<option key={p.code} value={p.code}>{p.name}</option>))}
            </select>
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Phường/Xã mục tiêu (nhiều)" required>
            <div className="max-h-56 overflow-auto rounded-lg p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
              {landlordWardOptions.map((opt) => {
                const checked = landlordTargetWards.includes(opt.wardName);
                return (
                  <label key={opt.wardCode} className="flex items-center gap-2 text-sm px-2 py-1 hover:bg-gray-50 rounded">
                    <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" checked={checked} onChange={(e) => setLandlordTargetWards(prev => e.target.checked ? Array.from(new Set([...prev, opt.wardName])) : prev.filter(w => w !== opt.wardName))} />
                    <span>{opt.wardName}</span>
                  </label>
                );
              })}
              {landlordWardOptions.length === 0 && (
                <div className="text-gray-500 text-sm px-2">Chọn Tỉnh/Thành phố để hiện danh sách phường</div>
              )}
            </div>
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Loại BĐS cho thuê" required>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { v: "phong_tro", t: "Phòng trọ" },
                { v: "chung_cu", t: "Chung cư/Căn hộ" },
                { v: "nha_nguyen_can", t: "Nhà nguyên căn" },
                { v: "can_ho_dv", t: "Căn hộ DV" },
                { v: "officetel", t: "Officetel" },
                { v: "studio", t: "Studio" },
              ].map(opt => {
                const checked = (data.propertyTypes||[]).includes(opt.v);
                return (
                  <label key={opt.v} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" checked={checked} onChange={(e)=>{
                      setData(d=>{
                        const set = new Set(d.propertyTypes||[]);
                        e.target.checked ? set.add(opt.v) : set.delete(opt.v);
                        return { ...d, propertyTypes: Array.from(set) };
                      });
                    }} />
                    <span>{opt.t}</span>
                  </label>
                );
              })}
            </div>
          </FieldBox>
          <FieldBox label="Khoảng giá tối thiểu">
            <input type="number" className="w-full px-2 py-1.5 text-sm outline-none" value={data.priceRange?.min ?? ""} onChange={e=>setData(d=>({...d, priceRange: { ...(d.priceRange||{}), min: toNumber(e.target.value) }}))} />
          </FieldBox>
          <FieldBox label="Khoảng giá tối đa">
            <input type="number" className="w-full px-2 py-1.5 text-sm outline-none" value={data.priceRange?.max ?? ""} onChange={e=>setData(d=>({...d, priceRange: { ...(d.priceRange||{}), max: toNumber(e.target.value) }}))} />
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Đối tượng khách thuê mục tiêu">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { v: "student", t: "Sinh viên" },
                { v: "family", t: "Gia đình" },
                { v: "office_worker", t: "Nhân viên VP" },
                { v: "couple", t: "Cặp đôi" },
                { v: "group_friends", t: "Nhóm bạn" },
              ].map(opt => {
                const checked = (data.targetTenants||[]).includes(opt.v);
                return (
                  <label key={opt.v} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" checked={checked} onChange={(e)=>{
                      setData(d=>{
                        const set = new Set(d.targetTenants||[]);
                        e.target.checked ? set.add(opt.v) : set.delete(opt.v);
                        return { ...d, targetTenants: Array.from(set) };
                      });
                    }} />
                    <span>{opt.t}</span>
                  </label>
                );
              })}
            </div>
          </FieldBox>
          <FieldBox label="Phong cách quản lý">
            <select className="w-full px-2 py-1.5 text-sm outline-none" value={data.managementStyle ?? "friendly"} onChange={e=>setData(d=>({...d, managementStyle: e.target.value as UserProfile["managementStyle"]}))}>
              <option value="strict">Nghiêm</option>
              <option value="flexible">Linh hoạt</option>
              <option value="friendly">Thân thiện</option>
            </select>
          </FieldBox>
          <FieldBox label="Thời gian phản hồi">
            <select className="w-full px-2 py-1.5 text-sm outline-none" value={data.responseTime ?? "within_day"} onChange={e=>setData(d=>({...d, responseTime: e.target.value as UserProfile["responseTime"]}))}>
              <option value="immediate">Ngay lập tức</option>
              <option value="within_hour">Trong 1 giờ</option>
              <option value="within_day">Trong ngày</option>
            </select>
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Tiện ích/Dịch vụ cung cấp (dùng cho matching)">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                // Đồng bộ với amenities của người thuê để matching 1-1
                { v: "wifi", t: "Wifi" },
                { v: "internet", t: "Internet" },
                { v: "camera_an_ninh", t: "Camera an ninh" },
                { v: "bao_ve_24_7", t: "Bảo vệ 24/7" },
                { v: "thang_may", t: "Thang máy" },
                { v: "gym", t: "Gym" },
                { v: "dieu_hoa", t: "Điều hòa" },
                { v: "tu_lanh", t: "Tủ lạnh" },
                { v: "may_giat", t: "Máy giặt" },
                { v: "bep", t: "Bếp" },
                { v: "ban_cong", t: "Ban công" },
                { v: "nuoc_nong", t: "Nước nóng" },
                { v: "san_thuong", t: "Sân thượng" },
                { v: "san_vuon", t: "Sân vườn" },
                { v: "ho_boi", t: "Hồ bơi" },
                { v: "sieu_thi", t: "Siêu thị" },
                { v: "cho", t: "Chợ" },
                { v: "truong_hoc", t: "Trường học" },
                { v: "benh_vien", t: "Bệnh viện" },
                { v: "ben_xe", t: "Bến xe" },
                { v: "ga_tau", t: "Ga tàu" },
                { v: "bai_do_xe", t: "Bãi đỗ xe" },
              ].map(opt => {
                const checked = (data.additionalServices||[]).includes(opt.v);
                return (
                  <label key={opt.v} className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                      checked={checked} 
                      onChange={(e)=>{
                        setData(d=>{
                          const set = new Set(d.additionalServices||[]);
                          e.target.checked ? set.add(opt.v) : set.delete(opt.v);
                          return { ...d, additionalServices: Array.from(set) };
                        });
                      }} 
                    />
                    <span>{opt.t}</span>
                  </label>
                );
              })}
            </div>
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Giấy phép kinh doanh (ảnh)" required>
            <input
              ref={licenseInputRef}
              key={licenseInputKey}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e)=>{
                const input = e.target as HTMLInputElement;
                const file = input.files?.[0];
                // Nếu bấm hủy, không làm gì và giữ nguyên preview cũ
                if (!file) { input.value = ""; return; }
                try {
                  // Hiển thị preview tạm thời ngay lập tức
                  const tmpUrl = URL.createObjectURL(file);
                  setLicensePreview(tmpUrl);
                  setLicenseFileName(file.name);
                  setLicenseUploading(true);
                  setLoading(true);
                  // Upload và thay preview bằng URL thật khi xong
                  const uid = getStableUserId();
                  const [url] = uid && uid > 0
                    ? await uploadFiles([file], uid, "images")
                    : await uploadFiles([file]);
                  setData(d=>({ ...d, businessLicense: url }));
                  setLicensePreview(url);
                  // Giải phóng blob tạm
                  try { URL.revokeObjectURL(tmpUrl); } catch {}
                } catch (err: any) {
                  // Giữ preview tạm, có thể thông báo lỗi nếu cần
                  console.error("Upload business license failed", err);
                  const msg = (err && typeof err.message === 'string') ? err.message : 'Tải ảnh thất bại. Vui lòng thử lại.';
                  setError(msg);
                } finally {
                  setLoading(false);
                  setLicenseUploading(false);
                  // Reset để có thể chọn lại cùng một file lần nữa
                  input.value = "";
                  setLicenseInputKey(k => k + 1);
                }
              }}
            />
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
              onClick={() => {
                try { if (licenseInputRef.current) licenseInputRef.current.click(); } catch {}
              }}
            >
              {licenseUploading ? "Đang chọn/đang tải..." : "Chọn ảnh"}
            </button>
            {(licensePreview || data.businessLicense) && (
              <div className="mt-2 p-2 border rounded-lg">
                <img src={data.businessLicense || licensePreview} alt="Giấy phép" className="max-h-40 object-contain mx-auto" />
              </div>
            )}
            {(licenseFileName || licenseUploading) && (
              <div className="mt-2 text-xs text-gray-600">
                {licenseFileName && <span>Tệp: {licenseFileName} · </span>}
                {licenseUploading ? <span className="text-amber-600">Đang tải lên...</span> : (data.businessLicense ? <span className="text-green-600">Đã tải xong</span> : null)}
              </div>
            )}
          </FieldBox>
          {/* Thông tin ngân hàng (fieldset riêng, không auto-focus) */}
          <fieldset 
            className="md:col-span-2 rounded-lg border"
            onMouseDown={(e)=>e.stopPropagation()}
            onClick={(e)=>e.stopPropagation()}
          >
            <legend className="px-2 ml-2 text-sm text-gray-700">Thông tin ngân hàng</legend>
            <div className="px-3 pb-3 pt-0.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select className="w-full px-2 py-1.5 text-sm outline-none border rounded-lg" value={data.bankAccount?.bankName ?? ""} onChange={e=>setData(d=>({
                  ...d,
                  bankAccount: { bankName: e.target.value, accountNumber: d.bankAccount?.accountNumber ?? "", accountHolder: d.bankAccount?.accountHolder ?? "" }
                }))}>
                  <option value="">-- Chọn ngân hàng --</option>
                  {["Vietcombank","VietinBank","BIDV","Agribank","Techcombank","MB Bank","ACB","Sacombank","VPBank","TPBank","HDBank","SHB","VIB"].map(b => <option key={b} value={b}>{b}</option>)}
                  <option value="Khác">Khác</option>
                </select>
                <input 
                  className="w-full px-2 py-1.5 text-sm outline-none border rounded-lg" 
                  value={data.bankAccount?.accountNumber ?? ""} 
                  onChange={e=>setData(d=>({
                    ...d,
                    bankAccount: { bankName: d.bankAccount?.bankName ?? "", accountNumber: e.target.value, accountHolder: d.bankAccount?.accountHolder ?? "" }
                  }))}
                  placeholder={data.bankAccount?.bankName ? "Số tài khoản" : "Chọn ngân hàng trước"}
                  inputMode="numeric"
                  autoComplete="off"
                  disabled={!data.bankAccount?.bankName}
                />
                <input 
                  className="w-full px-2 py-1.5 text-sm outline-none border rounded-lg" 
                  value={data.bankAccount?.accountHolder ?? ""} 
                  onChange={e=>setData(d=>({
                    ...d,
                    bankAccount: { bankName: d.bankAccount?.bankName ?? "", accountNumber: d.bankAccount?.accountNumber ?? "", accountHolder: e.target.value }
                  }))}
                  placeholder={data.bankAccount?.bankName ? "Chủ tài khoản" : "Chọn ngân hàng trước"}
                  autoComplete="name"
                  disabled={!data.bankAccount?.bankName}
                />
              </div>
            </div>
          </fieldset>
          <FieldBox className="md:col-span-2" label="Cách liên hệ ưa thích">
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
          <FieldBox className="md:col-span-2" label="Khung giờ liên hệ (ngày thường)">
            <input className="w-full px-2 py-1.5 text-sm outline-none" value={data.availableTime?.weekdays ?? ""} onChange={e=>setData(d=>({...d, availableTime: { ...(d.availableTime||{}), weekdays: e.target.value }}))} />
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Khung giờ liên hệ (cuối tuần)">
            <input className="w-full px-2 py-1.5 text-sm outline-none" value={data.availableTime?.weekends ?? ""} onChange={e=>setData(d=>({...d, availableTime: { ...(d.availableTime||{}), weekends: e.target.value }}))} />
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


