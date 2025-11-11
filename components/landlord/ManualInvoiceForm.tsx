"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createManualInvoice, CreateManualInvoicePayload } from "@/services/landlordInvoices";
import { useToast } from "@/contexts/ToastContext";
import { extractApiErrorMessage } from "@/utils/api";
import { getLandlordContracts, getLandlordContractById, LandlordContractSummary } from "@/services/rentalRequests";
import { getRoomById } from "@/services/rooms";

interface OtherItemInput {
  description: string;
  amount: string;
  type: string;
}

export default function ManualInvoiceForm() {
  const { showSuccess, showError } = useToast();
  const searchParams = useSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [contracts, setContracts] = useState<LandlordContractSummary[]>([]);
  const [roomIdToCategory, setRoomIdToCategory] = useState<Record<number, string>>({});
  const [validatingContract, setValidatingContract] = useState(false);
  const [validatedContract, setValidatedContract] = useState<any>(null);
  const [contractLocked, setContractLocked] = useState(false);

  const [form, setForm] = useState({
    contractId: "",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    dueDate: "",
    electricityStart: "",
    electricityEnd: "",
    waterStart: "",
    waterEnd: "",
    includeRent: true,
    note: "",
  });
  

  const [otherItems, setOtherItems] = useState<OtherItemInput[]>([]);

  useEffect(() => {
    // Tải hợp đồng khi mở trang để sẵn dropdown
    loadContracts();
  }, []);

  // Prefill contractId nếu có trên URL (?contractId=...)
  useEffect(() => {
    const id = searchParams?.get("contractId");
    if (id) {
      setForm((p) => ({ ...p, contractId: id }));
      setContractLocked(true);
    }
  }, [searchParams]);

  // Gợi ý hạn thanh toán: mặc định là cuối tháng hiện tại nếu chưa chọn
  useEffect(() => {
    if (!form.dueDate) {
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const iso = lastDay.toISOString().slice(0, 10);
      setForm((p) => ({ ...p, dueDate: iso }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadContracts = async () => {
    try {
      setLoadingContracts(true);
      const data = await getLandlordContracts();
      const list = Array.isArray(data) ? data : [];
      setContracts(list);

      // Nạp category phòng để hiển thị trong option
      const uniqueRoomIds = Array.from(new Set(list.map((c) => c.roomId).filter(Boolean)));
      const catMap: Record<number, string> = {};
      await Promise.all(uniqueRoomIds.map(async (rid) => {
        try {
          const room = await getRoomById(Number(rid));
          catMap[Number(rid)] = (room as any)?.category || "";
        } catch {}
      }));
      setRoomIdToCategory(catMap);
    } catch (e: any) {
      // Không chặn form nếu lỗi; chỉ thông báo nhẹ
      showError("Không thể tải danh sách hợp đồng", extractApiErrorMessage(e));
    } finally {
      setLoadingContracts(false);
    }
  };

  const filteredContracts = useMemo(() => {
    // Chỉ hiển thị hợp đồng loại single theo yêu cầu
    return contracts.filter((c) => (c.contractType ?? 'single') === 'single');
  }, [contracts]);

  const translateCategory = (cat?: string) => {
    if (!cat) return "";
    const map: Record<string, string> = {
      "phong-tro": "Phòng trọ",
      "chung-cu": "Chung cư",
      "nha-nguyen-can": "Nhà nguyên căn",
    };
    return map[cat] || cat;
  };

  const translateContractStatus = (s?: string) => {
    if (!s) return "";
    const map: Record<string, string> = {
      active: "Đang hiệu lực",
      terminated: "Đã kết thúc",
      expired: "Hết hạn",
      cancelled: "Đã hủy",
      pending: "Chờ hiệu lực",
    };
    return map[s] || s;
  };

  const translateInvoiceStatus = (s?: string) => {
    if (!s) return "";
    const map: Record<string, string> = {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      overdue: "Quá hạn",
      cancelled: "Đã hủy",
      draft: "Nháp",
    };
    return map[s] || s;
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addOtherItem = () => setOtherItems((arr) => [...arr, { description: "", amount: "", type: "" }]);
  const removeOtherItem = (idx: number) => setOtherItems((arr) => arr.filter((_, i) => i !== idx));
  const changeOtherItem = (idx: number, key: keyof OtherItemInput, value: string) => {
    setOtherItems((arr) => arr.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  };

  const validate = () => {
    if (!form.contractId) return "Vui lòng nhập Contract ID";
    const month = Number(form.month);
    if (!month || month < 1 || month > 12) return "Tháng không hợp lệ";
    const year = Number(form.year);
    if (!year || year < 2000) return "Năm không hợp lệ";

    const elecStart = form.electricityStart ? Number(form.electricityStart) : undefined;
    const elecEnd = form.electricityEnd ? Number(form.electricityEnd) : undefined;
    if (elecStart !== undefined && elecEnd !== undefined && elecEnd < elecStart) return "Chỉ số điện kết thúc phải ≥ bắt đầu";

    const waterStart = form.waterStart ? Number(form.waterStart) : undefined;
    const waterEnd = form.waterEnd ? Number(form.waterEnd) : undefined;
    if (waterStart !== undefined && waterEnd !== undefined && waterEnd < waterStart) return "Chỉ số nước kết thúc phải ≥ bắt đầu";

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      showError("Lỗi dữ liệu", err);
      return;
    }

    const contractIdNum = Number(String(form.contractId).trim());
    if (!contractIdNum || Number.isNaN(contractIdNum)) {
      showError("Thiếu hợp đồng", "Vui lòng chọn hoặc nhập Contract ID hợp lệ");
      return;
    }

    // Tiền kiểm tra hợp đồng thuộc chủ nhà để tránh 404 không rõ ràng
    try {
      setValidatingContract(true);
      const contract = await getLandlordContractById(contractIdNum);
      setValidatedContract(contract);
    } catch (e) {
      setValidatingContract(false);
      showError("Hợp đồng không hợp lệ", "Không tìm thấy hợp đồng thuộc tài khoản chủ nhà này");
      return;
    } finally {
      setValidatingContract(false);
    }

    const payload: CreateManualInvoicePayload = {
      contractId: contractIdNum,
      month: Number(form.month),
      year: Number(form.year),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      electricityStart: form.electricityStart ? Number(form.electricityStart) : undefined,
      electricityEnd: form.electricityEnd ? Number(form.electricityEnd) : undefined,
      waterStart: form.waterStart ? Number(form.waterStart) : undefined,
      waterEnd: form.waterEnd ? Number(form.waterEnd) : undefined,
      includeRent: form.includeRent,
      note: form.note || undefined,
      otherItems: otherItems
        .filter((it) => it.description && it.amount)
        .map((it) => ({ description: it.description, amount: Number(it.amount), type: it.type || "other" })),
    };

    try {
      setSubmitting(true);
      const res = await createManualInvoice(payload);
      setResult(res);
      showSuccess("Tạo hóa đơn thành công", `Mã hoá đơn #${res.invoiceId}`);

      // Reset form về trạng thái mới cho lần tạo tiếp theo (giữ lại hợp đồng)
      const now = new Date();
      const nextForm = {
        contractId: form.contractId,
        month: String(now.getMonth() + 1),
        year: String(now.getFullYear()),
        dueDate: "",
        electricityStart: "",
        electricityEnd: "",
        waterStart: "",
        waterEnd: "",
        includeRent: true,
        note: "",
      };
      setForm(nextForm);
      setOtherItems([]);
    } catch (error) {
      const msg = extractApiErrorMessage(error);
      const body = (error as any)?.body;
      const detail = body ? ` (chi tiết: ${JSON.stringify(body)})` : '';
      // Thông báo thân thiện cho case tổng tiền rỗng theo hướng dẫn BE
      if (String(msg).toLowerCase().includes('invoice has no payable items')) {
        showError("Không thể tạo hoá đơn", "Không có khoản phải thu. Hãy bật tiền thuê hoặc nhập điện/nước/khoản khác > 0.");
      } else {
        showError("Không thể tạo hoá đơn", `${msg}${detail}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Tạo hoá đơn thủ công</h2>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border rounded-xl p-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn hợp đồng</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.contractId}
              onChange={(e) => setForm((prev) => ({ ...prev, contractId: e.target.value }))}
            >
              <option value="">-- Chọn hợp đồng --</option>
              {filteredContracts.map((c: LandlordContractSummary) => {
                const cat = translateCategory(roomIdToCategory[c.roomId]);
                const label = `Phòng ${c?.roomInfo?.roomNumber ?? "?"}${cat ? " - " + cat : ""} (${translateContractStatus(c?.status)})`;
                return (
                  <option key={c.contractId} value={String(c.contractId)}>
                    {label}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              (Danh sách lấy từ hợp đồng của bạn. Nếu không thấy, bấm refresh trình duyệt để tải lại.)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
            <input name="month" value={form.month} onChange={onChange} className="w-full border rounded-lg px-3 py-2" inputMode="numeric" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Năm</label>
            <input name="year" value={form.year} onChange={onChange} className="w-full border rounded-lg px-3 py-2" inputMode="numeric" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hạn thanh toán</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={onChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="flex items-end space-x-2">
            <input type="checkbox" name="includeRent" checked={form.includeRent} onChange={onChange} />
            <label className="text-sm text-gray-700">Bao gồm tiền thuê tháng</label>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">Điện</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Chỉ số đầu" name="electricityStart" value={form.electricityStart} onChange={onChange} className="border rounded-lg px-3 py-2" type="number" min="0" />
            <input placeholder="Chỉ số cuối" name="electricityEnd" value={form.electricityEnd} onChange={onChange} className="border rounded-lg px-3 py-2" type="number" min="0" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Để trống nếu không tính điện trong kỳ này.</p>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">Nước</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Chỉ số đầu" name="waterStart" value={form.waterStart} onChange={onChange} className="border rounded-lg px-3 py-2" type="number" min="0" />
            <input placeholder="Chỉ số cuối" name="waterEnd" value={form.waterEnd} onChange={onChange} className="border rounded-lg px-3 py-2" type="number" min="0" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Để trống nếu không tính nước trong kỳ này.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Khoản khác</h3>
            <button type="button" onClick={addOtherItem} className="text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50">Thêm</button>
          </div>
          {otherItems.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có khoản khác</p>
          ) : (
            <div className="space-y-3">
              {otherItems.map((it, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <input className="md:col-span-6 border rounded-lg px-3 py-2" placeholder="Mô tả" value={it.description} onChange={(e) => changeOtherItem(idx, "description", e.target.value)} />
                  <input className="md:col-span-3 border rounded-lg px-3 py-2" placeholder="Số tiền" value={it.amount} onChange={(e) => changeOtherItem(idx, "amount", e.target.value)} inputMode="numeric" />
                  <input className="md:col-span-2 border rounded-lg px-3 py-2" placeholder="Loại (vd: internet)" value={it.type} onChange={(e) => changeOtherItem(idx, "type", e.target.value)} />
                  <button type="button" onClick={() => removeOtherItem(idx)} className="md:col-span-1 text-red-600 text-sm">Xóa</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
          <textarea name="note" value={form.note} onChange={onChange} rows={3} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="flex items-center gap-3">
          <button disabled={submitting || validatingContract} type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-60">
            {submitting ? "Đang tạo..." : validatingContract ? "Đang kiểm tra hợp đồng..." : "Tạo hoá đơn"}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 bg-white border rounded-xl p-6">
          <h3 className="font-medium text-gray-900 mb-2">Kết quả</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <div>Mã hoá đơn: <span className="font-semibold">#{result.invoiceId}</span></div>
            <div>Tổng tiền: <span className="font-semibold">{new Intl.NumberFormat('vi-VN').format(result.amount)} đ</span></div>
            <div>Hạn thanh toán: {new Date(result.dueDate).toLocaleString('vi-VN')}</div>
            <div>Trạng thái: {translateInvoiceStatus(result.status)}</div>
            {result.description ? <div>Mô tả: {result.description}</div> : null}
          </div>
          {Array.isArray(result.items) && result.items.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-900 mb-1">Chi tiết các khoản</div>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-0.5">
                {result.items.map((it: any, i: number) => (
                  <li key={i}>{it.description}: {new Intl.NumberFormat('vi-VN').format(it.amount)} đ</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


