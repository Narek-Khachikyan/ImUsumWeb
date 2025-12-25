import api from './api';
import type { User } from '@/types';

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  school_id?: number;
}

export const userService = {
  async getAll(params?: { skip?: number; limit?: number; role?: string }): Promise<User[]> {
    const response = await api.get<User[]>('/users', { params });
    return response.data;
  },

  async getById(id: number): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async update(id: number, data: UserUpdate): Promise<User> {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async updateRole(id: number, role: string): Promise<User> {
    const response = await api.put<User>(`/users/${id}/role`, null, { params: { role } });
    return response.data;
  },
};

export default userService;
