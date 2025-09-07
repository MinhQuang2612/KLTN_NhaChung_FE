"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

/** DANH MỤC */
export type CategoryId = "phong-tro" | "chung-cu" | "nha-nguyen-can";
const CATEGORIES = [
  { id: "phong-tro", label: "Phòng trọ" },
  { id: "chung-cu", label: "Căn hộ/Chung cư" },
  { id: "nha-nguyen-can", label: "Nhà nguyên căn" },
] as const;

/** Kiểu dữ liệu form */
export type Address = {
  city: string;
  district: string;
  ward: string;
  street: string;
  houseNumber: string;
  showHouseNumber: boolean;
};

export type PhongTroData = {
  addr: Address | null;
  noiThat: "" | "full" | "co-ban" | "trong";
  area: string;
  price: string;
  deposit: string;
  title: string;
  desc: string;
};

export type ChungCuData = {
  // tạm tối thiểu; sau refactor form chung cư dùng data này
  buildingName: string;
  addr: Address | null;
  blockOrTower: string;
  floorNumber: string;
  unitCode: string;
  loaiHinh: string;
  soPhongNgu: string;
  soVeSinh: string;
  huong: string;
  noiThat: string;
  tinhTrangSo: string;
  area: string;
  price: string;
  deposit: string;
  title: string;
  desc: string;
};

export type NhaNguyenCanData = {
  // tạm tối thiểu; sau refactor form nhà nguyên căn dùng data này
  addr: Address | null;
  khuLo: string;
  unitCode: string;
  loaiHinh: string;
  soPhongNgu: string;
  soVeSinh: string;
  huong: string;
  tongSoTang: string;
  noiThat: string;
  tinhTrangSo: string;
  dtDat: string;
  dtSuDung: string;
  ngang: string;
  dai: string;
  price: string;
  deposit: string;
  title: string;
  desc: string;
  featureSet: string[];
};

/** init */
const initPhongTro: PhongTroData = {
  addr: null,
  noiThat: "",
  area: "",
  price: "",
  deposit: "",
  title: "",
  desc: "",
};
const initChungCu: ChungCuData = {
  buildingName: "",
  addr: null,
  blockOrTower: "",
  floorNumber: "",
  unitCode: "",
  loaiHinh: "",
  soPhongNgu: "",
  soVeSinh: "",
  huong: "",
  noiThat: "",
  tinhTrangSo: "",
  area: "",
  price: "",
  deposit: "",
  title: "",
  desc: "",
};
const initNNC: NhaNguyenCanData = {
  addr: null,
  khuLo: "",
  unitCode: "",
  loaiHinh: "",
  soPhongNgu: "",
  soVeSinh: "",
  huong: "",
  tongSoTang: "",
  noiThat: "",
  tinhTrangSo: "",
  dtDat: "",
  dtSuDung: "",
  ngang: "",
  dai: "",
  price: "",
  deposit: "",
  title: "",
  desc: "",
  featureSet: [],
};

/** Lazy load form con */
const PhongTroForm = dynamic(() => import("./forms/phongtro")); // nhận {data,setData}
const ChungCuForm = dynamic(() => import("./forms/chungcu")); // TODO chuyển dần sang {data,setData}
const NhaNguyenCanForm = dynamic(() => import("./forms/nhanguyencan"));

/* Modal chọn danh mục */
function CategoryModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (c: CategoryId) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl">
          <div className="px-5 py-3 border-b text-center font-semibold">
            Chọn danh mục
          </div>
          <div className="p-4 space-y-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id as CategoryId)}
                className="w-full flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-gray-50"
              >
                <span className="font-medium">{c.label}</span>
                <span>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Modal Quy định */
