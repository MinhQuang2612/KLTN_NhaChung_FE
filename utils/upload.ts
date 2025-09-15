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
        if (typeof userId === "number" && userId > 0) payload.userId = userId;
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
