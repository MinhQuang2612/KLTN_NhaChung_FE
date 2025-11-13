"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import SearchDetails from "../../../components/common/SearchDetails";
import PropertyInfo from "../../../components/room_details/PropertyInfo";
import PropertyDetails from "../../../components/room_details/PropertyDetails";
import ContactCard from "../../../components/room_details/ContactCard";
import MapSection from "../../../components/room_details/MapSection";
import Suggestions from "../../../components/common/Suggestions";
import Footer from "../../../components/common/Footer";
import { getPostById } from "../../../services/posts";
import { getReviewsByTarget, voteReview, deleteReview, voteReply, updateReview } from "@/services/reviews";
import { getUserById } from "@/services/user";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createReview, Reply } from "@/services/reviews";
import { uploadFiles } from "@/utils/upload";
import { extractApiErrorMessage } from "@/utils/api";
import { Post } from "../../../types/Post";
import ReplyList from "@/components/common/ReplyList";
import ReplyForm from "@/components/common/ReplyForm";
import { useConfirm } from "@/hooks/useConfirm";
import ConfirmModal from "@/components/common/ConfirmModal";
import { 
  FaThumbsUp, 
  FaThumbsDown, 
  FaPoll, 
  FaSync, 
  FaLightbulb, 
  FaTimes, 
  FaCheck,
  FaReply,
  FaUserCircle,
  FaTrash,
  FaEdit
} from 'react-icons/fa';
import VoteModal from "@/components/reviews/VoteModal";
import EditForm from "@/components/reviews/EditForm";


type PostType = 'rent' | 'roommate';
type PostData = Post;

interface RoomDetailsPageProps {
  params: { id: string };
  searchParams: { type?: PostType };
}

