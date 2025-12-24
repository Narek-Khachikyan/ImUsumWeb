import api from './api';
import type { BlogPost } from '../types';

/**
 * Blog service - example API service implementation
 * Replace with actual backend endpoints when available
 */
export const blogService = {
  /**
   * Get all blog posts
   */
  async getAll(): Promise<BlogPost[]> {
    const response = await api.get<BlogPost[]>('/blogs');
    return response.data;
  },

  /**
   * Get a single blog post by ID
   */
  async getById(id: number): Promise<BlogPost> {
    const response = await api.get<BlogPost>(`/blogs/${id}`);
    return response.data;
  },

  /**
   * Create a new blog post
   */
  async create(data: Omit<BlogPost, 'id'>): Promise<BlogPost> {
    const response = await api.post<BlogPost>('/blogs', data);
    return response.data;
  },

  /**
   * Update an existing blog post
   */
  async update(id: number, data: Partial<BlogPost>): Promise<BlogPost> {
    const response = await api.put<BlogPost>(`/blogs/${id}`, data);
    return response.data;
  },

  /**
   * Delete a blog post
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/blogs/${id}`);
  },
};
