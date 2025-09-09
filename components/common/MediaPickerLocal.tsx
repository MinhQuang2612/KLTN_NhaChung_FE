"use client";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

export type LocalMediaItem = {
  id: string;
  file: File;
  previewUrl: string;
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

type Props = {
  pillText?: string; // "Hình ảnh hợp lệ" / "Video hợp lệ"
  helper?: string; // "BẮT BUỘC ĐĂNG 03–12 HÌNH"
  accept?: string; // "image/*" | "video/*"
  max?: number; // 12 ảnh, 2 video...
  value: LocalMediaItem[];
  onChange: (items: LocalMediaItem[]) => void;
  guideTitle?: string; // tiêu đề modal
  guideItems?: string[]; // bullet modal
  className?: string;
  // Mở rộng: hiển thị phần nội dung bổ sung trên cùng khung (ví dụ ảnh hiện có)
  extraTop?: React.ReactNode;
  // Ảnh bìa: cho phép đặt bìa cho item local
  coverLocalId?: string;
  onSetCoverLocal?: (localId: string) => void;
};

export default function MediaPickerPanel({
  pillText = "Hình ảnh hợp lệ",
  helper = "Kéo-thả hoặc bấm để chọn",
  accept = "image/*",
  max = 12,
  value,
  onChange,
  guideTitle,
  guideItems,
  className = "",
  extraTop,
  coverLocalId,
  onSetCoverLocal,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const canAdd = value.length < max;

  // thu hồi preview url khi unmount/remove
  useEffect(() => {
    return () => value.forEach((v) => URL.revokeObjectURL(v.previewUrl));
  }, [value]);

  const pickFiles = useCallback(
    (filesLike: FileList | File[]) => {
      const files = Array.from(filesLike || []);
      if (!files.length) return;
      const slots = Math.max(0, max - value.length);
      if (!slots) return;
      const picked = files.slice(0, slots).map((f) => ({
        id: uid(),
        file: f,
        previewUrl: URL.createObjectURL(f),
      }));
      onChange([...value, ...picked]);
    },
    [max, onChange, value]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) pickFiles(e.target.files);
    e.target.value = ""; // cho phép chọn lại cùng file
  };

  // drag-drop (thêm)
  const onDragOver = (e: React.DragEvent) => {
    if (!canAdd) return;
    e.preventDefault();
    panelRef.current?.classList.add("ring-2", "ring-orange-300");
  };
  const onDragLeave = () => {
    panelRef.current?.classList.remove("ring-2", "ring-orange-300");
  };
  const onDrop = (e: React.DragEvent) => {
    if (!canAdd) return;
    e.preventDefault();
    onDragLeave();
    const dt = e.dataTransfer;
    if (dt?.files?.length) pickFiles(dt.files);
  };

  // drag-drop reorder
  const dragIdx = useRef<number | null>(null);
  const onDragStart = (i: number) => (e: React.DragEvent) => {
    dragIdx.current = i;
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOverItem = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDropItem = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIdx.current;
    dragIdx.current = null;
    if (from === null || from === i) return;
    const items = [...value];
    const [moved] = items.splice(from, 1);
    items.splice(i, 0, moved);
    onChange(items);
  };

  const removeAt = (i: number) => {
    const items = [...value];
    const [rm] = items.splice(i, 1);
    URL.revokeObjectURL(rm.previewUrl);
    onChange(items);
  };

  const countText = useMemo(
    () =>
      `Đã chọn ${value.length}/${max} ${
        accept.includes("video") ? "media" : "ảnh"
      }`,
    [accept, max, value.length]
  );

  const [showGuide, setShowGuide] = React.useState(false);
  const isVideo = (f: File) => f.type.startsWith("video");

  return (
    <div className={className}>
      <div
        ref={panelRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="relative rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/40 p-4"
      >
        {/* Nội dung bổ sung đặt bên trên (ví dụ: grid ảnh đã có) */}
        {extraTop}
        {/* Pill mở modal hướng dẫn */}
        {(guideTitle || pillText) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowGuide(true);
            }}
            className="absolute -top-3 left-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[12px] font-medium text-sky-600 ring-1 ring-sky-200"
          >
            <span className="inline-block h-3 w-3 rounded-full bg-sky-500" />
            {pillText}
          </button>
        )}

        {/* nút chọn */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full min-h-48 grid place-items-center text-center text-orange-400"
        >
          <div className="flex flex-col items-center">
            <svg width="52" height="40" viewBox="0 0 24 24" fill="none">
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
            <p className="mt-2 text-[12px] text-gray-500">{helper}</p>
            <p className="mt-1 text-[12px] text-gray-500">{countText}</p>
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={onInputChange}
        />

        {/* Gallery preview 3:4 */}
        {value.length > 0 && (
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-3">
              {value.map((it, idx) => (
                <div
                  key={it.id}
                  className="relative rounded-2xl overflow-hidden border bg-white"
                  draggable
                  onDragStart={onDragStart(idx)}
                  onDragOver={onDragOverItem(idx)}
                  onDrop={onDropItem(idx)}
                >
                  {/* Khung 3:4 */}
                  <div className="relative pb-[133%]">
                    {isVideo(it.file) ? (
                      <video
                        src={it.previewUrl}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={it.previewUrl}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Tag bìa */}
                  {coverLocalId === it.id && (
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[11px] px-1.5 py-0.5 rounded">
                      Ảnh bìa
                    </span>
                  )}

                  {/* Nút xoá: × tròn đỏ góc phải */}
                  <button
                    onClick={() => removeAt(idx)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white grid place-items-center leading-none text-[14px] font-bold shadow hover:bg-red-600"
                    aria-label="Xóa"
                    title="Xóa"
                  >
                    ×
                  </button>

                  {/* Nút đặt làm bìa */}
                  {onSetCoverLocal && coverLocalId !== it.id && (
                    <button
                      type="button"
                      onClick={() => onSetCoverLocal(it.id)}
                      className="absolute bottom-1 right-1 h-6 px-2 rounded-full bg-black/70 text-white text-[11px]"
                      title="Đặt làm ảnh bìa"
                    >
                      Đặt làm bìa
                    </button>
                  )}
                </div>
              ))}

              {/* Ô “+ Thêm” trong grid */}
              {canAdd && (
                <label className="relative pb-[133%] border-2 border-dashed rounded-2xl grid place-items-center text-gray-500 cursor-pointer hover:bg-gray-50">
                  <span className="absolute inset-0 flex items-center justify-center">
                    + Thêm
                  </span>
                  <input
                    hidden
                    type="file"
                    accept={accept}
                    multiple
                    onChange={onInputChange}
                  />
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal hướng dẫn */}
      {showGuide && (
        <RulesModal
          title={guideTitle || pillText}
          items={
            guideItems?.length
              ? guideItems
              : accept.includes("video")
              ? [
                  "Tối đa 2 video, thời lượng ≤ 60s.",
                  "mp4/mov/webm; dung lượng ≤ 100MB.",
                  "Quay rõ, không nội dung nhạy cảm.",
                ]
              : [
                  "Bắt buộc ≥ 3 ảnh, tối đa 12.",
                  "Tỷ lệ 3:4 hoặc 4:3, ảnh rõ, không che logo.",
                  "Không dùng ảnh có bản quyền.",
                ]
          }
          onClose={() => setShowGuide(false)}
        />
      )}
    </div>
  );
}

/** Modal đơn giản dùng chung */
function RulesModal({
  title,
  items,
  onClose,
}: {
  title: string;
  items: string[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
          <div className="px-5 py-3 border-b text-center font-semibold">
            {title}
          </div>
          <div className="p-5 text-sm text-gray-700 leading-6">
            <ul className="list-disc pl-5 space-y-2">
              {items.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
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
