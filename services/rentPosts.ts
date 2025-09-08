import { apiPost, apiGet } from "@/utils/api";

export async function createRentPost(category: string, payload: any) {
  return apiPost(`rent-posts/${category}`, payload);
}
// GET list: /rent-posts?{params}
export async function listRentPosts(params: Record<string, any> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });
  const url = `rent-posts${qs.toString() ? `?${qs.toString()}` : ""}`;
  return apiGet<any>(url); // trả raw từ BE
}

// (nếu cần) GET by id: /rent-posts/:id
export async function getRentPostById(id: string) {
  return apiGet<any>(`rent-posts/${id}`); // trả raw
}
