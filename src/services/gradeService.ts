import api from './api';

export interface Grade {
  id: number;
  student_id: number;
  subject_id: number;
  teacher_id: number;
  grade_value: number;
  max_value: number;
  grade_type: string;
  reference_id: number | null;
  date: string;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface GradeCreate {
  student_id: number;
  subject_id: number;
  grade_value: number;
  max_value?: number;
  grade_type: string;
  reference_id?: number;
  date: string;
  comment?: string;
}

export interface GradeSummary {
  subject_id: number;
  subject_name: string;
  average: number;
  total_grades: number;
  highest: number;
  lowest: number;
}

export const gradeService = {
  async getAll(params?: { student_id?: number; subject_id?: number }): Promise<Grade[]> {
    const response = await api.get<Grade[]>('/grades', { params });
    return response.data;
  },

  async getMy(subject_id?: number): Promise<Grade[]> {
    const response = await api.get<Grade[]>('/grades/my', { params: { subject_id } });
    return response.data;
  },

  async getSummary(): Promise<GradeSummary[]> {
    const response = await api.get<GradeSummary[]>('/grades/summary');
    return response.data;
  },

  async create(data: GradeCreate): Promise<Grade> {
    const response = await api.post<Grade>('/grades', data);
    return response.data;
  },

  async update(id: number, data: Partial<GradeCreate>): Promise<Grade> {
    const response = await api.put<Grade>(`/grades/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/grades/${id}`);
  },
};

export default gradeService;
