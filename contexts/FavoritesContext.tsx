"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Favorite, getUserFavorites, addToFavorites, removeFromFavorites, isFavorited } from '../services/favorites';

interface FavoritesContextType {
  favorites: Favorite[];
  loading: boolean;
  isFavorited: (postType: 'rent' | 'roommate', postId: number) => boolean;
  toggleFavorite: (postType: 'rent' | 'roommate', postId: number) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  // Load favorites when user changes
  useEffect(() => {
    if (user?.userId) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [user?.userId]);

  const loadFavorites = async () => {
    if (!user?.userId) return;
    
    try {
      setLoading(true);
      const userFavorites = await getUserFavorites(user.userId);
      setFavorites(userFavorites || []);
    } catch (error) {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const checkIsFavorited = (postType: 'rent' | 'roommate', postId: number): boolean => {
    return isFavorited(favorites, postType, postId);
  };

  const toggleFavorite = async (postType: 'rent' | 'roommate', postId: number) => {
    if (!user?.userId) {
      alert('Vui lòng đăng nhập để sử dụng tính năng yêu thích');
      if (typeof window !== 'undefined') window.location.href = '/login';
      return;
    }

    try {
      if (checkIsFavorited(postType, postId)) {
        // Remove from favorites
        await removeFromFavorites(user.userId, postType, postId);
        setFavorites(prev => prev.filter(fav => !(fav.postType === postType && fav.postId === postId)));
      } else {
        // Add to favorites
        const newFavorite = await addToFavorites({
          userId: user.userId,
          postType,
          postId
        });
        setFavorites(prev => [...prev, newFavorite]);
      }
    } catch (error: any) {
      const msg = error?.message || '';
      if (error?.status === 401 || /unauthorized/i.test(msg)) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để dùng Yêu thích.');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return;
      }
      alert('Có lỗi xảy ra khi thêm/xóa yêu thích: ' + msg);
    }
  };

  const refreshFavorites = async () => {
    await loadFavorites();
  };

  return (
    <div suppressHydrationWarning={true}>
      <FavoritesContext.Provider 
        value={{
          favorites,
          loading,
          isFavorited: checkIsFavorited,
          toggleFavorite,
          refreshFavorites
        }}
      >
        {children}
      </FavoritesContext.Provider>
    </div>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
