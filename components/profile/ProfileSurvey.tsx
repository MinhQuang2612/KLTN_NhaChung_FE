"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createProfile, getMyProfile, updateMyProfile, UserProfile } from "@/services/userProfiles";
import AddressSelector from "@/components/common/AddressSelector";
import { addressService, type Address, type Ward } from "@/services/address";
import { uploadFiles } from "@/utils/upload";

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

  // helpers
  const toNumber = (v: string): number | undefined => (v === "" ? undefined : Number(v));

  useEffect(() => {
    const fetch = async () => {
      if (!user?.userId) return;
      try {
        setLoading(true);
        const p = await getMyProfile(user.userId);
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
  }, [user?.userId]);

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
    if (!user?.userId) return;
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
      const currentLocationText = currentAddress
        ? `${currentAddress.ward || currentAddress.wardName || ""}, ${currentAddress.city || currentAddress.provinceName || ""}`.replace(/^,\s*|\s*,\s*$/g, "")
        : data.currentLocation;

      const payload: UserProfile = {
        ...data,
        userId: user.userId,
        currentLocation: currentLocationText,
        preferredDistricts: preferredWards,
      };

      try {
        await createProfile(payload);
      } catch {
        await updateMyProfile(user.userId, payload);
      }
      window.location.href = "/";
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
          <FieldBox label="Tuổi">
            <input type="number" className="w-full px-2 py-1.5 text-sm outline-none" value={data.age ?? ""} onChange={e=>setData(d=>({...d, age: toNumber(e.target.value)}))} />
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
            <input className="w-full px-2 py-1.5 text-sm outline-none" value={data.occupation ?? ""} onChange={e=>setData(d=>({...d, occupation: e.target.value }))} />
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
            <input className="w-full px-2 py-1.5 text-sm outline-none" placeholder="wifi, parking, gym" value={(data.amenities || []).join(", ")} onChange={e=>setData(d=>({...d, amenities: e.target.value.split(",").map(s=>s.trim())}))} />
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
          <FieldBox className="md:col-span-2" label="Cách liên hệ ưa thích">
            <input className="w-full px-2 py-1.5 text-sm outline-none" placeholder="email, phone, zalo" value={(data.contactMethod || []).join(", ")} onChange={e=>setData(d=>({...d, contactMethod: e.target.value.split(",").map(s=>s.trim())}))} />
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
            <input className="w-full px-2 py-1.5 text-sm outline-none" placeholder="email, phone, zalo" value={(data.contactMethod || []).join(", ")} onChange={e=>setData(d=>({...d, contactMethod: e.target.value.split(",").map(s=>s.trim())}))} />
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
        <button onClick={()=>{ window.location.href = "/profile/survey"; }} className="h-10 px-5 rounded-lg border border-gray-300">Trở lại</button>
        <button onClick={save} disabled={loading} className="h-10 px-5 rounded-lg bg-teal-600 text-white">{loading ? "Đang lưu..." : "Hoàn tất"}</button>
      </div>
    </div>
  );
}


