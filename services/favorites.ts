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
  // TODO: API endpoint có thể gây lỗi "Invalid user ID"
  return [];
  // const allFavorites = await apiGet('favourites');
  // return allFavorites.filter((fav: Favorite) => fav.userId === userId);
}

/**
 * Add to favorites
 */
export async function addToFavorites(request: AddFavoriteRequest): Promise<Favorite> {
  // TODO: API endpoint có thể gây lỗi
  throw new Error("API endpoint chưa được implement");
  // return apiPost('favourites', request);
}

/**
 * Remove from favorites
 */
export async function removeFromFavorites(userId: number, postType: 'rent' | 'roommate', postId: number): Promise<void> {
  // TODO: API endpoint có thể gây lỗi
  throw new Error("API endpoint chưa được implement");
  // return apiDel(`favourites/user/${userId}/post/${postType}/${postId}`);
}

/**
 * Check if a post is favorited by user
 */
export function isFavorited(favorites: Favorite[], postType: 'rent' | 'roommate', postId: number): boolean {
  return favorites.some(fav => fav.postType === postType && fav.postId === postId);
}
