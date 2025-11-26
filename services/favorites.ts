import { apiGet, apiPost, apiDel } from "@/utils/api";

// Types cho Favorites
export interface Favorite {
  favouriteId: number;
  userId: number;
  postType: 'rent' | 'roommate';
  postId: number;
  createdAt: string;
}

export interface AddFavoriteRequest {
  userId: number;
  postType: 'rent' | 'roommate';
  postId: number;
}

/**
 * Get all favorites for a user
 */
export async function getUserFavorites(userId: number): Promise<Favorite[]> {
  const params = new URLSearchParams();
  if (userId) params.append('userId', String(userId));
  const query = params.toString();
  const res = await apiGet(`favourites${query ? `?${query}` : ''}`);
  return Array.isArray(res) ? res : (Array.isArray(res?.favourites) ? res.favourites : []);
}

/**
 * Add to favorites
 */
export async function addToFavorites(request: AddFavoriteRequest): Promise<Favorite> {
  // Use dedicated add endpoint; BE will validate and create
  const res = await apiPost('favourites', request);
  // Response can be the favourite itself or wrapper
  return (res && res.favourite) ? res.favourite : res;
}

/**
 * Remove from favorites
 */
export async function removeFromFavorites(userId: number, postType: 'rent' | 'roommate', postId: number): Promise<void> {
  await apiDel(`favourites/user/${userId}/post/${postType}/${postId}`);
}

/**
 * Check if a post is favorited by user
 */
export function isFavorited(favorites: Favorite[], postType: 'rent' | 'roommate', postId: number): boolean {
  return favorites.some(fav => fav.postType === postType && fav.postId === postId);
}
