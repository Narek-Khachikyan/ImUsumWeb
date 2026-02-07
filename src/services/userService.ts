import api from './api';
import type { User, UserAdminUpdate, UserCreateRequest } from '@/types';

export const userService = {
  async getAll(params?: { skip?: number; limit?: number; role?: string }): Promise<User[]> {
    const response = await api.get<User[]>('/users', { params });
    return response.data;
  },

  async getById(id: number): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async create(data: UserCreateRequest): Promise<User> {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  async update(id: number, data: UserAdminUpdate): Promise<User> {
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
