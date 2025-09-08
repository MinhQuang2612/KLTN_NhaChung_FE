import { API_BASE } from "./api";

export async function uploadFiles(
  files: File[],
  userId: number,
  folder: "images" | "videos"
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
      body: JSON.stringify({
        userId,
        fileName: file.name,
        contentType: file.type,
        folder,
      }),
    }).then((r) => r.json());

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
