"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import MediaPickerPanel, { LocalMediaItem } from "../common/MediaPickerLocal";
import { uploadFiles } from "@/utils/upload";
import { useAuth } from "@/contexts/AuthContext";
import {
  Address,
  PhongTroData,
  NhaNguyenCanData,
  ChungCuData,
} from "@/types/RentPost";
import { initPhongTro, initChungCu, initNNC } from "@/types/RentPostInit";
import { createRentPost } from "@/services/rentPosts";
/** DANH MỤC */
export type CategoryId = "phong-tro" | "chung-cu" | "nha-nguyen-can";
const CATEGORIES = [
  { id: "phong-tro", label: "Phòng trọ" },
  { id: "chung-cu", label: "Căn hộ/Chung cư" },
  { id: "nha-nguyen-can", label: "Nhà nguyên căn" },
] as const;

/** Lazy load form con */
const PhongTroForm = dynamic(() => import("./forms/phongtro"));
const ChungCuForm = dynamic(() => import("./forms/chungcu"));
const NhaNguyenCanForm = dynamic(() => import("./forms/nhanguyencan"));

// ở trên cùng file
function validateMedia(imagesLen: number, videosLen: number): string | null {
  if (imagesLen < 3) return "Cần tối thiểu 3 ảnh.";
  if (imagesLen > 12) return "Tối đa 12 ảnh.";
  if (videosLen > 2) return "Tối đa 2 video.";
  return null;
}

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
  const [images, setImages] = useState<LocalMediaItem[]>([]);
  const [videos, setVideos] = useState<LocalMediaItem[]>([]);

  // STATE CHO 3 FORM
  const [phongtroData, setPhongtroData] = useState<PhongTroData>(initPhongTro);
  const [chungcuData, setChungcuData] = useState<ChungCuData>(initChungCu);
  const [nncData, setNncData] = useState<NhaNguyenCanData>(initNNC);

  // State submit form
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "" | "success" | "error";
    text: string;
  }>({ type: "", text: "" });

  // Auth context
  const { user } = useAuth();
  const userId = user ? Number(user.userId) : null;
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

  // SUBMIT CHỈ LẤY FORM ĐANG ACTIVE - CẬP NHẬT ĐỂ GỬI ĐÚNG FORMAT CHO API
  const handleSubmit = async () => {
    if (!category) return;

    if (!user) {
      setToast({ type: "error", text: "Bạn cần đăng nhập trước khi đăng tin" });
      setTimeout(() => setToast({ type: "", text: "" }), 3000);
      return;
    }
    // BẮT BUỘC: tối thiểu 3 ảnh, tối đa 12; video tối đa 2
    if (images.length < 3) {
      setToast({ type: "error", text: "Vui lòng chọn tối thiểu 3 ảnh." });
      setTimeout(() => setToast({ type: "", text: "" }), 3000);
      return;
    }
    if (images.length > 12) {
      setToast({ type: "error", text: "Tối đa 12 ảnh." });
      setTimeout(() => setToast({ type: "", text: "" }), 3000);
      return;
    }
    if (videos.length > 2) {
      setToast({ type: "error", text: "Tối đa 2 video." });
      setTimeout(() => setToast({ type: "", text: "" }), 3000);
      return;
    }

    const uid = Number(user.userId);
    setSubmitting(true);
    try {
      // ✅ Upload trực tiếp từ images/videos
      const uploadImageUrls = await uploadFiles(
        images.map((i) => i.file),
        uid,
        "images"
      );
      const uploadVideoUrls = await uploadFiles(
        videos.map((v) => v.file),
        uid,
        "videos"
      );

      const basePayload = {
        userId: uid,
        images: uploadImageUrls,
        videos: uploadVideoUrls,
        status: "active", // chờ duyệt
      };

      let payload: any = {};
      if (category === "phong-tro") {
        if (!phongtroData.addr) throw new Error("Vui lòng chọn địa chỉ");
        payload = {
          ...basePayload,
          title: phongtroData.title,
          description: phongtroData.desc,
          address: phongtroData.addr,
          area: phongtroData.area,
          price: phongtroData.price,
          deposit: phongtroData.deposit,
          furniture: phongtroData.furniture,
        };
      } else if (category === "chung-cu") {
        if (!chungcuData.addr) throw new Error("Vui lòng chọn địa chỉ");
        payload = {
          ...basePayload,
          title: chungcuData.title,
          description: chungcuData.desc,
          address: chungcuData.addr,
          buildingInfo: {
            buildingName: chungcuData.buildingName,
            blockOrTower: chungcuData.blockOrTower,
            floorNumber: chungcuData.floorNumber,
            unitCode: chungcuData.unitCode,
          },
          area: chungcuData.area,
          price: chungcuData.price,
          deposit: chungcuData.deposit,
          furniture: chungcuData.furniture,
          bedrooms: chungcuData.bedrooms,
          bathrooms: chungcuData.bathrooms,
          direction: chungcuData.direction,
          propertyType: chungcuData.propertyType,
          legalStatus: chungcuData.legalStatus,
        };
      } else if (category === "nha-nguyen-can") {
        if (!nncData.addr) throw new Error("Vui lòng chọn địa chỉ");
        payload = {
          ...basePayload,
          title: nncData.title,
          description: nncData.desc,
          address: nncData.addr,
          propertyInfo: {
            khuLo: nncData.khuLo,
            unitCode: nncData.unitCode,
            propertyType: nncData.propertyType,
            totalFloors: nncData.totalFloors,
            features: nncData.features,
          },
          landArea: nncData.landArea,
          usableArea: nncData.usableArea,
          width: nncData.width,
          length: nncData.length,
          price: nncData.price,
          deposit: nncData.deposit,
          furniture: nncData.furniture,
          bedrooms: nncData.bedrooms,
          bathrooms: nncData.bathrooms,
          direction: nncData.direction,
          legalStatus: nncData.legalStatus,
        };
      }

      await createRentPost(category, payload);

      setToast({
        type: "success",
        text: "Lưu tin đăng thành công, chờ duyệt!",
      });
      setTimeout(() => setToast({ type: "", text: "" }), 3000);

      // ✅ clear sau khi thành công
      clearOnlyActiveForm();
      clearAllMedia();
    } catch (e: any) {
      setToast({
        type: "error",
        text: e?.message || "Có lỗi xảy ra khi tạo bài đăng",
      });
      setTimeout(() => setToast({ type: "", text: "" }), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // CLEAR chỉ form đang active
  const handleClear = () => {
    if (category === "phong-tro") setPhongtroData(initPhongTro);
    if (category === "chung-cu") setChungcuData(initChungCu);
    if (category === "nha-nguyen-can") setNncData(initNNC);
    setImages([]);
    setVideos([]);
  };
  const clearOnlyActiveForm = () => {
    if (category === "phong-tro") setPhongtroData(initPhongTro);
    if (category === "chung-cu") setChungcuData(initChungCu);
    if (category === "nha-nguyen-can") setNncData(initNNC);
  };

  const clearAllMedia = () => {
    setImages([]);
    setVideos([]);
  };

  // tiện ích hiện toast 3s
  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: "", text: "" }), 3000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-6">
      {toast.type && (
        <div
          className={`fixed top-10 right-4 z-[100] rounded-lg px-4 py-3 shadow ${
            toast.type === "success" ? "bg-amber-400" : "bg-rose-600"
          } text-white`}
        >
          {toast.text}
        </div>
      )}

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
            <MediaPickerPanel
              pillText="Hình ảnh hợp lệ"
              helper="BẮT BUỘC ĐĂNG TỪ 03 ĐẾN 12 HÌNH"
              accept="image/*"
              max={12}
              value={images}
              onChange={setImages}
              guideTitle="Hình ảnh hợp lệ – Yêu cầu"
              guideItems={[
                "Tối thiểu 3 ảnh, tối đa 12 ảnh.",
                "Ưu tiên chụp thật, rõ nét, nội dung đúng sản phẩm.",
                "Không mờ/nhòe, không dán số điện thoại to trên ảnh.",
              ]}
            />

            <MediaPickerPanel
              pillText="Video hợp lệ"
              helper="Đăng video để bán nhanh hơn"
              accept="video/*"
              max={2}
              value={videos}
              onChange={setVideos}
              guideTitle="Video hợp lệ – Yêu cầu"
              guideItems={[
                "Tối đa 2 video, ≤ 60s/video.",
                "mp4/mov/webm; dung lượng ≤ 100MB.",
                "Góc quay sáng, rõ ràng, không nội dung nhạy cảm.",
              ]}
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
                  disabled={submitting}
                >
                  Clear form này
                </button>
                <button
                  onClick={handleSubmit}
                  className="h-11 px-5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Đang đăng..." : "Đăng tin"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
