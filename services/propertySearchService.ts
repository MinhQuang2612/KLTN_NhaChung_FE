// Service chung để xử lý search properties - Single Source of Truth
// Được gọi từ SearchDetails component, kết quả được emit cho PropertyList

import { searchNLP, searchPosts as searchPostsFallback, NlpSearchItem } from './nlpSearch';
import { getRoomById } from './rooms';
import { searchPostToUnified, UnifiedPost } from '@/types/MixedPosts';
import { getMyProfile, UserProfile } from './userProfiles';
import { searchPosts } from './posts';
import { rankPosts, PostRankingOptions } from './postRanking';
import { checkMultiplePostsVisibility } from '@/utils/roomVisibility';
import { extractApiErrorMessage } from '@/utils/api';

export interface SearchOptions {
  signal?: AbortSignal | null;
  currentProfile?: UserProfile | null;
  user?: any;
  loadSuggestions?: boolean;
}

export interface SearchResult {
  items: UnifiedPost[];
  suggestions?: UnifiedPost[];
  error?: string;
  query: string;
}

/**
 * Load suggestions theo profile (dùng khi không có query)
 */
async function loadSuggestions(
  currentProfile: UserProfile | null,
  user: any,
  options: { limit?: number } = {}
): Promise<UnifiedPost[]> {
  const { limit = 24 } = options;
  
  try {
    const response = await searchPosts({ status: 'active' as any });
    const allPosts = Array.isArray(response)
      ? response
      : Array.isArray(response?.posts)
      ? response.posts
      : [];

    const onlyActive = allPosts.filter((p: any) => (p?.status || '').toLowerCase() === 'active');

    // Fetch room data for all posts
    const roomDataMap: Record<string, any> = {};
    await Promise.all(
      onlyActive
        .filter(post => post.roomId)
        .map(async (post: any) => {
          try {
            const roomData = await getRoomById(post.roomId);
            roomDataMap[post.roomId] = roomData;
          } catch (error) {
            // Skip nếu không load được room data
          }
        })
    );

    // Filter posts based on room visibility
    const visibilityResults = checkMultiplePostsVisibility(onlyActive, roomDataMap);
    const visiblePosts = visibilityResults
      .filter(result => result.shouldShow)
      .map(result => result.post);

    // Convert to unified format
    const unified = await Promise.all(
      visiblePosts.map(async (post: any) => {
        const roomData = roomDataMap[post.roomId] || null;
        return searchPostToUnified(post, roomData);
      })
    );

    // Rank theo profile
    const selectedCityLS = (typeof window !== 'undefined') ? localStorage.getItem('selectedCity') || '' : '';
    const userCity = (user as any)?.address?.city || (user as any)?.city || '';

    const rankingOptions: PostRankingOptions = {
      userCity,
      profileCity: currentProfile?.preferredCity,
      selectedCity: selectedCityLS,
      strictCityFilter: false
    };

    const { ranked } = rankPosts(unified, currentProfile, rankingOptions);
    return ranked.slice(0, limit).map(({ _score, _price, _cityMatch, _cityScore, ...rest }) => rest as any);
  } catch (error) {
    return [];
  }
}

/**
 * Convert raw posts từ API thành UnifiedPost format
 */
function convertPostsToUnified(
  posts: any[],
  roomDataMap: Record<string, any>
): UnifiedPost[] {
  const visibilityResults = checkMultiplePostsVisibility(posts, roomDataMap);
  const visiblePosts = visibilityResults
    .filter((result: any) => result.shouldShow)
    .map((result: any) => result.post);

  return visiblePosts.map((post: any) => {
    const mappedPostType = post.postType === 'cho-thue' ? 'rent' : 
                           post.postType === 'tim-o-ghep' ? 'roommate' : post.postType;
    
    const roomData = roomDataMap[post.roomId];
    const distance = (post as NlpSearchItem)?.distance;
    const score = (post as NlpSearchItem)?.score;
    
    let price = 0;
    let area = 0;
    let location = 'Chưa xác định';
    let address = undefined;
    let bedrooms = undefined;
    let bathrooms = undefined;
    let images = post.images || [];
    
    if (roomData) {
      price = roomData.price || 0;
      area = roomData.area || 0;
      location = roomData.address ? 
        `${roomData.address.ward}, ${roomData.address.city}` : 
        'Chưa xác định';
      address = roomData.address;
      images = roomData.images?.length > 0 ? roomData.images : (post.images || []);
      
      // Chỉ lấy bedrooms/bathrooms cho chung cư và nhà nguyên căn
      const roomType = roomData.roomType || post.category || '';
      const isPhongTro = roomType === 'phong-tro' || post.category === 'phong-tro';
      if (!isPhongTro) {
        bedrooms = roomData.chungCuInfo?.bedrooms || roomData.nhaNguyenCanInfo?.bedrooms;
        bathrooms = roomData.chungCuInfo?.bathrooms || roomData.nhaNguyenCanInfo?.bathrooms;
      }
    }
    
    const finalCategory = post.category || mappedPostType;
    return {
      id: post.postId,
      type: mappedPostType as 'rent' | 'roommate',
      title: post.title || 'Không có tiêu đề',
      description: post.description || 'Không có mô tả',
      images: images,
      price: price,
      area: area,
      location: location,
      address: address,
      category: finalCategory,
      photoCount: images.length + (post.videos?.length || 0),
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      isVerified: false,
      createdAt: post.createdAt,
      originalData: { ...post, distance, score }
    };
  });
}

