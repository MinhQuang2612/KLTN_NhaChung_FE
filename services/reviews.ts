import { apiGet, apiPost, apiPatch, apiDel } from "@/utils/api";

export type ReviewTargetType = "USER" | "ROOM" | "BUILDING" | "POST";

export interface Reply {
  replyId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  media?: string[]; // URLs của ảnh đính kèm (max 3)
  isAuthor: boolean;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  votesHelpful?: number;
  votesUnhelpful?: number;
  myVote?: 'helpful' | 'unhelpful' | null;
}

export interface Review {
  reviewId: number;
  writerId: number;
  targetType: ReviewTargetType;
  targetId: number;
  contractId?: number;
  rating: number; // 1..5
  content?: string;
  media?: string[];
  isAnonymous?: boolean;
  isEdited?: boolean;
  votesHelpful?: number;
  votesUnhelpful?: number;
  myVote?: 'helpful' | 'unhelpful' | null;
  replies?: Reply[];
  repliesCount?: number;
  isAuthor?: boolean; // Badge "Tác giả" nếu writerId là owner của target
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReviewPayload {
  writerId: number;
  targetType: ReviewTargetType;
  targetId: number;
  contractId?: number;
  rating: number; // 1..5
  content?: string;
  isAnonymous?: boolean;
  media?: string[];
}

export interface ReviewsQueryResponse {
  items: Review[];
  total: number;
  page: number;
  pageSize: number;
  ratingSummary?: { ratingAvg: number; ratingCount: number };
}

const BASE = "reviews";

export function createReview(payload: CreateReviewPayload) {
  // POST /reviews
  return apiPost<Review>(`${BASE}`, payload);
}

export function getReviewsByTarget(params: {
  targetType: ReviewTargetType;
  targetId: number;
  rating?: number;
  hasMedia?: boolean;
  sort?: "recent" | "top";
  page?: number;
  pageSize?: number;
  userId?: number; // Thêm userId để backend check myVote
}) {
  const sp = new URLSearchParams();
  sp.append("targetType", params.targetType);
  sp.append("targetId", String(params.targetId));
  if (params.rating != null) sp.append("rating", String(params.rating));
  if (params.hasMedia != null) sp.append("hasMedia", String(params.hasMedia));
  if (params.sort) sp.append("sort", params.sort);
  if (params.page != null) sp.append("page", String(params.page));
  if (params.pageSize != null) sp.append("pageSize", String(params.pageSize));
  if (params.userId != null) sp.append("userId", String(params.userId)); // Thêm userId
  const qs = sp.toString();
  return apiGet<ReviewsQueryResponse>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export function getMyWrittenReviews(userId: number) {
  // GET /reviews/me/written?userId=xxx
  return apiGet<Review[]>(`${BASE}/me/written?userId=${userId}`);
}

export function getAllReviews(params?: {
  sort?: 'recent' | 'top';
  page?: number;
  pageSize?: number;
  hasMedia?: boolean;
  targetType?: ReviewTargetType;
  rating?: number;
  userId?: number; // Thêm userId để backend check myVote
}) {
  const sp = new URLSearchParams();
  if (params?.sort) sp.append('sort', params.sort);
  if (params?.page != null) sp.append('page', String(params.page));
  if (params?.pageSize != null) sp.append('pageSize', String(params.pageSize));
  if (params?.hasMedia != null) sp.append('hasMedia', String(params.hasMedia));
  if (params?.targetType) sp.append('targetType', params.targetType);
  if (params?.rating != null) sp.append('rating', String(params.rating));
  if (params?.userId != null) sp.append('userId', String(params.userId)); // Thêm userId
  const qs = sp.toString();
  return apiGet<{
    items: Review[];
    total: number;
    page: number;
    pageSize: number;
  }>(`${BASE}/all${qs ? `?${qs}` : ''}`);
}

export function updateReview(reviewId: number, userId: number, body: Partial<Omit<CreateReviewPayload, "writerId" | "targetType" | "targetId">>) {
  // PATCH /reviews/{reviewId}?userId=xxx
  return apiPatch<Review>(`${BASE}/${reviewId}?userId=${userId}`, body);
}

export function deleteReview(reviewId: number, userId: number) {
  // DELETE /reviews/{reviewId}?userId=xxx
  return apiDel<{ success: boolean }>(`${BASE}/${reviewId}?userId=${userId}`);
}

export function voteReview(reviewId: number, userId: number, isHelpful: boolean) {
  // POST /reviews/{reviewId}/vote?userId=xxx
  return apiPost<Review>(`${BASE}/${reviewId}/vote?userId=${userId}`, { isHelpful });
}

// ==================== REPLY APIs ====================

export interface CreateReplyPayload {
  content: string;
  userId: number;
  media?: string[]; // URLs của ảnh đính kèm (max 3)
}

export interface CreateReplyResponse {
  reviewId: number;
  reply: Reply;
}

export interface DeleteReplyResponse {
  message: string;
  reviewId: number;
  replyId: number;
}

export function createReply(reviewId: number, payload: CreateReplyPayload) {
  // POST /reviews/{reviewId}/replies
  return apiPost<CreateReplyResponse>(`${BASE}/${reviewId}/replies`, payload);
}

export function updateReply(reviewId: number, replyId: number, payload: CreateReplyPayload) {
  // PATCH /reviews/{reviewId}/replies/{replyId}
  return apiPatch<CreateReplyResponse>(`${BASE}/${reviewId}/replies/${replyId}`, payload);
}

export function deleteReply(reviewId: number, replyId: number, userId: number) {
  // DELETE /reviews/{reviewId}/replies/{replyId}?userId=xxx
  return apiDel<DeleteReplyResponse>(`${BASE}/${reviewId}/replies/${replyId}?userId=${userId}`);
}

export function voteReply(reviewId: number, replyId: number, userId: number, isHelpful: boolean) {
  // POST /reviews/{reviewId}/replies/{replyId}/vote?userId=xxx
  return apiPost<{
    reviewId: number;
    replyId: number;
    votesHelpful: number;
    votesUnhelpful: number;
    myVote: 'helpful' | 'unhelpful';
  }>(`${BASE}/${reviewId}/replies/${replyId}/vote?userId=${userId}`, { isHelpful });
}
