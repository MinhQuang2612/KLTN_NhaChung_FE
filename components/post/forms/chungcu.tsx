"use client";
import { useMemo, useState } from "react";
import type { Address, ChungCuData } from "../PostForm";

/* Modal địa chỉ (giữ nguyên) */
function AddressModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (a: Address | null) => void;
  initial?: Partial<Address>;
}) {
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

export default function ChungCuForm({
  data,
  setData,
}: {
  data: ChungCuData;
  setData: (next: ChungCuData) => void;
}) {
  const [addrOpen, setAddrOpen] = useState(false);
  const [err, setErr] = useState<{ area?: string; price?: string }>({});

  const patch =
    <K extends keyof ChungCuData>(k: K) =>
    (v: ChungCuData[K]) =>
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

  const onBlurRequired = (k: "area" | "price", v: string, m: string) =>
    setErr((s) => ({ ...s, [k]: v.trim() ? undefined : m }));

  return (
    <div className="space-y-6">
      {/* ĐỊA CHỈ */}
      <div>
        <h3 className="text-[20px] font-semibold mb-3">Địa chỉ</h3>

        <div className="relative mb-3">
          <input
            className="peer w-full h-12 rounded-lg border border-gray-300 bg-white px-3 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder=" "
            value={data.buildingName}
            onChange={(e) => patch("buildingName")(e.target.value)}
          />
          <label
            className="pointer-events-none absolute left-3 top-3 text-gray-500 transition-all
                            peer-focus:top-[2px] peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-[2px] peer-[&:not(:placeholder-shown)]:text-xs"
          >
            Tên toà nhà / Dự án (sẽ có gợi ý)
          </label>
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

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ["blockOrTower", "Block / Tháp"],
            ["floorNumber", "Tầng số"],
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
      </div>

      {/* THÔNG TIN CHI TIẾT */}
      <div>
        <h3 className="text-[20px] font-semibold mb-3">Thông tin chi tiết</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Loại hình */}
          <div className="relative">
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
              <option value="chung-cu">Chung cư</option>
              <option value="can-ho-dv">Căn hộ dịch vụ</option>
              <option value="officetel">Officetel</option>
              <option value="studio">Studio</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              ▾
            </span>
          </div>

          {/* Số PN / VS */}
          {[
            ["soPhongNgu", "Số phòng ngủ"],
            ["soVeSinh", "Số phòng vệ sinh"],
          ].map(([k, label]) => (
            <div className="relative" key={k}>
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
            </div>
          ))}

          {/* Hướng */}
          <div className="relative">
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
          </div>
        </div>
      </div>

      {/* THÔNG TIN KHÁC */}
      <div>
        <h3 className="text-[20px] font-semibold mb-3">Thông tin khác</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nội thất */}
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
          {/* Tình trạng sổ */}
          <div className="relative">
            <select
              className={`w-full h-11 px-3 pr-8 rounded-lg border border-gray-300 bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none ${
                data.tinhTrangSo === "" ? "text-gray-400" : "text-gray-900"
              }`}
              value={data.tinhTrangSo}
              onChange={(e) => patch("tinhTrangSo")(e.target.value)}
            >
              <option value="" disabled hidden>
                Tình trạng sổ
              </option>
              <option value="co-so-hong">Có sổ hồng</option>
              <option value="cho-so">Đang chờ sổ</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              ▾
            </span>
          </div>
        </div>
      </div>

      {/* DIỆN TÍCH & GIÁ */}
      <div>
        <h3 className="text-[20px] font-semibold mb-3">Diện tích & giá</h3>

        <div className="relative mb-3">
          <input
            className={`peer w-full h-12 rounded-lg border bg-white px-3 pr-12 placeholder-transparent focus:outline-none focus:ring-2 ${
              err.area
                ? "border-red-400 ring-red-100"
                : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
            }`}
            placeholder=" "
            value={data.area}
            onChange={(e) => patch("area")(e.target.value)}
            onBlur={(e) =>
              onBlurRequired("area", e.target.value, "Vui lòng điền diện tích")
            }
          />
          <label
            className="pointer-events-none absolute left-3 top-3 text-gray-500 transition-all
                            peer-focus:top-[2px] peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-[2px] peer-[&:not(:placeholder-shown)]:text-xs"
          >
            Diện tích <span className="text-red-600">*</span>
          </label>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            m²
          </span>
          {err.area && (
            <div className="text-[12px] text-red-500 mt-1">{err.area}</div>
          )}
        </div>

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
              onBlurRequired("price", e.target.value, "Vui lòng điền giá thuê")
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

      {/* Modal địa chỉ */}
      <AddressModal
        open={addrOpen}
        onClose={() => setAddrOpen(false)}
        onSave={(a) => setData({ ...data, addr: a })}
        initial={data.addr || undefined}
      />
    </div>
  );
}
