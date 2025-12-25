import api from './api';

export interface Schedule {
  id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start_time: string;
  end_time: string;
  room: string | null;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleCreate {
  class_id: number;
  subject_id: number;
  teacher_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string;
  effective_from: string;
  effective_to?: string;
}

export const scheduleService = {
  async getAll(params?: { class_id?: number; teacher_id?: number; day_of_week?: string }): Promise<Schedule[]> {
    const response = await api.get<Schedule[]>('/schedules', { params });
    return response.data;
  },

  async getMy(): Promise<Schedule[]> {
    const response = await api.get<Schedule[]>('/schedules/my');
    return response.data;
  },

  async create(data: ScheduleCreate): Promise<Schedule> {
    const response = await api.post<Schedule>('/schedules', data);
    return response.data;
  },

  async update(id: number, data: Partial<ScheduleCreate>): Promise<Schedule> {
    const response = await api.put<Schedule>(`/schedules/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/schedules/${id}`);
  },
};

export default scheduleService;
