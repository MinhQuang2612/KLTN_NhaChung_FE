// Legacy service - redirects to new unified posts API
import { getPosts, getPostById, createPost, updatePost, deletePost } from './posts';
import { Post } from '../types/Post';

// Legacy function names for backward compatibility
export const listRentPosts = () => getPosts({ postType: 'rent' });
export const getRentPostById = (id: number) => getPostById(id);
export const createRentPost = (data: any) => createPost(data);
export const updateRentPost = (id: number, data: any) => updatePost(id, data);
export const deleteRentPost = (id: number) => deletePost(id);
export const getUserRentPosts = (userId: number) => getPosts({ userId, postType: 'rent' });

// Legacy types
export type RentPostApi = Post;