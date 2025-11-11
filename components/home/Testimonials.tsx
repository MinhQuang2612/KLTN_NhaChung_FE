"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllReviews, voteReview, deleteReview, Reply } from '@/services/reviews';
import { getUserById } from '@/services/user';
import { getPostById } from '@/services/posts';
import { extractApiErrorMessage } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ReplyList from '@/components/common/ReplyList';
import ReplyForm from '@/components/common/ReplyForm';
import { 
  FaCalendarAlt, 
  FaHome, 
  FaUser, 
  FaBuilding, 
  FaFileAlt, 
  FaMapMarkerAlt, 
  FaThumbsUp, 
  FaThumbsDown, 
  FaComment, 
  FaPoll,
  FaEye,
  FaChevronUp,
  FaChevronDown,
  FaSync,
  FaLightbulb,
  FaTimes,
  FaCheck,
  FaEdit,
  FaTrash,
  FaCrown
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
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<ReviewCard[]>([]);
  // Trang chủ chỉ hiển thị và vote, không có form tạo
  const [voteModalReviewId, setVoteModalReviewId] = useState<number | null>(null);
  const [voteChoice, setVoteChoice] = useState<'helpful' | 'unhelpful' | null>(null);
  
  // Reply states
  const [showReplyFormForReviewId, setShowReplyFormForReviewId] = useState<number | null>(null);
  const [editingReply, setEditingReply] = useState<Reply | null>(null);
  const [expandedRepliesReviewId, setExpandedRepliesReviewId] = useState<number | null>(null);
  
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
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h3 className="text-2xl md:text-3xl font-bold text-teal-600 mb-6">Đánh giá của khách hàng</h3>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Đang tải đánh giá...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error}</div>
        ) : displayedItems.length === 0 ? (
          <div className="py-8 text-center text-gray-500">Chưa có đánh giá</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {displayedItems.map((it)=> (
              <div 
                key={it.id} 
                className={`group rounded-xl bg-white p-6 shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col ${it.targetId && (it.targetType === 'POST' || it.targetType === 'USER') ? 'cursor-pointer hover:border-teal-400 hover:-translate-y-1' : ''}`}
                onClick={() => handleCardClick(it)}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <img 
                    src={it.avatar} 
                    alt={it.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-teal-200 shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-semibold text-gray-900 text-base truncate">{it.name}</p>
                        {it.isAuthor && (
                          <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full font-semibold border border-blue-300 flex items-center gap-1 shadow-sm whitespace-nowrap flex-shrink-0">
                            <FaCrown className="w-3 h-3 text-blue-600" />
                            Tác giả
                          </span>
                        )}
                      </div>
                      {it.targetType && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 border border-teal-300 font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                          {it.targetType === 'ROOM' ? (
                            <>
                              <FaHome className="w-3 h-3" />
                              <span>Phòng</span>
                            </>
                          ) : it.targetType === 'USER' ? (
                            <>
                              <FaUser className="w-3 h-3" />
                              <span>Người dùng</span>
                            </>
                          ) : it.targetType === 'BUILDING' ? (
                            <>
                              <FaBuilding className="w-3 h-3" />
                              <span>Tòa nhà</span>
                            </>
                          ) : (
                            <>
                              <FaFileAlt className="w-3 h-3" />
                              <span>Bài đăng</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-yellow-400 text-base">
                      {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className="drop-shadow-sm">{i < it.rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-gray-600">{it.rating}.0</span>
                    </div>
                    {it.createdAt && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <FaCalendarAlt className="w-3 h-3" />
                        {new Date(it.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Target Info */}
                {it.targetInfo && (
                  <div className="mb-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                    <p className="text-[10px] text-gray-500 font-medium mb-1 uppercase tracking-wide flex items-center gap-1">
                      <FaMapMarkerAlt className="w-3 h-3" />
                      {it.targetType === 'POST' ? 'Đánh giá về bài đăng' : 'Đánh giá về người dùng'}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                      {it.targetInfo.title || it.targetInfo.name || 'Không có thông tin'}
                    </p>
                  </div>
                )}
                
                {/* Content */}
                <p className="text-sm text-gray-700 leading-relaxed mb-3 flex-grow">{it.text}</p>
                
                {/* Media */}
                {(() => { 
                  const mediaList = Array.isArray(it.media) ? it.media : []; 
                  return mediaList.length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                    {mediaList.slice(0, 3).map((url, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <img src={url} alt="review-media" className="w-full h-full object-cover" />
                        {idx === 2 && mediaList.length > 3 && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm text-white text-xs font-bold flex items-center justify-center">
                            +{mediaList.length - 3}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  ) : null 
                })()}
                
                {/* Divider */}
                <div className="border-t border-gray-200 my-3"></div>
                
                {/* Vote Stats */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-50 rounded-lg border border-teal-200">
                      <FaThumbsUp className="w-3 h-3 text-teal-600" />
                      <span className="font-semibold text-teal-700">{it.votesHelpful ?? 0}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                      <FaThumbsDown className="w-3 h-3 text-gray-600" />
                      <span className="font-semibold text-gray-700">{it.votesUnhelpful ?? 0}</span>
                    </div>
                  </div>
                </div>
                
                {/* Owner Actions (Edit/Delete) */}
                {user && it.writerId === Number((user as any).userId ?? (user as any).id) && (
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 font-medium hover:bg-blue-50 hover:border-blue-400 transition-all flex items-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        showError('Thông báo', 'Chức năng sửa đánh giá đang được phát triển');
                      }}
                    >
                      <FaEdit className="w-3 h-3" />
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-700 font-medium hover:bg-red-50 hover:border-red-400 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      disabled={deletingReviewId === it.reviewId}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
                        
                        setDeletingReviewId(it.reviewId);
                        try {
                          await deleteReview(it.reviewId, Number((user as any).userId ?? (user as any).id));
                          showSuccess('Thành công', 'Đã xóa đánh giá thành công!');
                          reloadReviews();
                        } catch (err: any) {
                          showError('Lỗi', extractApiErrorMessage(err));
                        } finally {
                          setDeletingReviewId(null);
                        }
                      }}
                    >
                      <FaTrash className="w-3 h-3" />
                      {deletingReviewId === it.reviewId ? 'Đang xóa...' : 'Xóa'}
                    </button>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 disabled:text-gray-400 disabled:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
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
                    <FaComment className="w-3 h-3" />
                    {it.repliesCount ? `${it.repliesCount} phản hồi` : 'Trả lời'}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 text-xs px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                      it.myVote === 'helpful' 
                        ? 'bg-teal-600 text-white border border-teal-600 hover:bg-teal-700' 
                        : it.myVote === 'unhelpful'
                        ? 'bg-gray-600 text-white border border-gray-600 hover:bg-gray-700'
                        : 'border border-teal-400 text-teal-700 hover:bg-teal-50 hover:border-teal-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={!user}
                    onClick={(e) => { 
                      e.stopPropagation();
                      setVoteModalReviewId(it.reviewId); 
                      setVoteChoice(null); 
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
                  </div>
                
                {/* Replies Section */}
                {(it.repliesCount ?? 0) > 0 && expandedRepliesReviewId !== it.reviewId && (
                  <button
                    type="button"
                    className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedRepliesReviewId(it.reviewId);
                    }}
                  >
                    <FaEye className="w-3 h-3" />
                    Xem {it.repliesCount} phản hồi
                  </button>
                )}
                
                {expandedRepliesReviewId === it.reviewId && it.replies && it.replies.length > 0 && (
                  <div onClick={(e) => e.stopPropagation()} className="mt-3">
                    <ReplyList
                      reviewId={it.reviewId}
                      replies={it.replies}
                      repliesCount={it.repliesCount || 0}
                      onReplyUpdated={reloadReviews}
                      onEditReply={(reply) => {
                        setEditingReply(reply);
                        setShowReplyFormForReviewId(it.reviewId);
                      }}
                    />
                    <button
                      type="button"
                      className="mt-2 w-full text-xs text-gray-600 hover:text-gray-700 font-medium py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedRepliesReviewId(null);
                      }}
                    >
                      <FaChevronUp className="w-3 h-3" />
                      Ẩn phản hồi
                    </button>
                  </div>
                )}
                
                {showReplyFormForReviewId === it.reviewId && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ReplyForm
                      reviewId={it.reviewId}
                      editingReply={editingReply}
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
          <div className="text-center mt-10">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              {showAll ? (
                <>
                  <FaChevronUp className="w-5 h-5" />
                  Thu gọn
                </>
              ) : (
                <>
                  Xem thêm đánh giá
                  <FaChevronDown className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
        {/* Vote Modal */}
        {voteModalReviewId != null && (() => {
          const currentReview = cards.find(c => c.reviewId === voteModalReviewId);
          const currentVote = currentReview?.myVote;
          
          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {currentVote ? (
                      <>
                        <FaSync className="w-5 h-5 text-teal-600" />
                        Thay đổi đánh giá
                      </>
                    ) : (
                      <>
                        <FaPoll className="w-5 h-5 text-teal-600" />
                        Vote đánh giá
                      </>
                    )}
                  </h2>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setVoteModalReviewId(null);
                      setVoteChoice(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <span className="text-lg">×</span>
                  </button>
              </div>
              
                {/* Content */}
                <div className="p-6 space-y-6">
                {currentVote && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                    <FaLightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      Bạn đã vote <span className="font-bold inline-flex items-center gap-1">
                        {currentVote === 'helpful' ? (
                          <>
                            <FaThumbsUp className="w-3 h-3" />
                            Hữu ích
                          </>
                        ) : (
                          <>
                            <FaThumbsDown className="w-3 h-3" />
                            Không hữu ích
                          </>
                        )}
                      </span>. Bạn có thể đổi sang lựa chọn khác.
                    </p>
                  </div>
                )}
                
                  <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                    disabled={currentVote === 'helpful'}
                  onClick={() => setVoteChoice('helpful')}
                    className={`px-5 py-4 rounded-xl border-2 transition-all font-semibold text-sm flex flex-col items-center gap-2 ${
                      currentVote === 'helpful' 
                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60' 
                        : voteChoice === 'helpful' 
                          ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white border-teal-600 shadow-lg scale-105' 
                          : 'border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400 hover:shadow-md'
                    }`}
                  >
                    <FaThumbsUp className="w-8 h-8" />
                    <span>Hữu ích</span>
                </button>
                <button
                  type="button"
                    disabled={currentVote === 'unhelpful'}
                  onClick={() => setVoteChoice('unhelpful')}
                    className={`px-5 py-4 rounded-xl border-2 transition-all font-semibold text-sm flex flex-col items-center gap-2 ${
                      currentVote === 'unhelpful' 
                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60' 
                        : voteChoice === 'unhelpful' 
                          ? 'bg-gradient-to-br from-gray-600 to-gray-700 text-white border-gray-700 shadow-lg scale-105' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
                    }`}
                  >
                    <FaThumbsDown className="w-8 h-8" />
                    <span>Không hữu ích</span>
                </button>
              </div>
                
                  <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setVoteModalReviewId(null); setVoteChoice(null); }}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!user || !voteChoice}
                      className={`flex-1 px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      (!user || !voteChoice) 
                          ? 'bg-gray-200 text-gray-400' 
                          : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                  onClick={async () => {
                    if (!user || !voteChoice) return;
                    const reviewId = voteModalReviewId as number;
                    try {
                        const response = await voteReview(reviewId, Number((user as any).userId ?? (user as any).id), voteChoice === 'helpful');
                        
                        // Update local state with response from backend
                      setCards(prev => prev.map(c => {
                        if (c.reviewId !== reviewId) return c;
                          return {
                            ...c,
                            votesHelpful: response.votesHelpful ?? c.votesHelpful,
                            votesUnhelpful: response.votesUnhelpful ?? c.votesUnhelpful,
                            myVote: voteChoice
                          };
                        }));
                        showSuccess('Thành công', currentVote ? 'Đã thay đổi vote thành công!' : 'Đã gửi vote thành công!');
                      setVoteModalReviewId(null);
                      setVoteChoice(null);
                    } catch (err: any) {
                        const errorMsg = extractApiErrorMessage(err);
                        showError('Lỗi', errorMsg);
                    }
                  }}
                >
                    {currentVote ? 'Thay đổi vote' : 'Gửi vote'}
                </button>
                  </div>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </section>
  )
}