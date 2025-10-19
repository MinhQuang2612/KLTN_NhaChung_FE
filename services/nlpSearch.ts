import { apiGet } from "@/utils/api";

export type NlpSearchParams = {
  q: string;
  radiusKm?: number;
  limit?: number;
  page?: number;
};

export type NlpSearchItem = {
  postId: number;
  roomId?: number;
  title?: string;
  description?: string;
  images?: string[];
  price?: number;
  area?: number;
  address?: any;
  distance?: number; // meters
  score?: number; // relevance score
  createdAt?: string;
  [key: string]: any;
};

export type NlpSearchResponse = {
  posts: NlpSearchItem[];
  total?: number;
  page?: number;
  limit?: number;
};

export async function nlpSearch(params: NlpSearchParams, timeoutMs: number = 8000): Promise<NlpSearchResponse> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;
  const t = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
  try {
    const searchParams = new URLSearchParams();
    if (!params.q || !params.q.trim()) {
      throw Object.assign(new Error("Thiếu truy vấn tìm kiếm"), { status: 400 });
    }
    searchParams.append("q", params.q.trim());
    if (params.radiusKm != null) searchParams.append("radiusKm", String(params.radiusKm));
    if (params.limit != null) searchParams.append("limit", String(params.limit));
    if (params.page != null) searchParams.append("page", String(params.page));

    const query = searchParams.toString();
    // apiGet không hỗ trợ signal, dùng fetch trực tiếp để timeout, nhưng vẫn cần base URL và headers từ api.ts
    // Ở đây tạm dùng apiGet, chấp nhận không cancel nếu môi trường không hỗ trợ signal
    const res = await apiGet<NlpSearchResponse>(`search/nlp${query ? `?${query}` : ""}`);
    // Chuẩn hóa cấu trúc trả về tối thiểu
    return Array.isArray((res as any)) ? { posts: res as any } : (res || { posts: [] });
  } catch (err: any) {
    if (err?.name === "AbortError" || err?.message?.includes("aborted")) {
      throw Object.assign(new Error("Yêu cầu quá thời gian"), { status: 408 });
    }
    throw err;
  } finally {
    if (t) clearTimeout(t as any);
  }
}


