"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllReviews, voteReview, deleteReview, voteReply, updateReview, Reply } from '@/services/reviews';
import { getUserById } from '@/services/user';
import { getPostById } from '@/services/posts';
import { extractApiErrorMessage } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ReplyList from '@/components/common/ReplyList';
import ReplyForm from '@/components/common/ReplyForm';
import VoteModal from '@/components/reviews/VoteModal';
import EditForm from '@/components/reviews/EditForm';
import { useConfirm } from '@/hooks/useConfirm';
import ConfirmModal from '@/components/common/ConfirmModal';
import { 
  FaThumbsUp, 
  FaThumbsDown, 
  FaPoll,
  FaTimes,
  FaCheck,
  FaEdit,
  FaTrash,
  FaUserCircle,
  FaReply
} from 'react-icons/fa';

type ReviewCard = {
  id: number;
  reviewId: number;
  writerId?: number;
  name: string;
  text: string;
  rating: number;
  avatar: string;
  createdAt?: string;
  media?: string[];
  isAnonymous?: boolean;
  targetType?: 'USER' | 'ROOM' | 'BUILDING' | 'POST';
  targetId?: number;
  targetInfo?: {
    title?: string;
    name?: string;
    postType?: string;
  };
  votesHelpful?: number;
  votesUnhelpful?: number;
  myVote?: 'helpful' | 'unhelpful' | null;
  replies?: Reply[];
  repliesCount?: number;
  isAuthor?: boolean; // Badge tác giả nếu là owner của target
};

const AVATARS = ["/home/avt1.png", "/home/avt2.png", "/home/avt3.png"]; // fallback

