import { useEffect, useMemo, useState } from "react";
import MediaPickerPanel, { LocalMediaItem } from "@/components/common/MediaPickerLocal";
import { Building } from "@/types/Building";
import { Address } from "@/types/RentPost";
import { CreateRoomPayload, DirectionType, FurnitureType, LegalStatusType } from "@/types/Room";
import { uploadFiles } from "@/utils/upload";
import { useAuth } from "@/contexts/AuthContext";

export default function ChungCuForm({
  building,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: {
  building: Building;
  initialData?: Partial<CreateRoomPayload>;
  onSubmit: (data: CreateRoomPayload) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const { user } = useAuth();
  const [mediaImages, setMediaImages] = useState<LocalMediaItem[]>([]);
  const [mediaVideos, setMediaVideos] = useState<LocalMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<CreateRoomPayload>({
    buildingId: building.buildingId,
    roomNumber: "",
    floor: 1,
    area: 30,
    price: 0,
    deposit: 0,
    furniture: "co-ban",
    bedrooms: 1,
    bathrooms: 1,
    direction: "dong",
    legalStatus: "co-so-hong",
    address: {
      street: building.address.street || "",
      ward: building.address.ward || "",
      city: building.address.city || "",
      provinceCode: building.address.provinceCode || "",
      provinceName: building.address.provinceName || "",
      wardCode: building.address.wardCode || "",
      wardName: building.address.wardName || "",
      specificAddress: (initialData?.address as Address)?.specificAddress || "",
      showSpecificAddress: false,
      additionalInfo: (initialData?.address as Address)?.additionalInfo || "",
    },
    maxOccupancy: 2,
    canShare: false,
    sharePrice: undefined,
    chungCuInfo: {
      buildingName: building.name,
      blockOrTower: "",
      floorNumber: 1,
      unitCode: "",
      propertyType: "chung-cu",
    },
    nhaNguyenCanInfo: undefined,
    utilities: {
      electricityPricePerKwh: 0,
      waterPrice: 0,
      waterBillingType: "per_person" as const,
      internetFee: 0,
      garbageFee: 0,
      cleaningFee: 0,
      parkingMotorbikeFee: 0,
      parkingCarFee: 0,
      managementFee: 0,
      managementFeeUnit: "per_month" as const,
      gardeningFee: 0,
      cookingGasFee: 0,
      includedInRent: {
        electricity: false,
        water: false,
        internet: false,
        garbage: false,
        cleaning: false,
        parkingMotorbike: false,
        parkingCar: false,
        managementFee: false,
      },
    },
    images: initialData?.images || [],
    videos: initialData?.videos || [],
    description: initialData?.description || "",
    ...initialData,
  });

  // Helpers chuẩn hóa hiển thị số: 0 -> '', loại bỏ 0 đầu vào
  const numberToDisplay = (n: any) => {
    if (n === null || n === undefined) return "";
    const num = Number(n);
    return Number.isFinite(num) && num !== 0 ? String(num) : "";
  };
  const stripLeadingZeros = (s: string) => s.replace(/^0+(?=\d)/, "");
  // number input hiển thị dạng chuỗi để cho phép xóa
  const [nums, setNums] = useState<Record<string, string>>({
    area: numberToDisplay(form.area) || String(form.area),
    price: numberToDisplay(form.price),
    deposit: numberToDisplay(form.deposit),
    bedrooms: numberToDisplay(form.bedrooms) || String(form.bedrooms),
    bathrooms: numberToDisplay(form.bathrooms) || String(form.bathrooms),
    maxOccupancy: numberToDisplay(form.maxOccupancy) || String(form.maxOccupancy),
    sharePrice: numberToDisplay(form.sharePrice),
    chungcu_floorNumber: String(form.chungCuInfo?.floorNumber ?? 1),
    electricityPricePerKwh: numberToDisplay(form.utilities?.electricityPricePerKwh ?? ''),
    waterPrice: numberToDisplay(form.utilities?.waterPrice ?? ''),
    internetFee: numberToDisplay(form.utilities?.internetFee ?? ''),
    garbageFee: numberToDisplay(form.utilities?.garbageFee ?? ''),
    cleaningFee: numberToDisplay(form.utilities?.cleaningFee ?? ''),
    managementFee: numberToDisplay(form.utilities?.managementFee ?? ''),
    parkingCarFee: numberToDisplay(form.utilities?.parkingCarFee ?? ''),
    parkingMotorbikeFee: numberToDisplay(form.utilities?.parkingMotorbikeFee ?? ''),
    gardeningFee: numberToDisplay(form.utilities?.gardeningFee ?? ''),
    cookingGasFee: numberToDisplay(form.utilities?.cookingGasFee ?? ''),
    estimatedMonthlyUtilities: numberToDisplay((form as any).estimatedMonthlyUtilities ?? ''),
    capIncludedAmount: numberToDisplay((form as any).capIncludedAmount ?? ''),
  });

  const setField = (key: keyof CreateRoomPayload, value: any) => {
    setForm((p) => ({ ...p, [key]: value }));
  };
  const setChungCu = (key: keyof NonNullable<CreateRoomPayload["chungCuInfo"]>, value: any) => {
    setForm((p) => ({ ...p, chungCuInfo: { ...(p.chungCuInfo || { buildingName: building.name, blockOrTower: "", floorNumber: 1, unitCode: "", propertyType: "chung-cu" }), [key]: value } }));
  };

  const setNumDisp = (k: string, v: string) => setNums((p) => ({ ...p, [k]: stripLeadingZeros(v) }));
  const commitNum = (k: string, parse: (s: string) => number, min?: number, sink?: (n: number) => void) => {
    const raw = nums[k];
    if (raw === "") return;
    let n = parse(raw);
    if (Number.isNaN(n)) return;
    if (typeof min === "number" && n < min) n = min;
    if (sink) sink(n);
  };

  // Map includedInRent -> fee field
  const includedFeeMap: Record<string, keyof NonNullable<CreateRoomPayload["utilities"]>> = {
    electricity: "electricityPricePerKwh",
    water: "waterPrice",
    internet: "internetFee",
    garbage: "garbageFee",
    cleaning: "cleaningFee",
    parkingMotorbike: "parkingMotorbikeFee",
    parkingCar: "parkingCarFee",
    managementFee: "managementFee",
  };

  const handleIncludedChange = (
    key: keyof NonNullable<CreateRoomPayload["utilities"]>["includedInRent"],
    checked: boolean
  ) => {
    setForm((p) => {
      const next: CreateRoomPayload = {
        ...p,
        utilities: {
          ...(p.utilities || {}),
          includedInRent: {
            ...((p.utilities || {}).includedInRent || {}),
            [key]: checked,
          },
        },
      } as CreateRoomPayload;

      const feeField = includedFeeMap[key as string];
      if (feeField) {
        const feeVal = checked ? 0 : (next.utilities as any)[feeField] ?? 0;
        (next.utilities as any)[feeField] = feeVal;
        setNums((prev) => ({ ...prev, [feeField]: String(feeVal) }));
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploading(true);
      const uid = user?.userId;
      const imgUrls = mediaImages.length ? await uploadFiles(mediaImages.map((m) => m.file), uid as any) : [];
      const vidUrls = mediaVideos.length ? await uploadFiles(mediaVideos.map((m) => m.file), uid as any, "videos") : [];
      // Chuẩn hóa: dùng tầng từ chung cư làm floor
      const floorFromChungCu = form.chungCuInfo?.floorNumber ?? form.floor;
      // Nếu includedInRent true thì đảm bảo phí = 0
      const normalizedUtilities = (() => {
        const u = { ...(form.utilities || {}) } as any;
        const inc = (u.includedInRent || {}) as Record<string, boolean>;
        Object.entries(includedFeeMap).forEach(([incKey, feeKey]) => {
          if (inc[incKey]) u[feeKey] = 0;
        });
        return u;
      })();

      // đảm bảo unitCode có giá trị mặc định theo roomNumber nếu người dùng không nhập
      const ensuredChungCuInfo = {
        ...(form.chungCuInfo || {}),
        unitCode: (form.chungCuInfo?.unitCode && form.chungCuInfo.unitCode.trim()) ? form.chungCuInfo.unitCode : form.roomNumber,
      } as NonNullable<CreateRoomPayload["chungCuInfo"]>;

      const data: CreateRoomPayload = {
        ...form,
        floor: floorFromChungCu as number,
        chungCuInfo: ensuredChungCuInfo,
        images: [...(form.images || []), ...imgUrls],
        videos: [...(form.videos || []), ...vidUrls],
        utilities: normalizedUtilities,
      };
      onSubmit(data);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header cố định */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Phòng chung cư</h2>
            <p className="text-sm text-gray-500">{building?.name ? `Dãy: ${building.name}` : "Thêm mới phòng"}</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Đóng" className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 hover:bg-gray-50">
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Media left */}
          <div className="lg:col-span-1 p-6 space-y-6 border-r border-gray-100 max-h-[70vh] overflow-y-auto pr-2 nice-scrollbar">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Ảnh</h3>
              <MediaPickerPanel mediaItems={mediaImages} onMediaChange={setMediaImages} maxImages={12} maxVideos={0} extraTop={
                form.images?.length ? (
                  <div className="mb-3 grid grid-cols-3 gap-3">
                    {form.images.map((u, i) => (
                      <div key={i} className="relative pb-[133%] rounded-2xl overflow-hidden border">
                        <img src={u} className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : null
              } />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Video</h3>
              <MediaPickerPanel accept="video/*" pillText="Video hợp lệ" mediaItems={mediaVideos} onMediaChange={setMediaVideos} maxImages={2} maxVideos={2} />
            </div>
          </div>

          {/* Fields right */}
          <div className="lg:col-span-2 p-6 space-y-10 max-h-[70vh] overflow-y-auto pr-2 nice-scrollbar">

            {/* Thông tin chung cư */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Thông tin chung cư</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dãy</label>
                  <input className="w-full px-4 py-2 border rounded-lg bg-gray-50" value={building.name} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số phòng *</label>
                  <input className="w-full px-4 py-2 border rounded-lg" value={form.roomNumber} onChange={(e) => { const v=e.target.value; setField("roomNumber", v); setChungCu("unitCode", v); }} placeholder="A101" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Block/Tháp</label>
                  <input className="w-full px-4 py-2 border rounded-lg" value={form.chungCuInfo?.blockOrTower || ""} onChange={(e) => setChungCu("blockOrTower", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tầng số</label>
                  <input type="number" min={1} className="w-full px-4 py-2 border rounded-lg" value={nums.chungcu_floorNumber} onChange={(e) => setNumDisp("chungcu_floorNumber", e.target.value)} onBlur={() => commitNum("chungcu_floorNumber", (s) => parseInt(s, 10), 1, (n) => setChungCu("floorNumber", n))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mã căn</label>
                  <input className="w-full px-4 py-2 border rounded-lg" value={form.chungCuInfo?.unitCode || ""} onChange={(e) => setChungCu("unitCode", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại BĐS</label>
                  <input className="w-full px-4 py-2 border rounded-lg bg-gray-50" value="Chung cư" disabled />
                </div>
                {/* Địa chỉ (gộp thành 1 input) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                  <input 
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50" 
                    value={`${building.address.specificAddress || ""} ${building.address.street || ""}, ${building.address.wardName || ""}, ${building.address.city || ""}`.trim()} 
                    disabled 
                  />
                </div>
              </div>
            </section>

            {/* Diện tích sử dụng & bố cục */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Diện tích sử dụng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diện tích (m²) *</label>
                  <input type="number" min={1} step="0.1" className="w-full px-4 py-2 border rounded-lg" value={nums.area} onChange={(e) => setNumDisp("area", e.target.value)} onBlur={() => commitNum("area", (s) => parseFloat(s), 1, (n) => setField("area", n))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nội thất</label>
                  <select className="w-full px-4 py-2 border rounded-lg" value={form.furniture} onChange={(e) => setField("furniture", e.target.value as FurnitureType)}>
                    <option value="full">Đầy đủ</option>
                    <option value="co-ban">Cơ bản</option>
                    <option value="trong">Trống</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phòng ngủ *</label>
                  <input type="number" min={1} className="w-full px-4 py-2 border rounded-lg" value={nums.bedrooms} onChange={(e) => setNumDisp("bedrooms", e.target.value)} onBlur={() => commitNum("bedrooms", (s) => parseInt(s, 10), 1, (n) => setField("bedrooms", n))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phòng tắm *</label>
                  <input type="number" min={1} className="w-full px-4 py-2 border rounded-lg" value={nums.bathrooms} onChange={(e) => setNumDisp("bathrooms", e.target.value)} onBlur={() => commitNum("bathrooms", (s) => parseInt(s, 10), 1, (n) => setField("bathrooms", n))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hướng</label>
                  <select className="w-full px-4 py-2 border rounded-lg" value={form.direction} onChange={(e) => setField("direction", e.target.value as DirectionType)}>
                    <option value="dong">Đông</option>
                    <option value="tay">Tây</option>
                    <option value="nam">Nam</option>
                    <option value="bac">Bắc</option>
                    <option value="dong-bac">Đông Bắc</option>
                    <option value="dong-nam">Đông Nam</option>
                    <option value="tay-bac">Tây Bắc</option>
                    <option value="tay-nam">Tây Nam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pháp lý</label>
                  <select className="w-full px-4 py-2 border rounded-lg" value={form.legalStatus} onChange={(e) => setField("legalStatus", e.target.value as LegalStatusType)}>
                    <option value="co-so-hong">Có sổ hồng</option>
                    <option value="dang-ky">Đang đăng ký</option>
                    <option value="chua-dang-ky">Chưa đăng ký</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Tiện ích & chi phí (bao gồm giá thuê) */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Tiện ích & chi phí</h3>
              
              {/* Mục bao gồm trong tiền thuê - đặt trước */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Mục bao gồm trong tiền thuê</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {[
                    { key: "electricity", label: "Điện" },
                    { key: "water", label: "Nước" },
                    { key: "internet", label: "Internet" },
                    { key: "garbage", label: "Rác" },
                    { key: "cleaning", label: "Vệ sinh" },
                    { key: "parkingMotorbike", label: "Giữ xe máy" },
                    { key: "parkingCar", label: "Giữ ô tô" },
                    { key: "managementFee", label: "Phí quản lý" },
                  ].map((it) => (
                    <label key={it.key} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(form.utilities?.includedInRent?.[it.key as keyof typeof form.utilities.includedInRent])}
                        onChange={(e) => handleIncludedChange(it.key as keyof NonNullable<CreateRoomPayload["utilities"]>["includedInRent"], e.target.checked)}
                      />
                      {it.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá thuê (đ/tháng) *</label>
                  <input type="number" min={0} className="w-full px-4 py-2 border rounded-lg" value={nums.price} onChange={(e) => setNumDisp("price", e.target.value)} onBlur={() => commitNum("price", (s) => parseInt(s, 10), 0, (n) => setField("price", n))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiền cọc (đ)</label>
                  <input type="number" min={0} className="w-full px-4 py-2 border rounded-lg" value={nums.deposit} onChange={(e) => setNumDisp("deposit", e.target.value)} onBlur={() => commitNum("deposit", (s) => parseInt(s, 10), 0, (n) => setField("deposit", n))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Điện (đ/kWh)</label>
                  <input 
                    type="number" 
                    min={0} 
                    className={`w-full px-4 py-2 border rounded-lg ${Boolean(form.utilities?.includedInRent?.electricity) ? 'bg-gray-100 text-gray-500' : ''}`}
                    value={nums.electricityPricePerKwh} 
                    onChange={(e) => setNumDisp("electricityPricePerKwh", e.target.value)} 
                    onBlur={() => commitNum("electricityPricePerKwh", (s) => parseInt(s, 10), 0, (n) => setForm((p) => ({ ...p, utilities: { ...(p.utilities || {}), electricityPricePerKwh: n } })))} 
                    disabled={Boolean(form.utilities?.includedInRent?.electricity)}
                    placeholder={Boolean(form.utilities?.includedInRent?.electricity) ? "Miễn phí" : undefined}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nước (đ/đơn vị)</label>
                    <input 
                      type="number" 
                      min={0} 
                      className={`w-full px-4 py-2 border rounded-lg ${Boolean(form.utilities?.includedInRent?.water) ? 'bg-gray-100 text-gray-500' : ''}`}
                      value={nums.waterPrice} 
                      onChange={(e) => setNumDisp("waterPrice", e.target.value)} 
                      onBlur={() => commitNum("waterPrice", (s) => parseInt(s, 10), 0, (n) => setForm((p) => ({ ...p, utilities: { ...(p.utilities || {}), waterPrice: n } })))} 
                      disabled={Boolean(form.utilities?.includedInRent?.water)}
                      placeholder={Boolean(form.utilities?.includedInRent?.water) ? "Miễn phí" : undefined}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cách tính nước</label>
                    <select 
                      className="w-full px-4 py-2 border rounded-lg" 
                      value={form.utilities?.waterBillingType || "per_person"} 
                      onChange={(e) => setForm((p) => ({ ...p, utilities: { ...(p.utilities || {}), waterBillingType: e.target.value as any } }))}
                    >
                      <option value="per_m3">Theo m³</option>
                      <option value="per_person">Theo đầu người</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Internet (đ)</label>
                  <input 
                    type="number" 
                    min={0} 
                    className={`w-full px-4 py-2 border rounded-lg ${Boolean(form.utilities?.includedInRent?.internet) ? 'bg-gray-100 text-gray-500' : ''}`}
                    value={nums.internetFee} 
                    onChange={(e) => setNumDisp("internetFee", e.target.value)} 
                    onBlur={() => commitNum("internetFee", (s) => parseInt(s, 10), 0, (n) => setForm((p) => ({ ...p, utilities: { ...(p.utilities || {}), internetFee: n } })))} 
                    disabled={Boolean(form.utilities?.includedInRent?.internet)}
                    placeholder={Boolean(form.utilities?.includedInRent?.internet) ? "Miễn phí" : undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rác (đ)</label>
                  <input 
                    type="number" 
                    min={0} 
                    className={`w-full px-4 py-2 border rounded-lg ${Boolean(form.utilities?.includedInRent?.garbage) ? 'bg-gray-100 text-gray-500' : ''}`}
                    value={nums.garbageFee} 
                    onChange={(e) => setNumDisp("garbageFee", e.target.value)} 
                    onBlur={() => commitNum("garbageFee", (s) => parseInt(s, 10), 0, (n) => setForm((p) => ({ ...p, utilities: { ...(p.utilities || {}), garbageFee: n } })))} 
                    disabled={Boolean(form.utilities?.includedInRent?.garbage)}
                    placeholder={Boolean(form.utilities?.includedInRent?.garbage) ? "Miễn phí" : undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vệ sinh (đ)</label>
                  <input 
                    type="number" 
                    min={0} 
                    className={`w-full px-4 py-2 border rounded-lg ${Boolean(form.utilities?.includedInRent?.cleaning) ? 'bg-gray-100 text-gray-500' : ''}`}
                    value={nums.cleaningFee} 
                    onChange={(e) => setNumDisp("cleaningFee", e.target.value)} 
                    onBlur={() => commitNum("cleaningFee", (s) => parseInt(s, 10), 0, (n) => setForm((p) => ({ ...p, utilities: { ...(p.utilities || {}), cleaningFee: n } })))} 
                    disabled={Boolean(form.utilities?.includedInRent?.cleaning)}
                    placeholder={Boolean(form.utilities?.includedInRent?.cleaning) ? "Miễn phí" : undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quản lý (đ)</label>
                  <input 
                    type="number" 
                    min={0} 
                    className={`w-full px-4 py-2 border rounded-lg ${Boolean(form.utilities?.includedInRent?.managementFee) ? 'bg-gray-100 text-gray-500' : ''}`}
                    value={nums.managementFee} 
                    onChange={(e) => setNumDisp("managementFee", e.target.value)} 
                    onBlur={() => commitNum("managementFee", (s) => parseInt(s, 10), 0, (n) => setForm((p) => ({ ...p, utilities: { ...(p.utilities || {}), managementFee: n } })))} 
                    disabled={Boolean(form.utilities?.includedInRent?.managementFee)}
                    placeholder={Boolean(form.utilities?.includedInRent?.managementFee) ? "Miễn phí" : undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phí quản lý theo</label>
                  <select 
                    className="w-full px-4 py-2 border rounded-lg" 
                    value={form.utilities?.managementFeeUnit || "per_month"} 
                    onChange={(e) => setForm((p) => ({ ...p, utilities: { ...(p.utilities || {}), managementFeeUnit: e.target.value as any } }))}
                  >
                    <option value="per_month">Theo tháng</option>
                    <option value="per_m2_per_month">Theo m²/tháng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giữ xe ô tô (đ)</label>
                  <input 
                    type="number" 
                    min={0} 
                    className={`w-full px-4 py-2 border rounded-lg ${Boolean(form.utilities?.includedInRent?.parkingCar) ? 'bg-gray-100 text-gray-500' : ''}`}
                    value={nums.parkingCarFee} 
                    onChange={(e) => setNumDisp("parkingCarFee", e.target.value)} 
                    onBlur={() => commitNum("parkingCarFee", (s) => parseInt(s, 10), 0, (n) => setForm((p) => ({ ...p, utilities: { ...(p.utilities || {}), parkingCarFee: n } })))} 
                    disabled={Boolean(form.utilities?.includedInRent?.parkingCar)}
                    placeholder={Boolean(form.utilities?.includedInRent?.parkingCar) ? "Miễn phí" : undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giữ xe máy (đ)</label>
                  <input 
                    type="number" 
                    min={0} 
                    className={`w-full px-4 py-2 border rounded-lg ${Boolean(form.utilities?.includedInRent?.parkingMotorbike) ? 'bg-gray-100 text-gray-500' : ''}`}
                    value={nums.parkingMotorbikeFee || ""} 
                    onChange={(e) => setNumDisp("parkingMotorbikeFee", e.target.value)} 
                    onBlur={() => commitNum("parkingMotorbikeFee", (s) => parseInt(s, 10), 0, (n) => setForm((p) => ({ ...p, utilities: { ...(p.utilities || {}), parkingMotorbikeFee: n } })))} 
                    disabled={Boolean(form.utilities?.includedInRent?.parkingMotorbike)}
                    placeholder={Boolean(form.utilities?.includedInRent?.parkingMotorbike) ? "Miễn phí" : undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cây xanh (đ)</label>
                  <input 
                    type="number" 
                    min={0} 
                    className="w-full px-4 py-2 border rounded-lg" 
                    value={nums.gardeningFee} 
                    onChange={(e) => setNumDisp("gardeningFee", e.target.value)} 
                    onBlur={() => commitNum("gardeningFee", (s) => parseInt(s, 10), 0, (n) => setForm((p) => ({ ...p, utilities: { ...(p.utilities || {}), gardeningFee: n } })))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gas nấu ăn (đ)</label>
                  <input 
                    type="number" 
                    min={0} 
                    className="w-full px-4 py-2 border rounded-lg" 
                    value={nums.cookingGasFee || ""} 
                    onChange={(e) => setNumDisp("cookingGasFee", e.target.value)} 
                    onBlur={() => commitNum("cookingGasFee", (s) => parseInt(s, 10), 0, (n) => setForm((p) => ({ ...p, utilities: { ...(p.utilities || {}), cookingGasFee: n } })))} 
                  />
                </div>
              </div>
            </section>

            {/* Ở ghép */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Ở ghép</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cho phép ở ghép</label>
                  <select className="w-full px-4 py-2 border rounded-lg" value={form.canShare ? "true" : "false"} onChange={(e) => setField("canShare", e.target.value === "true")}>
                    <option value="false">Không</option>
                    <option value="true">Có</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số người tối đa</label>
                  <input type="number" min={1} className="w-full px-4 py-2 border rounded-lg" value={nums.maxOccupancy} onChange={(e) => setNumDisp("maxOccupancy", e.target.value)} onBlur={() => commitNum("maxOccupancy", (s) => parseInt(s, 10), 1, (n) => setField("maxOccupancy", n))} />
                </div>

                {form.canShare && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Giá mỗi người (đ)</label>
                      <input type="number" min={0} className="w-full px-4 py-2 border rounded-lg" value={nums.sharePrice} onChange={(e) => setNumDisp("sharePrice", e.target.value)} onBlur={() => commitNum("sharePrice", (s) => parseInt(s, 10), 0, (n) => setField("sharePrice", n))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cách chia sẻ</label>
                      <select className="w-full px-4 py-2 border rounded-lg" value={(form as any).shareMethod || "split_evenly"} onChange={(e) => setForm((p) => ({ ...(p as any), shareMethod: e.target.value }))}>
                        <option value="split_evenly">Chia đều</option>
                        <option value="by_usage">Theo sử dụng</option>
                        <option value="included">Đã bao gồm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ước tính tiện ích/tháng</label>
                      <input type="number" min={0} className="w-full px-4 py-2 border rounded-lg" value={nums.estimatedMonthlyUtilities} onChange={(e) => setNumDisp("estimatedMonthlyUtilities", e.target.value)} onBlur={() => commitNum("estimatedMonthlyUtilities", (s) => parseInt(s, 10), 0, (n) => setForm((p: any) => ({ ...(p as any), estimatedMonthlyUtilities: n })))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mức free tối đa</label>
                      <input type="number" min={0} className="w-full px-4 py-2 border rounded-lg" value={nums.capIncludedAmount} onChange={(e) => setNumDisp("capIncludedAmount", e.target.value)} onBlur={() => commitNum("capIncludedAmount", (s) => parseInt(s, 10), 0, (n) => setForm((p: any) => ({ ...(p as any), capIncludedAmount: n })))} />
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Địa chỉ: đã đưa lên phần Thông tin chung cư */}

            {/* Thông tin khác */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Thông tin khác</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea rows={4} className="w-full px-4 py-2 border rounded-lg" value={form.description} onChange={(e) => setField("description", e.target.value)} />
              </div>
            </section>

            {/* Hành động */}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onCancel} className="px-5 py-2 border rounded-lg">Hủy</button>
              <button type="submit" disabled={loading || uploading} className="px-5 py-2 rounded-lg bg-teal-600 text-white disabled:opacity-50">{loading || uploading ? "Đang lưu..." : "Lưu phòng"}</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}