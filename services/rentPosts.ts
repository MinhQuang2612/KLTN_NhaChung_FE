import { apiPost, apiGet, apiPut } from "@/utils/api";

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

// GET user's posts: /rent-posts?userId={userId}
export async function getUserRentPosts(userId: number | string, params: Record<string, any> = {}) {
  const queryParams = {
    userId: userId,
    ...params
  };
  return listRentPosts(queryParams);
}

// (nếu cần) GET by id: /rent-posts/:id
export async function getRentPostById(id: string) {
  return apiGet<any>(`rent-posts/${id}`); // trả raw
}

// UPDATE rent post by id: PUT /rent-posts/:id
export async function updateRentPost(id: number, data: any) {
  return apiPut<any>(`rent-posts/${id}`, data);
}