export default function Testimonials(){
  const { user } = useAuth();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const { confirm, showConfirm, hideConfirm, setLoading: setConfirmLoading, handleConfirm, handleCancel } = useConfirm();
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<ReviewCard[]>([]);
  // Vote modal state
  const [voteModalReviewId, setVoteModalReviewId] = useState<number | null>(null);
  const [voteModalReply, setVoteModalReply] = useState<{ reviewId: number; reply: Reply } | null>(null);
  
  // Reply states
  const [showReplyFormForReviewId, setShowReplyFormForReviewId] = useState<number | null>(null);
  const [editingReply, setEditingReply] = useState<Reply | null>(null);
  const [expandedRepliesReviewId, setExpandedRepliesReviewId] = useState<number | null>(null);
  
  // Edit review states
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [updatingReviewId, setUpdatingReviewId] = useState<number | null>(null);
  
  // Delete state
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        // Dùng endpoint lấy tất cả reviews theo tài liệu: GET /reviews/all
        // Truyền userId nếu user đã login để backend check myVote
        const userId = user ? Number((user as any).userId ?? (user as any).id) : undefined;
        const res = await getAllReviews({ 
          sort: 'recent', 
          page: 1, 
          pageSize: 9,
          userId // Thêm userId để backend trả về myVote
        });
        const allItems: any[] = res?.items || [];

        // Enrich writer info (name, avatar) from user profile
        const uniqueWriterIds = Array.from(new Set(allItems.map((r: any) => r?.writerId).filter(Boolean)));
        const idToProfile: Record<number, { name?: string; avatar?: string }> = {};
        await Promise.all(uniqueWriterIds.map(async (uid) => {
          try {
            const u = await getUserById(uid);
            idToProfile[uid] = { name: u?.name, avatar: u?.avatar };
          } catch {}
        }));

        const mapped: ReviewCard[] = allItems
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .map((r, idx) => ({
              id: r.reviewId ?? idx,
              reviewId: r.reviewId ?? idx,
              writerId: r.writerId,
              name: r.isAnonymous ? 'Ẩn danh' : (idToProfile[r.writerId]?.name || `Khách hàng #${r.writerId}`),
              text: r.content || 'Không có nội dung',
              rating: r.rating || 0,
              avatar: (r.isAnonymous ? undefined : idToProfile[r.writerId]?.avatar) || AVATARS[idx % AVATARS.length],
              createdAt: r.createdAt,
              media: Array.isArray(r.media) ? r.media : [],
              isAnonymous: r.isAnonymous || false,
              targetType: r.targetType,
              targetId: r.targetId,
              votesHelpful: typeof r.votesHelpful === 'number' ? r.votesHelpful : 0,
              votesUnhelpful: typeof r.votesUnhelpful === 'number' ? r.votesUnhelpful : 0,
              // Backend sẽ trả về myVote: "helpful" | "unhelpful" | null
              myVote: r.myVote || null,
              replies: r.replies || [],
              repliesCount: r.repliesCount || 0,
              isAuthor: r.isAuthor || false, // Badge tác giả
            }));

        // Fetch target info (post title, user name, etc.)
        const enrichedMapped = await Promise.all(mapped.map(async (card) => {
          if (!card.targetId || !card.targetType) return card;

          try {
            if (card.targetType === 'POST') {
              const post = await getPostById(card.targetId);
              return {
                ...card,
                targetInfo: {
                  title: post.title,
                  postType: post.postType
                }
              };
            } else if (card.targetType === 'USER') {
              const targetUser = await getUserById(card.targetId);
              return {
                ...card,
                targetInfo: {
                  name: targetUser.name
                }
              };
            }
          } catch (err) {
            // Silently fail if target not found
          }
          return card;
        }));

        setCards(enrichedMapped);
      } catch (err: any) {
        setError(extractApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]); // Reload khi user thay đổi (login/logout)

  const reloadReviews = () => {
    // Re-trigger useEffect to reload reviews
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const userId = user ? Number((user as any).userId ?? (user as any).id) : undefined;
        const res = await getAllReviews({ 
          sort: 'recent', 
          page: 1, 
          pageSize: 9,
          userId
        });
        const allItems: any[] = res?.items || [];

        const uniqueWriterIds = Array.from(new Set(allItems.map((r: any) => r?.writerId).filter(Boolean)));
        const idToProfile: Record<number, { name?: string; avatar?: string }> = {};
        await Promise.all(uniqueWriterIds.map(async (uid) => {
          try {
            const u = await getUserById(uid);
            idToProfile[uid] = { name: u?.name, avatar: u?.avatar };
          } catch {}
        }));

        const mapped: ReviewCard[] = allItems
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .map((r, idx) => ({
            id: r.reviewId ?? idx,
            reviewId: r.reviewId ?? idx,
            writerId: r.writerId,
            name: r.isAnonymous ? 'Ẩn danh' : (idToProfile[r.writerId]?.name || `Khách hàng #${r.writerId}`),
            text: r.content || 'Không có nội dung',
            rating: r.rating || 0,
            avatar: (r.isAnonymous ? undefined : idToProfile[r.writerId]?.avatar) || AVATARS[idx % AVATARS.length],
            createdAt: r.createdAt,
            media: Array.isArray(r.media) ? r.media : [],
            isAnonymous: r.isAnonymous || false,
            targetType: r.targetType,
            targetId: r.targetId,
            votesHelpful: typeof r.votesHelpful === 'number' ? r.votesHelpful : 0,
            votesUnhelpful: typeof r.votesUnhelpful === 'number' ? r.votesUnhelpful : 0,
            myVote: r.myVote || null,
            replies: r.replies || [],
            repliesCount: r.repliesCount || 0,
            isAuthor: r.isAuthor || false,
          }));

        const enrichedMapped = await Promise.all(mapped.map(async (card) => {
          if (!card.targetId || !card.targetType) return card;

          try {
            if (card.targetType === 'POST') {
              const post = await getPostById(card.targetId);
              return {
                ...card,
                targetInfo: {
                  title: post.title,
                  postType: post.postType
                }
              };
            } else if (card.targetType === 'USER') {
              const targetUser = await getUserById(card.targetId);
              return {
                ...card,
                targetInfo: {
                  name: targetUser.name
                }
              };
            }
          } catch (err) {
            // Silently fail if target not found
          }
          return card;
        }));

        setCards(enrichedMapped);
      } catch (err: any) {
        setError(extractApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  };

  const displayedItems = useMemo(() => (showAll ? cards : cards.slice(0, 6)), [showAll, cards]);

  const handleCardClick = (card: ReviewCard) => {
    if (!card.targetId || !card.targetType) return;

    if (card.targetType === 'POST') {
      const postType = card.targetInfo?.postType === 'tim-o-ghep' ? 'roommate' : 'rent';
      router.push(`/room_details/${postType}-${card.targetId}`);
    } else if (card.targetType === 'USER') {
      router.push(`/users/${card.targetId}`);
    }
    // ROOM và BUILDING có thể xử lý sau nếu cần
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Đánh giá của khách hàng</h3>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Đang tải đánh giá...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error}</div>
        ) : displayedItems.length === 0 ? (
          <div className="py-8 text-center text-gray-500">Chưa có đánh giá</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {displayedItems.map((it)=> (
              <div 
                key={it.id} 
                className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-2">
                  {it.avatar ? (
                    <img 
                      src={it.avatar} 
                      alt={it.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <FaUserCircle className="w-10 h-10 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{it.name}</p>
                        {it.isAuthor && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                            Tác giả
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        {it.createdAt ? new Date(it.createdAt).toLocaleDateString('vi-VN') : ''}
                      </p>
                    </div>
                    <div className="text-yellow-400 text-sm mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < it.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Target Info - Clickable card if exists */}
                {it.targetInfo && it.targetId && (it.targetType === 'POST' || it.targetType === 'USER') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(it);
                    }}
                    className="w-full mb-3 p-3 rounded-xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white hover:border-teal-400 hover:shadow-md transition-all duration-200 text-left group"
                  >
                    <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">
                      {it.targetType === 'POST' ? 'Đánh giá về bài đăng' : 'Đánh giá về người dùng'}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-teal-700 transition-colors">
                      {it.targetInfo.title || it.targetInfo.name || 'Không có thông tin'}
                    </p>
                  </button>
                )}
                
                {/* Owner Actions (Edit/Delete) - Moved above content */}
                {user && it.writerId === Number((user as any).userId ?? (user as any).id) && (
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editingReviewId === it.reviewId) {
                          // Cancel edit
                          setEditingReviewId(null);
                        } else {
                          // Start edit
                          setEditingReviewId(it.reviewId);
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <FaEdit className="w-3 h-3" />
                      {editingReviewId === it.reviewId ? 'Hủy sửa' : 'Sửa'}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 disabled:opacity-50"
                      disabled={deletingReviewId === it.reviewId}
                      onClick={(e) => {
                        e.stopPropagation();
                        showConfirm(
                          'Xóa đánh giá',
                          'Bạn có chắc muốn xóa đánh giá này?',
                          async () => {
                            setDeletingReviewId(it.reviewId);
                            setConfirmLoading(true);
                            try {
                              await deleteReview(it.reviewId, Number((user as any).userId ?? (user as any).id));
                              showSuccess('Thành công', 'Đã xóa đánh giá thành công!');
                              reloadReviews();
                              hideConfirm();
                            } catch (err: any) {
                              showError('Lỗi', extractApiErrorMessage(err));
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
                    >
                      <FaTrash className="w-3 h-3" />
                      {deletingReviewId === it.reviewId ? 'Đang xóa...' : 'Xóa'}
                    </button>
                  </div>
                )}
                
                {/* Edit Review Form */}
                {editingReviewId === it.reviewId && (
                  <EditForm
                    type="review"
                    initialData={{
                      content: it.text || "",
                      rating: it.rating || 0,
                      media: it.media || [],
                      isAnonymous: it.isAnonymous || false,
                    }}
                    onSubmit={async (data) => {
                      if (!user) return;
                      setUpdatingReviewId(it.reviewId);
                      try {
                        await updateReview(
                          it.reviewId,
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
                    loading={updatingReviewId === it.reviewId}
                  />
                )}
                
                {/* Only show content and media when not editing */}
                {editingReviewId !== it.reviewId && (
                  <>
                    {/* Content */}
                    <p className="text-sm text-gray-700 mb-2 line-clamp-3">{it.text}</p>
                    
                    {/* Media */}
                    {Array.isArray(it.media) && it.media.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {it.media.slice(0, 3).map((url, idx) => (
                          <div key={idx} className="relative w-12 h-12 border rounded overflow-hidden">
                            <img src={url} alt="review-media" className="w-full h-full object-cover" />
                            {idx === 2 && it.media.length > 3 && (
                              <div className="absolute inset-0 bg-black/50 text-white text-[10px] flex items-center justify-center">
                                +{it.media.length - 3}
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
                    <span className="font-semibold text-teal-700">{it.votesHelpful ?? 0}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                    <FaThumbsDown className="w-3 h-3 text-gray-600" />
                    <span className="font-semibold text-gray-700">{it.votesUnhelpful ?? 0}</span>
                  </div>
                  <button
                    type="button"
                    className={`text-xs px-2 py-1.5 rounded font-medium transition-all flex items-center justify-center gap-1 ${
                      it.myVote === 'helpful' 
                        ? 'bg-teal-600 text-white border border-teal-600 hover:bg-teal-700' 
                        : it.myVote === 'unhelpful'
                        ? 'bg-gray-600 text-white border border-gray-600 hover:bg-gray-700'
                        : 'border border-teal-400 text-teal-700 hover:bg-teal-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={!user}
                    onClick={(e) => { 
                      e.stopPropagation();
                      setVoteModalReviewId(it.reviewId);
                    }}
                  >
                    {it.myVote ? (
                      it.myVote === 'helpful' ? (
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
                    onClick={(e) => { 
                      e.stopPropagation();
                      if (showReplyFormForReviewId === it.reviewId) {
                        setShowReplyFormForReviewId(null);
                        setEditingReply(null);
                      } else {
                        setShowReplyFormForReviewId(it.reviewId);
                        setEditingReply(null);
                      }
                    }}
                  >
                    <FaReply className="w-3 h-3" />
                    Trả lời
                  </button>
                </div>
                
                {/* Replies Section */}
                {(it.repliesCount ?? 0) > 0 && expandedRepliesReviewId !== it.reviewId && (
                  <button
                    type="button"
                    className="mt-2 text-left text-xs text-blue-600 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedRepliesReviewId(it.reviewId);
                    }}
                  >
                    Xem {it.repliesCount} phản hồi
                  </button>
                )}
                
                {expandedRepliesReviewId === it.reviewId && it.replies && it.replies.length > 0 && (
                  <div onClick={(e) => e.stopPropagation()} className="mt-2">
                    <ReplyList
                      reviewId={it.reviewId}
                      replies={it.replies}
                      repliesCount={it.repliesCount || 0}
                      onReplyUpdated={reloadReviews}
                      onEditReply={(reply) => {
                        // Không cần làm gì vì ReplyList tự xử lý edit
                      }}
                      onOpenVote={(reply) => {
                        setVoteModalReply({ reviewId: it.reviewId, reply });
                      }}
                    />
                    <button
                      type="button"
                      className="mt-2 text-left text-xs text-gray-500 hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedRepliesReviewId(null);
                      }}
                    >
                      Ẩn phản hồi
                    </button>
                  </div>
                )}
                
                {showReplyFormForReviewId === it.reviewId && (
                  <div onClick={(e) => e.stopPropagation()} className="mt-2">
                    <ReplyForm
                      reviewId={it.reviewId}
                      editingReply={null}
                      onCancel={() => {
                        setShowReplyFormForReviewId(null);
                        setEditingReply(null);
                      }}
                      onReplyCreated={() => {
                        setShowReplyFormForReviewId(null);
                        setEditingReply(null);
                        reloadReviews();
                        setExpandedRepliesReviewId(it.reviewId);
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {cards.length > 6 && (
          <div className="text-center mt-8">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
            >
              {showAll ? 'Thu gọn' : 'Xem thêm đánh giá'}
            </button>
          </div>
        )}
        
        {/* Vote Modal for Review */}
        <VoteModal
          open={voteModalReviewId != null}
          title="Vote đánh giá"
          currentVote={(cards.find((r: any) => r.reviewId === voteModalReviewId)?.myVote as any) ?? null}
          onClose={() => setVoteModalReviewId(null)}
          onSubmit={async (choice) => {
            if (!user || voteModalReviewId == null) return;
            const reviewId = voteModalReviewId;
            try {
              const response = await voteReview(reviewId, Number((user as any).userId ?? (user as any).id), choice === 'helpful');
              setCards((prev: any[]) => prev.map(r => {
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
            } catch (err: any) {
              showError('Lỗi', extractApiErrorMessage(err));
            }
          }}
        />

        {/* Vote Modal for Reply */}
        <VoteModal
          open={voteModalReply != null}
          title="Vote phản hồi"
          currentVote={(voteModalReply?.reply?.myVote as any) ?? null}
          onClose={() => setVoteModalReply(null)}
          onSubmit={async (choice) => {
            if (!user || !voteModalReply) return;
            try {
              const res = await voteReply(
                voteModalReply.reviewId,
                voteModalReply.reply.replyId,
                Number((user as any).userId ?? (user as any).id),
                choice === 'helpful'
              );
              setCards((prev: any[]) => prev.map(rv => {
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
            } catch (err: any) {
              showError('Lỗi', extractApiErrorMessage(err));
            }
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
    </section>
  )
}