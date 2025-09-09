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
  return apiGet(`favourites?userId=${userId}`);
}

/**
 * Add to favorites
 */
export async function addToFavorites(request: AddFavoriteRequest): Promise<Favorite> {
  return apiPost('favourites', request);
}

/**
 * Remove from favorites
 */
export async function removeFromFavorites(userId: number, postType: 'rent' | 'roommate', postId: number): Promise<void> {
  return apiDel(`favourites/user/${userId}/post/${postType}/${postId}`);
}

/**
 * Check if a post is favorited by user
 */
export function isFavorited(favorites: Favorite[], postType: 'rent' | 'roommate', postId: number): boolean {
  return favorites.some(fav => fav.postType === postType && fav.postId === postId);
}