function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl">
          <div className="px-5 py-3 border-b text-center font-semibold">
            Quy định
          </div>
          <div className="p-5 text-sm text-gray-700 leading-6">
            Nội dung quy định sẽ bổ sung sau.
          </div>
          <div className="px-5 pb-4">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-lg bg-teal-500 text-white w-full"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostForm() {
  const [category, setCategory] = useState<CategoryId | "">("");
  const [showCateModal, setShowCateModal] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // upload
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const [imgCount, setImgCount] = useState(0);
  const [vidName, setVidName] = useState("");

  // STATE CHO 3 FORM
  const [phongtroData, setPhongtroData] = useState<PhongTroData>(initPhongTro);
  const [chungcuData, setChungcuData] = useState<ChungCuData>(initChungCu);
  const [nncData, setNncData] = useState<NhaNguyenCanData>(initNNC);

  // khởi tạo category
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const fromUrl = p.get("category") as CategoryId | null;
    const saved = localStorage.getItem("post_category") as CategoryId | null;
    const ids = CATEGORIES.map((c) => c.id);
    const initial =
      fromUrl && ids.includes(fromUrl)
        ? fromUrl
        : saved && ids.includes(saved)
        ? saved
        : "";
    setCategory(initial);
    setShowCateModal(!initial);
  }, []);
  useEffect(() => {
    if (!category) return;
    localStorage.setItem("post_category", category);
    const url = new URL(location.href);
    url.searchParams.set("category", category);
    history.replaceState({}, "", url.toString());
  }, [category]);

  // CHỌN FORM & PROPS
  const ActiveForm = useMemo(() => {
    switch (category) {
      case "phong-tro":
        return PhongTroForm as any;
      case "chung-cu":
        return ChungCuForm as any;
      case "nha-nguyen-can":
        return NhaNguyenCanForm as any;
      default:
        return null;
    }
  }, [category]);

  const activeProps = useMemo(() => {
    switch (category) {
      case "phong-tro":
        return { data: phongtroData, setData: setPhongtroData };
      case "chung-cu":
        return { data: chungcuData, setData: setChungcuData };
      case "nha-nguyen-can":
        return { data: nncData, setData: setNncData };
      default:
        return {};
    }
  }, [category, phongtroData, chungcuData, nncData]);

  // SUBMIT CHỈ LẤY FORM ĐANG ACTIVE
  const handleSubmit = () => {
    let payload: any = {};
    if (category === "phong-tro") payload = { category, ...phongtroData };
    if (category === "chung-cu") payload = { category, ...chungcuData };
    if (category === "nha-nguyen-can") payload = { category, ...nncData };
    // TODO: call API
    console.log("SUBMIT", payload);
    alert("Submit: " + category);
  };

  // CLEAR chỉ form đang active
  const handleClear = () => {
    if (category === "phong-tro") setPhongtroData(initPhongTro);
    if (category === "chung-cu") setChungcuData(initChungCu);
    if (category === "nha-nguyen-can") setNncData(initNNC);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-6">
      <CategoryModal
        open={showCateModal}
        onClose={() => setShowCateModal(false)}
        onSelect={(c) => {
          setCategory(c);
          setShowCateModal(false);
        }}
      />
      <RulesModal open={showRules} onClose={() => setShowRules(false)} />

      {/* Hình ảnh + Form */}
      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-semibold">
            Hình ảnh và Video sản phẩm
          </h2>
          <button
            onClick={() => setShowRules(true)}
            className="text-[13px] text-sky-600 hover:underline"
          >
            Quy định đăng tin
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* LEFT: Upload */}
          <aside className="md:col-span-5 space-y-4">
            <button
              onClick={() => imgRef.current?.click()}
              className="relative w-full rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/40 p-4 text-left"
            >
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRules(true);
                }}
                className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[12px] font-medium text-sky-600 ring-1 ring-sky-200 cursor-pointer"
              >
                <span className="inline-block h-3 w-3 rounded-full bg-sky-500" />{" "}
                Hình ảnh hợp lệ
              </span>
              <div className="h-48 grid place-items-center text-center text-orange-400">
                <svg
                  width="52"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mx-auto"
                >
                  <path
                    d="M9 7l1.2-2h3.6L15 7h3a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h3z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <circle
                    cx="12"
                    cy="13"
                    r="3.2"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
                <p className="mt-3 text-[12px] text-gray-600">
                  {imgCount > 0
                    ? `Đã chọn ${imgCount} hình`
                    : "ĐĂNG TỪ 03 ĐẾN 12 HÌNH"}
                </p>
              </div>
            </button>
            <input
              ref={imgRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => setImgCount(e.target.files?.length ?? 0)}
            />

            <button
              onClick={() => vidRef.current?.click()}
              className="relative w-full rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-4 text-left"
            >
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRules(true);
                }}
                className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[12px] font-medium text-sky-600 ring-1 ring-sky-200 cursor-pointer"
              >
                Bán nhanh hơn với{" "}
                <span className="text-sky-600">Chợ Tốt Video</span>
              </span>
              <div className="h-48 grid place-items-center text-center">
                <p className="font-semibold">Đăng video để bán nhanh hơn</p>
                <p className="mt-1 text-[13px]">
                  🔥 Lượt xem tăng đến <b>x2</b>
                </p>
                {vidName && (
                  <p className="mt-2 text-[12px] text-gray-600 truncate w-56">
                    {vidName}
                  </p>
                )}
              </div>
            </button>
            <input
              ref={vidRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setVidName(e.target.files?.[0]?.name ?? "")}
            />
          </aside>

          {/* RIGHT: Danh mục + Form con */}
          <section className="md:col-span-7">
            <div className="mb-5">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Danh mục Tin Đăng *
              </div>
              <button
                type="button"
                onClick={() => setShowCateModal(true)}
                className="w-full h-11 px-3 rounded-lg border border-gray-300 text-left bg-white hover:bg-gray-50"
              >
                {category
                  ? CATEGORIES.find((c) => c.id === category)?.label
                  : "Chọn danh mục"}
                <span className="float-right opacity-60">▾</span>
              </button>
            </div>

            {ActiveForm ? (
              // tạm dùng any để không vỡ TS khi 2 form kia chưa refactor
              <ActiveForm {...(activeProps as any)} />
            ) : (
              <div className="text-gray-500 text-center py-16 border rounded-2xl">
                Chọn danh mục để bắt đầu.
              </div>
            )}

            {/* NÚT Clear + Đăng tin (nằm ở parent) */}
            {category && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={handleClear}
                  className="h-11 px-4 rounded-xl border border-gray-300 hover:bg-gray-50"
                >
                  Clear form này
                </button>
                <button
                  onClick={handleSubmit}
                  className="h-11 px-5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600"
                >
                  Đăng tin
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
