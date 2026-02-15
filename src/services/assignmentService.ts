import api from './api';

export type AssignmentTargetScope = 'CLASS' | 'GROUPS' | 'STUDENTS';

export interface Assignment {
  id: number;
  title: string;
  description: string | null;
  assignment_type: 'individual' | 'group' | 'INDIVIDUAL' | 'GROUP' | null;
  target_scope: AssignmentTargetScope;
  target_group_ids: number[];
  target_student_ids: number[];
  subject_id: number;
  class_id: number;
  teacher_id: number;
  due_date: string;
  max_points: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignmentCreate {
  title: string;
  description?: string;
  assignment_type?: 'individual' | 'group' | 'INDIVIDUAL' | 'GROUP';
  target_scope?: AssignmentTargetScope;
  target_group_ids?: number[];
  target_student_ids?: number[];
  subject_id: number;
  class_id: number;
  due_date: string;
  // Backward-compatible field. Backend normalizes this to 10.
  max_points?: number;
  is_published?: boolean;
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  student_first_name?: string | null;
  student_last_name?: string | null;
  content: string | null;
  file_url: string | null;
  submitted_at: string | null;
  points_earned: number | null;
  feedback: string | null;
  is_graded: boolean;
}

export interface SubmissionCreate {
  content?: string;
  file_url?: string;
}

export interface SubmissionGrade {
  points_earned: number;
  feedback?: string;
}

export interface AssignmentTargetingOptions {
  groups: Array<{
    id: number;
    name: string;
    members_count: number;
  }>;
  students: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}

export const assignmentService = {
  async getAll(params?: { class_id?: number; subject_id?: number; is_published?: boolean }): Promise<Assignment[]> {
    const response = await api.get<Assignment[]>('/assignments', { params });
    return response.data;
  },

  async getMy(): Promise<Assignment[]> {
    const response = await api.get<Assignment[]>('/assignments/my');
    return response.data;
  },

  async getById(id: number): Promise<Assignment> {
    const response = await api.get<Assignment>(`/assignments/${id}`);
    return response.data;
  },

  async create(data: AssignmentCreate): Promise<Assignment> {
    const response = await api.post<Assignment>('/assignments', data);
    return response.data;
  },

  async update(id: number, data: Partial<AssignmentCreate>): Promise<Assignment> {
    const response = await api.put<Assignment>(`/assignments/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/assignments/${id}`);
  },

  async submit(assignmentId: number, data: SubmissionCreate): Promise<Submission> {
    const response = await api.post<Submission>(`/assignments/${assignmentId}/submit`, data);
    return response.data;
  },

  async getSubmissions(assignmentId: number): Promise<Submission[]> {
    const response = await api.get<Submission[]>(`/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  async getMySubmissions(): Promise<Submission[]> {
    const response = await api.get<Submission[]>('/assignments/my/submissions');
    return response.data;
  },

  async gradeSubmission(assignmentId: number, submissionId: number, data: SubmissionGrade): Promise<Submission> {
    const response = await api.put<Submission>(`/assignments/${assignmentId}/submissions/${submissionId}`, data);
    return response.data;
  },

  async getTargetingOptions(classId: number): Promise<AssignmentTargetingOptions> {
    const response = await api.get<AssignmentTargetingOptions>('/assignments/targeting-options', {
      params: { class_id: classId },
    });
    return response.data;
  },
};

export default assignmentService;
