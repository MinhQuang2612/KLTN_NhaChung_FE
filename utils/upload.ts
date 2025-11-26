import { API_BASE } from "./api";

// Overloads để hỗ trợ gọi linh hoạt
export async function uploadFiles(files: File[]): Promise<string[]>;
export async function uploadFiles(files: File[], userId: number): Promise<string[]>;
export async function uploadFiles(files: File[], userId: number, folder: "images" | "videos"): Promise<string[]>;
export async function uploadFiles(
  files: File[],
  userId?: number,
  folder: "images" | "videos" = "images"
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    // 1. Xin presigned URL từ BE
    const token = localStorage.getItem("token");
    // Lấy userId hiệu lực: ưu tiên tham số, fallback từ localStorage.user
    let effectiveUserId: number | undefined = userId;
    // Chuẩn hoá: nếu userId là string số => ép về number
    if (typeof effectiveUserId === "string" as any) {
      const coerced = Number(effectiveUserId as unknown as string);
      effectiveUserId = Number.isFinite(coerced) ? coerced : undefined;
    }
    if ((!effectiveUserId || effectiveUserId <= 0) && typeof window !== 'undefined') {
      try {
        const u = localStorage.getItem('user');
        if (u) {
          const parsed = JSON.parse(u);
          // Hỗ trợ cả string hoặc number từ localStorage
          const maybeId = parsed?.userId;
          const normalizedId = typeof maybeId === 'string' ? Number(maybeId) : maybeId;
          if (typeof normalizedId === 'number' && Number.isFinite(normalizedId) && normalizedId > 0) {
            effectiveUserId = normalizedId;
          }
        }
      } catch {}
    }
    const presignRes = await fetch(`${API_BASE}/files/presign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify((() => {
        const payload: any = {
          fileName: file.name,
          contentType: file.type,
          folder,
        };
        if (typeof effectiveUserId === "number" && Number.isFinite(effectiveUserId) && effectiveUserId > 0) {
          payload.userId = effectiveUserId;
        }
        return payload;
      })()),
    }).then(async (r) => {
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`Presign failed: ${r.status} ${text}`);
      }
      return r.json();
    });

    if (!presignRes?.uploadUrl || !presignRes?.publicUrl) {
      throw new Error("Presign response invalid: missing uploadUrl/publicUrl");
    }

    // 2. PUT file lên S3
    await fetch(presignRes.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    // 3. Lưu link publicUrl vào mảng
    uploadedUrls.push(presignRes.publicUrl);
  }

  return uploadedUrls;
}
