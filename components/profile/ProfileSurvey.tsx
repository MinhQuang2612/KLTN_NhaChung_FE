"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createProfile, createProfilePublic, createProfilePublicFallback, getMyProfile, updateMyProfile, UserProfile } from "@/services/userProfiles";
import AddressSelector from "@/components/common/AddressSelector";
import { addressService, type Address, type Ward } from "@/services/address";
import { uploadFiles } from "@/utils/upload";
import { AgeUtils } from "@/utils/ageUtils";
import { User } from "@/types/User";
import { loginService } from "@/services/auth";

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
  // UX helpers for required hints
  const [focusedField, setFocusedField] = useState<string>("");
  // Local user state for registration flow
  const [localUser, setLocalUser] = useState<User | null>(null);

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
        const p = await getMyProfile(currentUser.userId);
        setData(p || {});
        // Hydrate address line to UI (best effort)
        if (p?.currentLocation) setCurrentAddress({
          street: "",
          ward: p.currentLocation.split(",")[0] || "",
          city: p.currentLocation.split(",")[1]?.trim() || "",
          provinceCode: "", provinceName: "",
          wardCode: "", wardName: ""
        } as Address);
        if (Array.isArray(p?.preferredDistricts)) setPreferredWards(p!.preferredDistricts!);
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
      // Common validations for both roles
      if (!currentAddress?.provinceCode || !currentAddress?.wardCode) {
        errs.push("Vui lòng chọn Tỉnh/Thành phố và Phường/Xã cho khu vực đang ở");
      }
      if (!Array.isArray(preferredWards) || preferredWards.length === 0) {
        errs.push("Vui lòng chọn ít nhất 1 phường ưu tiên");
      }
      if (!data.gender) errs.push("Vui lòng chọn giới tính");
      if (!data.occupation || !data.occupation.trim()) errs.push("Vui lòng nhập nghề nghiệp");
      if (data.income != null && data.income < 0) errs.push("Thu nhập không hợp lệ");
      
      // Validate dateOfBirth - Bắt buộc phải đủ 18 tuổi
      if (!data.dateOfBirth) {
        errs.push("Vui lòng nhập ngày sinh");
      } else {
        const dateValidation = AgeUtils.validateDateOfBirth(data.dateOfBirth);
        if (!dateValidation.isValid) {
          errs.push(dateValidation.message || "Ngày sinh không hợp lệ");
        } else {
          if (!AgeUtils.isAdult(data.dateOfBirth)) {
            errs.push("Bạn phải đủ 18 tuổi để sử dụng dịch vụ này");
          }
        }
      }
      if (data.budgetRange) {
        const { min, max } = data.budgetRange;
        if (min != null && min < 0) errs.push("Ngân sách tối thiểu không hợp lệ");
        if (max != null && max < 0) errs.push("Ngân sách tối đa không hợp lệ");
        if (min != null && max != null && min > max) errs.push("Ngân sách: tối thiểu phải nhỏ hơn hoặc bằng tối đa");
      }
      if (!Array.isArray(data.roomType) || data.roomType.length === 0) {
        errs.push("Vui lòng mô tả loại phòng/căn hộ quan tâm (đã hiểu được tối thiểu 1 loại)");
      }
      if (!Array.isArray(data.contactMethod) || data.contactMethod.length === 0) {
        errs.push("Vui lòng nhập ít nhất 1 cách liên hệ ưa thích");
      }

      // Landlord specific validations
      if (role === "landlord") {
        if (!data.businessType) errs.push("Vui lòng chọn loại hình kinh doanh");
        if (!data.experience) errs.push("Vui lòng chọn kinh nghiệm");
        if (data.propertiesCount != null && data.propertiesCount < 0) errs.push("Số bất động sản không hợp lệ");
        if (!Array.isArray(data.propertyTypes) || data.propertyTypes.length === 0) {
          errs.push("Vui lòng nhập loại BĐS cho thuê (tối thiểu 1 loại)");
        }
        if (!data.priceRange || data.priceRange.min == null || data.priceRange.max == null) {
          errs.push("Vui lòng nhập khoảng giá (tối thiểu và tối đa)");
        } else if (data.priceRange.min! > data.priceRange.max!) {
          errs.push("Khoảng giá: tối thiểu phải nhỏ hơn hoặc bằng tối đa");
        }
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
      
      const currentLocationText = currentAddress
        ? `${currentAddress.ward || currentAddress.wardName || ""}, ${currentAddress.city || currentAddress.provinceName || ""}`.replace(/^,\s*|\s*,\s*$/g, "")
        : data.currentLocation;

      const payload: UserProfile = {
        ...data,
        userId: actualUser.userId,
        currentLocation: currentLocationText,
        preferredDistricts: preferredWards,
      };

      console.log("Creating profile with userId:", actualUser.userId);
      console.log("Is registration flow:", isRegistrationFlow);
      console.log("Payload:", payload);
      
      try {
        if (isRegistrationFlow && actualUser.userId > 0) {
          // Sử dụng API public cho registration flow với userId thật
          console.log("Creating profile with public API:", payload);
          try {
            await createProfilePublic(payload);
          } catch (error) {
            console.log("Public API failed, trying fallback:", error);
            await createProfilePublicFallback({
              ...payload,
              email: actualUser.email
            });
          }
        } else if (isRegistrationFlow && actualUser.userId === 0) {
          console.error("No userId found in registration flow");
          throw new Error("Không tìm thấy userId. Vui lòng thử lại từ đầu.");
        } else {
          // Sử dụng API thông thường cho user đã đăng nhập
          console.log("Creating profile with regular API:", payload);
          await createProfile(payload);
        }
      } catch (error) {
        console.error("Profile creation error:", error);
        // Nếu tạo mới thất bại, thử cập nhật (chỉ cho user đã đăng nhập)
        if (!isRegistrationFlow) {
          console.log("Trying to update profile instead");
          await updateMyProfile(actualUser.userId, payload);
        } else {
          throw new Error("Không thể tạo profile. Vui lòng thử lại.");
        }
      }
      
      // Xóa flag đăng ký và chuyển về trang chủ
      if (typeof window !== "undefined") {
        localStorage.removeItem("isRegistrationFlow");
        localStorage.removeItem("registrationData");
      }
      
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
          <FieldBox className="md:col-span-2" label="Nghề nghiệp">
            <select className="w-full px-2 py-1.5 text-sm outline-none" value={data.occupation ?? ""} onChange={e=>setData(d=>({...d, occupation: e.target.value }))}>
              <option value="" disabled>Chọn nghề nghiệp</option>
              <option value="sinh_vien">Sinh viên</option>
              <option value="hoc_sinh">Học sinh</option>
              <option value="nhan_vien_van_phong">Nhân viên văn phòng</option>
              <option value="hanh_chinh">Hành chính</option>
              <option value="ca_dem">Ca đêm</option>
              <option value="tu_do">Tự do</option>
              <option value="kinh_doanh">Kinh doanh</option>
              <option value="giao_vien">Giáo viên</option>
              <option value="bac_si">Bác sĩ</option>
              <option value="ky_su">Kỹ sư</option>
              <option value="luat_su">Luật sư</option>
              <option value="thiet_ke">Thiết kế</option>
              <option value="marketing">Marketing</option>
              <option value="it">IT/Công nghệ thông tin</option>
              <option value="ngan_hang">Ngân hàng</option>
              <option value="ban_hang">Bán hàng</option>
              <option value="dich_vu">Dịch vụ</option>
              <option value="nong_nghiep">Nông nghiệp</option>
              <option value="cong_nhan">Công nhân</option>
              <option value="tai_xe">Tài xế</option>
              <option value="dau_bep">Đầu bếp</option>
              <option value="tho_lam_toc">Thợ làm tóc</option>
              <option value="tho_sua_chua">Thợ sửa chữa</option>
              <option value="tho_dien">Thợ điện</option>
              <option value="tho_ong_nuoc">Thợ ống nước</option>
              <option value="bao_ve">Bảo vệ</option>
              <option value="lau_don">Lau dọn</option>
              <option value="giao_hang">Giao hàng</option>
              <option value="shipper">Shipper</option>
              <option value="grab_uber">Grab/Uber</option>
              <option value="youtuber">YouTuber</option>
              <option value="streamer">Streamer</option>
              <option value="freelancer">Freelancer</option>
              <option value="thu_ky">Thư ký</option>
              <option value="ke_toan">Kế toán</option>
              <option value="nhan_su">Nhân sự</option>
              <option value="ban_giam_doc">Ban giám đốc</option>
              <option value="quan_ly">Quản lý</option>
              <option value="giam_doc">Giám đốc</option>
              <option value="chu_tich">Chủ tịch</option>
              <option value="nghi_huu">Nghỉ hưu</option>
              <option value="that_nghiep">Thất nghiệp</option>
              <option value="khac">Khác</option>
            </select>
          </FieldBox>
          <FieldBox label="Thu nhập (ước tính)">
            <input type="number" className="w-full px-2 py-1.5 text-sm outline-none" value={data.income ?? ""} onChange={e=>setData(d=>({...d, income: toNumber(e.target.value)}))} />
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Khu vực đang ở">
            <AddressSelector value={currentAddress} onChange={setCurrentAddress} fields={{ street: false, specificAddress: false, additionalInfo: false, preview: false }} />
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
                  { v: "phong_gym", t: "Phòng gym" },
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
          <FieldBox label="Số bất động sản">
            <input type="number" className="w-full px-2 py-1.5 text-sm outline-none" value={data.propertiesCount ?? ""} onChange={e=>setData(d=>({...d, propertiesCount: toNumber(e.target.value)}))} />
          </FieldBox>
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
                { v: "sinh_vien", t: "Sinh viên" },
                { v: "gia_dinh", t: "Gia đình" },
                { v: "nhan_vien_vp", t: "Nhân viên VP" },
                { v: "cap_doi", t: "Cặp đôi" },
                { v: "nhom_ban", t: "Nhóm bạn" },
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
          <FieldBox className="md:col-span-2" label="Dịch vụ bổ sung">
            <input className="w-full px-2 py-1.5 text-sm outline-none" placeholder="vệ sinh, bảo trì, quản lý tòa nhà" value={(data.additionalServices || []).join(", ")} onChange={e=>setData(d=>({...d, additionalServices: e.target.value.split(",").map(s=>s.trim())}))} />
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Giấy phép kinh doanh (ảnh)" required>
            <input type="file" accept="image/*" className="w-full text-sm" onChange={async (e)=>{
              const file = e.target.files?.[0];
              if (!file || !user?.userId) return;
              try {
                setLoading(true);
                const tmpUrl = URL.createObjectURL(file);
                setLicensePreview(tmpUrl);
                const [url] = await uploadFiles([file], Number(user.userId), "images");
                setData(d=>({ ...d, businessLicense: url }));
              } finally { setLoading(false); }
            }} />
            {(licensePreview || data.businessLicense) && (
              <div className="mt-2 p-2 border rounded-lg">
                <img src={data.businessLicense || licensePreview} alt="Giấy phép" className="max-h-40 object-contain mx-auto" />
              </div>
            )}
          </FieldBox>
          <FieldBox className="md:col-span-2" label="Thông tin ngân hàng">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select className="w-full px-2 py-1.5 text-sm outline-none border rounded-lg" value={data.bankAccount?.bankName ?? ""} onChange={e=>setData(d=>({
                ...d,
                bankAccount: { bankName: e.target.value, accountNumber: d.bankAccount?.accountNumber ?? "", accountHolder: d.bankAccount?.accountHolder ?? "" }
              }))}>
                <option value="">-- Chọn --</option>
                {["Vietcombank","VietinBank","BIDV","Agribank","Techcombank","MB Bank","ACB","Sacombank","VPBank","TPBank","HDBank","SHB","VIB"].map(b => <option key={b} value={b}>{b}</option>)}
                <option value="Khác">Khác</option>
              </select>
              <input className="w-full px-2 py-1.5 text-sm outline-none border rounded-lg" value={data.bankAccount?.accountNumber ?? ""} onChange={e=>setData(d=>({
                ...d,
                bankAccount: { bankName: d.bankAccount?.bankName ?? "", accountNumber: e.target.value, accountHolder: d.bankAccount?.accountHolder ?? "" }
              }))} />
              <input className="w-full px-2 py-1.5 text-sm outline-none border rounded-lg" value={data.bankAccount?.accountHolder ?? ""} onChange={e=>setData(d=>({
                ...d,
                bankAccount: { bankName: d.bankAccount?.bankName ?? "", accountNumber: d.bankAccount?.accountNumber ?? "", accountHolder: e.target.value }
              }))} />
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