/**
 * Search properties với query - Main search function
 * Được gọi từ SearchDetails, kết quả được emit cho PropertyList
 */
export async function searchProperties(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const { signal, currentProfile, user, loadSuggestions: shouldLoadSuggestions = false } = options;
  
  try {
    let items: any[] = [];
    let suggestionsPromise: Promise<UnifiedPost[]> | null = null;
    
    // Load suggestions song song nếu cần (để fallback khi search không ra)
    if (shouldLoadSuggestions) {
      suggestionsPromise = loadSuggestions(currentProfile || null, user, { limit: 24 });
    }
    
    if (query.trim()) {
      // Có query: search NLP
      try {
        const data = await searchNLP(query, { signal: signal || undefined });
        items = Array.isArray(data?.items) ? data.items : [];
      } catch (e: any) {
        // Fallback sang search/posts khi lỗi mạng/timeout
        try {
          const curUrl = new URL((typeof window !== 'undefined') ? window.location.href : 'http://localhost');
          const fallbackParams: Record<string, string> = { q: query };
          const roommate = curUrl.searchParams.get('roommate') || '';
          const searcherGender = curUrl.searchParams.get('searcherGender') || '';
          if (roommate) fallbackParams.roommate = roommate;
          if (searcherGender) fallbackParams.searcherGender = searcherGender;
          const fb = await searchPostsFallback(fallbackParams);
          items = Array.isArray((fb as any)?.items) ? (fb as any).items : [];
        } catch (e2: any) {
          const status = (e2 as any)?.status;
          if (status === 400) {
            return {
              items: [],
              query,
              error: "Vui lòng nhập truy vấn để tìm kiếm."
            };
          }
          return {
            items: [],
            query,
            error: extractApiErrorMessage(e2)
          };
        }
      }
    } else {
      // Không có query: load suggestions theo profile
      const suggestions = await loadSuggestions(currentProfile || null, user, { limit: 24 });
      items = suggestions;
    }
    
    // Convert items to unified format
    let unifiedPosts: UnifiedPost[] = [];
    
    // Nếu items đã là UnifiedPost (từ Suggestions logic), dùng trực tiếp
    if (items.length > 0 && (items[0] as any)?.type) {
      unifiedPosts = items as UnifiedPost[];
    } else {
      // Nếu items là raw posts (từ NLP/fallback), cần convert
      const roomDataMap: Record<string, any> = {};
      await Promise.all(
        items
          .filter((post: any) => post.roomId)
          .map(async (post: any) => {
            try {
              const roomData = await getRoomById(post.roomId);
              roomDataMap[post.roomId] = roomData;
            } catch (error) {
              // Skip nếu không load được room data
            }
          })
      );
      
      unifiedPosts = convertPostsToUnified(items, roomDataMap);
    }
    
    // Nếu search không ra kết quả và có suggestions, dùng suggestions
    let suggestions: UnifiedPost[] = [];
    if (query.trim() && unifiedPosts.length === 0) {
      if (shouldLoadSuggestions && suggestionsPromise) {
        try {
          suggestions = await suggestionsPromise;
          if (suggestions.length > 0) {
            unifiedPosts = suggestions;
          }
        } catch {
          // Ignore
        }
      }
    } else if (shouldLoadSuggestions && suggestionsPromise) {
      // Load suggestions để cache
      try {
        suggestions = await suggestionsPromise;
      } catch {
        // Ignore
      }
    }
    
    return {
      items: unifiedPosts,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      query
    };
  } catch (e: any) {
    return {
      items: [],
      query,
      error: extractApiErrorMessage(e)
    };
  }
}

/**
 * Load profile nếu cần (helper function)
 */
export async function loadProfileIfNeeded(
  user: any,
  existingProfile?: UserProfile | null
): Promise<UserProfile | null> {
  if (existingProfile) return existingProfile;
  
  try {
    if (user && (user as any)?.role !== 'landlord') {
      return (await getMyProfile()) as any;
    }
  } catch (error) {
    // Ignore
  }
  
  return null;
}