export default function RoomDetailsPage() {
  const params = useParams();
  const { user } = useAuth();
  const [postData, setPostData] = useState<PostData | null>(null);
  const [postType, setPostType] = useState<PostType>('rent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [reviewAuthorMap, setReviewAuthorMap] = useState<Record<number, { name?: string; avatar?: string }>>({});
  const [rating, setRating] = useState<number>(0);
  const [content, setContent] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [media, setMedia] = useState<string[]>([]);
  const [uploaderVersion, setUploaderVersion] = useState<number>(0);
  const { showError, showSuccess } = useToast();
  const { confirm, showConfirm, hideConfirm, setLoading: setConfirmLoading, handleConfirm, handleCancel } = useConfirm();
  
  // Reply states
  const [showReplyFormForReviewId, setShowReplyFormForReviewId] = useState<number | null>(null);
  const [editingReply, setEditingReply] = useState<Reply | null>(null);
  const [expandedRepliesReviewId, setExpandedRepliesReviewId] = useState<number | null>(null);
  
  // Edit review states
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [updatingReviewId, setUpdatingReviewId] = useState<number | null>(null);
  
  // Vote states (IDs để mở modal)
  const [voteModalReviewId, setVoteModalReviewId] = useState<number | null>(null);
  const [voteModalReply, setVoteModalReply] = useState<{ reviewId: number; reply: Reply } | null>(null);
  
  // Delete state
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

  // Extract postType and postId from params
  // URL format: /room_details/rent-123 or /room_details/roommate-456
  // Scroll to top when component mounts or params change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [params.id]);

  useEffect(() => {
    const idParam = params.id as string;
    if (idParam) {
      if (idParam.startsWith('rent-')) {
        setPostType('rent');
      } else if (idParam.startsWith('roommate-')) {
        setPostType('roommate');
      }
    }
  }, [params.id]);

  useEffect(() => {
    const loadPostData = async () => {
      const idParam = params.id as string;
      if (!idParam) return;

      try {
        setLoading(true);
        setError(null);

        let data: PostData;
        
        // Extract postId from URL parameter
        let postId: number;
        if (idParam.startsWith('rent-')) {
          postId = parseInt(idParam.replace('rent-', ''));
        } else if (idParam.startsWith('roommate-')) {
          postId = parseInt(idParam.replace('roommate-', ''));
        } else {
          // Try to parse as direct postId
          postId = parseInt(idParam);
        }
        
        // Use unified API to get post data
        data = await getPostById(postId);
        
        // Set postType based on actual data
        const pt = String((data as any).postType);
        const actualPostType = pt === 'cho-thue' ? 'rent' : 
                               pt === 'tim-o-ghep' ? 'roommate' : 'rent';
        setPostType(actualPostType);
        
        setPostData(data);
        // Scroll to top after data loads successfully
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }, 100);
      } catch (err: any) {
        setError('Không thể tải thông tin bài đăng');
      } finally {
        setLoading(false);
      }
    };

    loadPostData();
  }, [params.id, postType]);

  // Load reviews khi có postData
  useEffect(() => {
    const loadReviews = async () => {
      if (!postData?.postId) return;
      try {
        setReviewsLoading(true);
        const userId = user ? Number((user as any).userId ?? (user as any).id) : undefined;
        const res = await getReviewsByTarget({ 
          targetType: 'POST', 
          targetId: Number(postData.postId), 
          sort: 'recent', 
          page: 1, 
          pageSize: 10,
          userId // Pass userId to get myVote and replies
        });
        const items = res?.items || [];
        setReviews(items);

        // Enrich tên/ảnh người viết nếu không ẩn danh
        const uniqueWriterIds = Array.from(new Set(items.map((r: any) => r?.isAnonymous ? null : r?.writerId).filter(Boolean)));
        const idToProfile: Record<number, { name?: string; avatar?: string }> = {};
        await Promise.all(uniqueWriterIds.map(async (uid: number) => {
          try {
            const u = await getUserById(uid);
            idToProfile[uid] = { name: u?.name, avatar: u?.avatar };
          } catch {}
        }));
        setReviewAuthorMap(idToProfile);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    loadReviews();
  }, [postData?.postId, user]);

  const reloadReviews = async () => {
    if (!postData?.postId) return;
    try {
      setReviewsLoading(true);
      const userId = user ? Number((user as any).userId ?? (user as any).id) : undefined;
      const res = await getReviewsByTarget({ 
        targetType: 'POST', 
        targetId: Number(postData.postId), 
        sort: 'recent', 
        page: 1, 
        pageSize: 10,
        userId
      });
      const items = res?.items || [];
      setReviews(items);

      const uniqueWriterIds = Array.from(new Set(items.map((r: any) => r?.isAnonymous ? null : r?.writerId).filter(Boolean)));
      const idToProfile: Record<number, { name?: string; avatar?: string }> = {};
      await Promise.all(uniqueWriterIds.map(async (uid: number) => {
        try {
          const u = await getUserById(uid);
          idToProfile[uid] = { name: u?.name, avatar: u?.avatar };
        } catch {}
      }));
      setReviewAuthorMap(idToProfile);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error && !postData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchDetails />
      
      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <PropertyInfo postData={postData} postType={postType} />
            <PropertyDetails postData={postData} postType={postType} />

            {/* Reviews - POST */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900">Đánh giá bài đăng</h3>
                <div className="flex items-center gap-1" aria-label="Chọn số sao">
                  {[1,2,3,4,5].map((star) => {
                    const active = (rating || 0) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-1 transition-colors ${active ? 'text-yellow-400' : 'text-gray-300 hover:text-gray-400'}`}
                        aria-pressed={active}
                        aria-label={`${star} sao`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.347l5.518.442c.499.04.701.663.321.988l-4.204 3.57a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0l-4.725 2.885a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557l-4.204-3.57a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.347l2.125-5.111z" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label htmlFor="post-review" className="sr-only">Nhận xét</label>
                <textarea
                  id="post-review"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn (tùy chọn)"
                  className="w-full rounded-md border border-gray-200 focus:border-teal-500 focus:ring-teal-500 text-sm p-2 min-h-[80px]"
                />
                <div className="mt-2">
                  <input
                    key={`post-uploader-${uploaderVersion}`}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      try {
                        const uploaded = await uploadFiles(files);
                        setMedia(prev => ([...prev, ...uploaded]));
                        showSuccess('Đã tải ảnh', 'Ảnh đã được tải lên.');
                      } catch (err: any) {
                        const msg = extractApiErrorMessage(err);
                        showError('Tải ảnh thất bại', msg);
                      } finally {
                        e.currentTarget.value = '';
                      }
                    }}
                    className="block text-sm text-gray-600"
                  />
                  {Boolean(media.length) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {media.map((url, idx) => (
                        <div key={idx} className="relative w-14 h-14 border rounded overflow-hidden">
                          <img src={url} alt="media" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setMedia(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                            aria-label="Xóa ảnh"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <label className="inline-flex items-center text-sm text-gray-600 select-none">
                  <input
                    type="checkbox"
                    className="mr-2 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  Ẩn danh khi hiển thị
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRating(0);
                      setContent("");
                      setIsAnonymous(false);
                      setMedia([]);
                      setUploaderVersion(v => v + 1);
                    }}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-gray-700"
                  >
                    Xóa
                  </button>
                  <button
                    type="button"
                    disabled={!rating}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${rating ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    onClick={async () => {
                      try {
                        if (!user || !postData) return;
                        const payload = {
                          writerId: Number((user as any).userId ?? (user as any).id),
                          targetType: 'POST' as const,
                          targetId: Number(postData.postId),
                          rating: Number(rating),
                          content: content.trim() || undefined,
                          isAnonymous: !!isAnonymous,
                          media: media,
                        };
                        await createReview(payload);
                        showSuccess('Đã gửi đánh giá', 'Cảm ơn bạn đã chia sẻ.');
                        setRating(0);
                        setContent("");
                        setIsAnonymous(false);
                        setMedia([]);
                        setUploaderVersion(v => v + 1);
                      } catch (err: any) {
                        const msg = extractApiErrorMessage(err);
                        showError('Không thể gửi đánh giá', msg);
                      }
                    }}
                  >
                    Gửi đánh giá
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <ContactCard postData={postData as any} postType={postType} />
            <MapSection postData={postData as any} postType={postType} />

            {/* Reviews for this post */}
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3">Đánh giá về bài đăng</h4>
              {reviewsLoading ? (
                <p className="text-sm text-gray-500">Đang tải đánh giá...</p>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có đánh giá</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.reviewId} className="border rounded-lg p-3">
                      {/* Review Header with Avatar */}
                      <div className="flex items-start gap-3 mb-2">
                        {/* Avatar */}
                        {r.isAnonymous || !reviewAuthorMap[r.writerId]?.avatar ? (
                          <FaUserCircle className="w-10 h-10 text-gray-400 flex-shrink-0" />
                        ) : (
                          <img
                            src={reviewAuthorMap[r.writerId].avatar}
                            alt={reviewAuthorMap[r.writerId].name || 'User'}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                          />
                        )}
                        
                        {/* Name, Date, Rating */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {r.isAnonymous ? 'Ẩn danh' : (reviewAuthorMap[r.writerId]?.name || `Khách hàng #${r.writerId}`)}
                              </p>
                              {!r.isAnonymous && r.isAuthor && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                                  Tác giả
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 whitespace-nowrap">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : ''}
                            </p>
                          </div>
                          <div className="text-yellow-400 text-sm mt-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i}>{i < (r.rating || 0) ? '★' : '☆'}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Review Actions (Edit/Delete) - Only for review owner */}
                      {user && r.writerId === Number((user as any).userId ?? (user as any).id) && (
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (editingReviewId === r.reviewId) {
                                // Cancel edit
                                setEditingReviewId(null);
                              } else {
                                // Start edit
                                setEditingReviewId(r.reviewId);
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                          >
                            <FaEdit className="w-3 h-3" />
                            {editingReviewId === r.reviewId ? 'Hủy sửa' : 'Sửa'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              showConfirm(
                                'Xóa đánh giá',
                                'Bạn có chắc muốn xóa đánh giá này?',
                                async () => {
                                  setDeletingReviewId(r.reviewId);
                                  setConfirmLoading(true);
                                  try {
                                    await deleteReview(r.reviewId, Number((user as any).userId ?? (user as any).id));
                                    showSuccess('Đã xóa đánh giá', 'Đánh giá đã được xóa');
                                    reloadReviews();
                                    hideConfirm();
                                  } catch (error: any) {
                                    showError('Không thể xóa đánh giá', error.message || 'Đã xảy ra lỗi');
                                  } finally {
                                    setDeletingReviewId(null);
                                    setConfirmLoading(false);
                                  }
                                },
                                {
                                  confirmText: 'Xóa',
                                  cancelText: 'Hủy',
                                  type: 'danger'
                                }
                              );
                            }}
                            disabled={deletingReviewId === r.reviewId}
                            className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 disabled:opacity-50"
                          >
                            <FaTrash className="w-3 h-3" />
                            {deletingReviewId === r.reviewId ? 'Đang xóa...' : 'Xóa'}
                          </button>
                        </div>
                      )}
                      
                      {/* Edit Review Form */}
                      {editingReviewId === r.reviewId && (
                        <EditForm
                          type="review"
                          initialData={{
                            content: r.content || "",
                            rating: r.rating || 0,
                            media: r.media || [],
                            isAnonymous: r.isAnonymous || false,
                          }}
                          onSubmit={async (data) => {
                            if (!user) return;
                            setUpdatingReviewId(r.reviewId);
                            try {
                              await updateReview(
                                r.reviewId,
                                Number((user as any).userId ?? (user as any).id),
                                {
                                  rating: data.rating!,
                                  content: data.content,
                                  isAnonymous: data.isAnonymous,
                                  media: data.media && data.media.length > 0 ? data.media : undefined,
                                }
                              );
                              showSuccess('Đã cập nhật đánh giá', 'Đánh giá đã được cập nhật.');
                              setEditingReviewId(null);
                              reloadReviews();
                            } catch (err: any) {
                              const msg = extractApiErrorMessage(err);
                              showError('Không thể cập nhật đánh giá', msg);
                              throw err;
                            } finally {
                              setUpdatingReviewId(null);
                            }
                          }}
                          onCancel={() => {
                            setEditingReviewId(null);
                          }}
                          loading={updatingReviewId === r.reviewId}
                        />
                      )}
                      
                      {/* Only show content and media when not editing */}
                      {editingReviewId !== r.reviewId && (
                        <>
                          {r.content && (
                            <p className="mt-2 text-sm text-gray-700">{r.content}</p>
                          )}
                          {Array.isArray(r.media) && r.media.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {r.media.slice(0, 3).map((url: string, idx: number) => (
                                <div key={idx} className="relative w-12 h-12 border rounded overflow-hidden">
                                  <img src={url} alt="review-media" className="w-full h-full object-cover" />
                                  {idx === 2 && r.media.length > 3 && (
                                    <div className="absolute inset-0 bg-black/50 text-white text-[10px] flex items-center justify-center">
                                      +{r.media.length - 3}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      {/* Vote Stats + Vote Action + Reply Button */}
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-teal-50 rounded border border-teal-200">
                          <FaThumbsUp className="w-3 h-3 text-teal-600" />
                          <span className="font-semibold text-teal-700">{r.votesHelpful ?? 0}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                          <FaThumbsDown className="w-3 h-3 text-gray-600" />
                          <span className="font-semibold text-gray-700">{r.votesUnhelpful ?? 0}</span>
                        </div>
                        <button
                          type="button"
                          className={`text-xs px-2 py-1.5 rounded font-medium transition-all flex items-center justify-center gap-1 ${
                            (r as any).myVote === 'helpful' 
                              ? 'bg-teal-600 text-white border border-teal-600 hover:bg-teal-700' 
                              : (r as any).myVote === 'unhelpful'
                              ? 'bg-gray-600 text-white border border-gray-600 hover:bg-gray-700'
                              : 'border border-teal-400 text-teal-700 hover:bg-teal-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={!user}
                          onClick={() => setVoteModalReviewId(r.reviewId)}
                        >
                          {(r as any).myVote ? (
                            (r as any).myVote === 'helpful' ? (
                              <>
                                <FaCheck className="w-3 h-3" />
                                Đã vote hữu ích
                              </>
                            ) : (
                              <>
                                <FaTimes className="w-3 h-3" />
                                Đã vote không hữu ích
                              </>
                            )
                          ) : (
                            <>
                              <FaPoll className="w-3 h-3" />
                              Vote
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="text-xs px-2 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-all"
                          disabled={!user}
                          onClick={() => {
                            if (showReplyFormForReviewId === r.reviewId) {
                              setShowReplyFormForReviewId(null);
                              setEditingReply(null);
                            } else {
                              setShowReplyFormForReviewId(r.reviewId);
                              setEditingReply(null);
                            }
                          }}
                        >
                          <FaReply className="w-3 h-3" />
                          Trả lời
                        </button>
                      </div>

                      {/* Replies Section */}
                      {r.repliesCount > 0 && expandedRepliesReviewId !== r.reviewId && (
                        <button
                          type="button"
                          className="mt-2 text-left text-xs text-blue-600 hover:underline"
                          onClick={() => setExpandedRepliesReviewId(r.reviewId)}
                        >
                          Xem {r.repliesCount} phản hồi
                        </button>
                      )}
                      
                      {expandedRepliesReviewId === r.reviewId && r.replies && r.replies.length > 0 && (
                        <div>
                          <ReplyList
                            reviewId={r.reviewId}
                            replies={r.replies}
                            repliesCount={r.repliesCount || 0}
                            onReplyUpdated={reloadReviews}
                            onEditReply={(reply) => {
                              // Không cần làm gì vì ReplyList tự xử lý edit
                            }}
                            onOpenVote={(reply) => {
                              setVoteModalReply({ reviewId: r.reviewId, reply });
                            }}
                          />
                          <button
                            type="button"
                            className="mt-2 text-left text-xs text-gray-500 hover:text-gray-700"
                            onClick={() => setExpandedRepliesReviewId(null)}
                          >
                            Ẩn phản hồi
                          </button>
                        </div>
                      )}
                      
                      {showReplyFormForReviewId === r.reviewId && (
                        <ReplyForm
                          reviewId={r.reviewId}
                          editingReply={null}
                          onCancel={() => {
                            setShowReplyFormForReviewId(null);
                          }}
                          onReplyCreated={() => {
                            setShowReplyFormForReviewId(null);
                            reloadReviews();
                            setExpandedRepliesReviewId(r.reviewId);
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Suggestions Section */}
      <Suggestions />
      
      <Footer />
      
      {/* Vote Modal - dùng chung cho Review */}
      <VoteModal
        open={voteModalReviewId != null}
        title="Vote đánh giá"
        currentVote={(reviews.find((r: any) => r.reviewId === voteModalReviewId)?.myVote as any) ?? null}
        onClose={() => setVoteModalReviewId(null)}
        onSubmit={async (choice) => {
          if (!user || voteModalReviewId == null) return;
          const reviewId = voteModalReviewId;
          const response = await voteReview(reviewId, Number((user as any).userId ?? (user as any).id), choice === 'helpful');
          setReviews((prev: any[]) => prev.map(r => {
            if (r.reviewId !== reviewId) return r;
            return {
              ...r,
              votesHelpful: response.votesHelpful ?? r.votesHelpful,
              votesUnhelpful: response.votesUnhelpful ?? r.votesUnhelpful,
              myVote: choice
            };
          }));
          showSuccess('Thành công', 'Đã gửi vote');
          setVoteModalReviewId(null);
        }}
      />

      {/* Vote Modal - dùng chung cho Reply */}
      <VoteModal
        open={voteModalReply != null}
        title="Vote phản hồi"
        currentVote={(voteModalReply?.reply?.myVote as any) ?? null}
        onClose={() => setVoteModalReply(null)}
        onSubmit={async (choice) => {
          if (!user || !voteModalReply) return;
          const res = await voteReply(
            voteModalReply.reviewId,
            voteModalReply.reply.replyId,
            Number((user as any).userId ?? (user as any).id),
            choice === 'helpful'
          );
          setReviews((prev: any[]) => prev.map(rv => {
            if (rv.reviewId !== voteModalReply.reviewId) return rv;
            const updatedReplies = (rv.replies || []).map((rep: Reply) => {
              if (rep.replyId !== voteModalReply.reply.replyId) return rep;
              return {
                ...rep,
                votesHelpful: res.votesHelpful ?? rep.votesHelpful,
                votesUnhelpful: res.votesUnhelpful ?? rep.votesUnhelpful,
                myVote: choice
              };
            });
            return { ...rv, replies: updatedReplies };
          }));
          showSuccess('Thành công', 'Đã gửi vote cho phản hồi');
          setVoteModalReply(null);
        }}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirm.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        type={confirm.type}
        loading={confirm.loading}
      />
    </div>
  );
}
