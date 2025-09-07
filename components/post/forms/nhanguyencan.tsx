"use client";
import { useMemo, useState } from "react";
import type { Address, NhaNguyenCanData } from "../PostForm";

const FEATURES = [
  "Hẻm xe hơi",
  "Nhà nở hậu",
  "Nhà tóp hậu",
  "Nhà dính quy hoạch / lộ giới",
  "Nhà chưa hoàn công",
  "Nhà nát",
  "Đất chưa chuyển thổ",
  "Hiện trạng khác",
] as const;

/* Modal địa chỉ (giữ nguyên) */
function AddressModal({
  ...props
}: {
  open: boolean;
  onClose: () => void;
  onSave: (a: Address | null) => void;
  initial?: Partial<Address>;
}) {
  const { open, onClose, onSave, initial } = props;
  const [f, setF] = useState<Address>({
    city: initial?.city || "",
    district: initial?.district || "",
    ward: initial?.ward || "",
    street: initial?.street || "",
    houseNumber: initial?.houseNumber || "",
    showHouseNumber: initial?.showHouseNumber ?? false,
  });
  const set = (k: keyof Address, v: any) => setF((s) => ({ ...s, [k]: v }));
  if (!open) return null;
  const handleSave = () => {
    const empty =
      !f.city && !f.district && !f.ward && !f.street && !f.houseNumber;
    onSave(empty ? null : f);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
          <div className="px-4 py-3 border-b text-center font-semibold">
            Địa chỉ
          </div>
          <div className="p-4 space-y-3">
            {(
              ["city", "district", "ward", "street", "houseNumber"] as const
            ).map((k) => (
              <input
                key={k}
                className="w-full h-11 px-3 rounded-lg border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder={
                  k === "city"
                    ? "Chọn tỉnh, thành phố *"
                    : k === "district"
                    ? "Chọn quận, huyện, thị xã *"
                    : k === "ward"
                    ? "Chọn phường, xã, thị trấn *"
                    : k === "street"
                    ? "Tên đường *"
                    : "Số nhà"
                }
                value={f[k] as string}
                onChange={(e) => set(k, e.target.value)}
              />
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={f.showHouseNumber}
                onChange={(e) => set("showHouseNumber", e.target.checked)}
              />
              Hiển thị số nhà trong tin rao
            </label>
            <button
              onClick={handleSave}
              className="w-full h-11 rounded-xl bg-teal-500 text-white"
            >
              XONG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NhaNguyenCanForm({
  data,
  setData,
}: {
  data: NhaNguyenCanData;
  setData: (next: NhaNguyenCanData) => void;
}) {
  const [addrOpen, setAddrOpen] = useState(false);
  const [err, setErr] = useState<{ dtDat?: string; price?: string }>({});

  const patch =
    <K extends keyof NhaNguyenCanData>(k: K) =>
    (v: NhaNguyenCanData[K]) =>
      setData({ ...data, [k]: v });

  const titleCount = useMemo(
    () => `${data.title.length}/70 kí tự`,
    [data.title]
  );
  const descCount = useMemo(
    () => `${data.desc.length}/1500 kí tự`,
    [data.desc]
  );

  const addrText = data.addr
    ? [
        data.addr.showHouseNumber && data.addr.houseNumber
          ? data.addr.houseNumber
          : "",
        data.addr.street,
        data.addr.ward,
        data.addr.district,
        data.addr.city,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const onBlurReq = (k: "dtDat" | "price", v: string, m: string) =>
    setErr((s) => ({ ...s, [k]: v.trim() ? undefined : m }));

  const toggleFeature = (f: string) => {
    const cur = data.featureSet ?? [];
    const next = cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f];
    patch("featureSet")(next);
  };

  return (
    <div className="space-y-6">
      {/* ĐỊA CHỈ */}
      <div>
        <h3 className="text-[20px] font-semibold mb-3">Địa chỉ</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {[
            ["khuLo", "Tên khu / lô"],
            ["unitCode", "Mã căn"],
          ].map(([k, label]) => (
            <div className="relative" key={k}>
              <input
                className="peer w-full h-12 rounded-lg border border-gray-300 bg-white px-3 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder=" "
                value={(data as any)[k]}
                onChange={(e) => patch(k as any)(e.target.value)}
              />
              <label
                className="pointer-events-none absolute left-3 top-3 text-gray-500 transition-all
                                peer-focus:top-[2px] peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-[2px] peer-[&:not(:placeholder-shown)]:text-xs"
              >
                {label}
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAddrOpen(true)}
          className="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-between"
        >
          <span className={addrText ? "text-gray-900" : "text-gray-400"}>
            {addrText ? (
              addrText
            ) : (
              <>
                Địa chỉ <span className="text-red-500">*</span>
              </>
            )}
          </span>
          <span className="opacity-60">▾</span>
        </button>
      </div>

      {/* THÔNG TIN CHI TIẾT */}
      <div>
        <h3 className="text-[20px] font-semibold mb-3">Thông tin chi tiết</h3>

        {/* Loại hình: 1 cột */}
        <div className="relative mb-3">
          <select
            className={`w-full h-11 px-3 pr-8 rounded-lg border border-gray-300 bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none ${
              data.loaiHinh === "" ? "text-gray-400" : "text-gray-900"
            }`}
            value={data.loaiHinh}
            onChange={(e) => patch("loaiHinh")(e.target.value)}
          >
            <option value="" disabled hidden>
              Loại hình
            </option>
            <option value="nha-pho">Nhà phố</option>
            <option value="biet-thu">Biệt thự</option>
            <option value="nha-hem">Nhà hẻm</option>
            <option value="nha-cap4">Nhà cấp 4</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
            ▾
          </span>
        </div>

        {/* Còn lại: 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["soPhongNgu", "Số phòng ngủ"],
            ["soVeSinh", "Số phòng vệ sinh"],
            ["huong", "Hướng"],
            ["tongSoTang", "Tổng số tầng"],
          ].map(([k, label]) => (
            <div className="relative" key={k}>
              {k === "huong" ? (
                <>
                  <select
                    className={`w-full h-11 px-3 pr-8 rounded-lg border border-gray-300 bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none ${
                      data.huong === "" ? "text-gray-400" : "text-gray-900"
                    }`}
                    value={data.huong}
                    onChange={(e) => patch("huong")(e.target.value)}
                  >
                    <option value="" disabled hidden>
                      Hướng
                    </option>
                    {[
                      "dong",
                      "tay",
                      "nam",
                      "bac",
                      "dong-nam",
                      "dong-bac",
                      "tay-nam",
                      "tay-bac",
                    ].map((h) => (
                      <option key={h} value={h}>
                        {h.replace("-", " ").toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                    ▾
                  </span>
                </>
              ) : (
                <>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="peer w-full h-12 rounded-lg border border-gray-300 bg-white px-3 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder=" "
                    value={(data as any)[k]}
                    onChange={(e) => patch(k as any)(e.target.value)}
                  />
                  <label
                    className="pointer-events-none absolute left-3 top-3 text-gray-500 transition-all
                                    peer-focus:top-[2px] peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-[2px] peer-[&:not(:placeholder-shown)]:text-xs"
                  >
                    {label}
                  </label>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* THÔNG TIN KHÁC */}
      <div>
        <h3 className="text-[20px] font-semibold mb-3">Thông tin khác</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Giấy tờ pháp lý */}
          <div className="relative">
            <select
              className={`w-full h-11 px-3 pr-8 rounded-lg border border-gray-300 bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none ${
                data.tinhTrangSo === "" ? "text-gray-400" : "text-gray-900"
              }`}
              value={data.tinhTrangSo}
              onChange={(e) => patch("tinhTrangSo")(e.target.value)}
            >
              <option value="" disabled hidden>
                Giấy tờ pháp lý
              </option>
              <option value="co-so-hong">Có sổ hồng</option>
              <option value="cho-so">Đang chờ sổ</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              ▾
            </span>
          </div>

          {/* Tình trạng nội thất */}
          <div className="relative">
            <select
              className={`w-full h-11 px-3 pr-8 rounded-lg border border-gray-300 bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none ${
                data.noiThat === "" ? "text-gray-400" : "text-gray-900"
              }`}
              value={data.noiThat}
              onChange={(e) => patch("noiThat")(e.target.value)}
            >
              <option value="" disabled hidden>
                Tình trạng nội thất
              </option>
              <option value="full">Nội thất đầy đủ</option>
              <option value="co-ban">Nội thất cơ bản</option>
              <option value="trong">Nhà trống</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              ▾
            </span>
          </div>
        </div>

        {/* Checklist */}
        <div className="mt-4">
          <div className="text-[13px] text-gray-500 font-semibold mb-2">
            Đặc điểm nhà/đất
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8">
            {FEATURES.map((f, i) => (
              <label
                key={f}
                className={`flex items-center justify-between py-3 border-b border-gray-200 text-[15px] ${
                  i % 2 === 0 ? "md:pr-8" : "md:pl-8"
                }`}
              >
                <span className="truncate">{f}</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 rounded-md border-gray-300"
                  checked={(data.featureSet ?? []).includes(f)} // <-- sửa
                  onChange={() => toggleFeature(f)}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* DIỆN TÍCH & GIÁ */}
      <div>
        <h3 className="text-[20px] font-semibold mb-3">Diện tích & giá</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Đất / Sử dụng */}
          {[
            ["dtDat", "Diện tích đất", "m²", true],
            ["dtSuDung", "Diện tích sử dụng", "m²", false],
            ["ngang", "Chiều ngang", "m", false],
            ["dai", "Chiều dài", "m", false],
          ].map(([k, label, unit, required]) => (
            <div className="relative" key={k as string}>
              <input
                className={`peer w-full h-12 rounded-lg border bg-white px-3 pr-12 placeholder-transparent focus:outline-none focus:ring-2 ${
                  required && err.dtDat
                    ? "border-red-400 ring-red-100"
                    : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
                }`}
                placeholder=" "
                value={(data as any)[k as string]}
                onChange={(e) => patch(k as any)(e.target.value)}
                onBlur={(e) =>
                  required &&
                  onBlurReq(
                    "dtDat",
                    e.target.value,
                    "Vui lòng điền diện tích đất"
                  )
                }
              />
              <label
                className="pointer-events-none absolute left-3 top-3 text-gray-500 transition-all
                                peer-focus:top-[2px] peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-[2px] peer-[&:not(:placeholder-shown)]:text-xs"
              >
                {label}
                {required && <span className="text-red-600"> *</span>}
              </label>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {unit as string}
              </span>
              {required && err.dtDat && (
                <div className="text-[12px] text-red-500 mt-1">{err.dtDat}</div>
              )}
            </div>
          ))}
        </div>

        {/* Giá & cọc */}
        <div className="mt-4">
          <div className="relative mb-3">
            <input
              className={`peer w-full h-12 rounded-lg border bg-white px-3 pr-20 placeholder-transparent focus:outline-none focus:ring-2 ${
                err.price
                  ? "border-red-400 ring-red-100"
                  : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
              }`}
              placeholder=" "
              value={data.price}
              onChange={(e) => patch("price")(e.target.value)}
              onBlur={(e) =>
                onBlurReq("price", e.target.value, "Vui lòng điền giá thuê")
              }
            />
            <label
              className="pointer-events-none absolute left-3 top-3 text-gray-500 transition-all
                              peer-focus:top-[2px] peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-[2px] peer-[&:not(:placeholder-shown)]:text-xs"
            >
              Giá thuê <span className="text-red-600">*</span>
            </label>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              đ/tháng
            </span>
            {err.price && (
              <div className="text-[12px] text-red-500 mt-1">{err.price}</div>
            )}
          </div>

          <div className="relative">
            <input
              className="peer w-full h-12 rounded-lg border border-gray-300 bg-white px-3 pr-10 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder=" "
              value={data.deposit}
              onChange={(e) => patch("deposit")(e.target.value)}
            />
            <label
              className="pointer-events-none absolute left-3 top-3 text-gray-500 transition-all
                              peer-focus:top-[2px] peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-[2px] peer-[&:not(:placeholder-shown)]:text-xs"
            >
              Số tiền cọc
            </label>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              đ
            </span>
          </div>
        </div>
      </div>

      {/* TIÊU ĐỀ & MÔ TẢ */}
      <div>
        <h3 className="text-[20px] font-semibold mb-3">
          Tiêu đề tin đăng và Mô tả chi tiết
        </h3>
        <div className="relative mb-1">
          <input
            className="peer w-full h-12 rounded-lg border border-gray-300 bg-white px-3 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder=" "
            maxLength={70}
            value={data.title}
            onChange={(e) => patch("title")(e.target.value)}
          />
          <label
            className="pointer-events-none absolute left-3 top-3 text-gray-500 transition-all
                            peer-focus:top-[2px] peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-[2px] peer-[&:not(:placeholder-shown)]:text-xs"
          >
            Tiêu đề tin đăng <span className="text-red-600">*</span>
          </label>
        </div>
        <div className="text-xs text-gray-500 mb-3">{titleCount}</div>

        <div className="relative">
          <textarea
            className="peer w-full rounded-lg border border-gray-300 bg-white px-3 pt-5 min-h-[140px] placeholder-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder=" "
            maxLength={1500}
            value={data.desc}
            onChange={(e) => patch("desc")(e.target.value)}
          />
          <label
            className="pointer-events-none absolute left-3 top-3 text-gray-500 transition-all
                            peer-focus:top-[2px] peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-[2px] peer-[&:not(:placeholder-shown)]:text-xs"
          >
            Mô tả chi tiết <span className="text-red-600">*</span>
          </label>
        </div>
        <div className="text-xs text-gray-500 mt-1">{descCount}</div>
      </div>

      <AddressModal
        open={addrOpen}
        onClose={() => setAddrOpen(false)}
        onSave={(a) => setData({ ...data, addr: a })}
        initial={data.addr || undefined}
      />
    </div>
  );
}
