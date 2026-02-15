import api from './api';

export interface JobPosting {
  id: number;
  title: string;
  description: string;
  company_name: string;
  contact_email: string | null;
  external_url: string | null;
  is_active: boolean;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
}

export interface JobEligibility {
  eligible: boolean;
  source: 'auto' | 'manual_override';
  average_grade: number | null;
  grade_count: number;
  threshold: number;
  lookback_days: number;
  minimum_grades: number;
  reason: string;
}

export type JobApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface JobApplication {
  id: number;
  job_posting_id: number;
  student_id: number;
  status: JobApplicationStatus;
  cover_letter: string | null;
  created_at: string;
  updated_at: string;
  job_posting?: {
    id: number;
    title: string;
    company_name: string;
    is_active: boolean;
  };
}

export const jobsService = {
  async list(isActive?: boolean): Promise<JobPosting[]> {
    const response = await api.get<JobPosting[]>('/jobs', {
      params: isActive === undefined ? undefined : { is_active: isActive },
    });
    return response.data;
  },

  async getMyEligibility(): Promise<JobEligibility> {
    const response = await api.get<JobEligibility>('/jobs/eligibility/me');
    return response.data;
  },

  async apply(jobId: number, coverLetter?: string): Promise<JobApplication> {
    const response = await api.post<JobApplication>(`/jobs/${jobId}/apply`, {
      ...(coverLetter ? { cover_letter: coverLetter } : {}),
    });
    return response.data;
  },

  async getMyApplications(): Promise<JobApplication[]> {
    const response = await api.get<JobApplication[]>('/jobs/my/applications');
    return response.data;
  },

  async create(data: {
    title: string;
    description: string;
    company_name: string;
    contact_email?: string;
    external_url?: string;
    is_active?: boolean;
  }): Promise<JobPosting> {
    const response = await api.post<JobPosting>('/jobs', data);
    return response.data;
  },

  async update(jobId: number, data: Partial<JobPosting>): Promise<JobPosting> {
    const response = await api.put<JobPosting>(`/jobs/${jobId}`, data);
    return response.data;
  },

  async remove(jobId: number): Promise<void> {
    await api.delete(`/jobs/${jobId}`);
  },

  async setEligibilityOverride(studentId: number, eligible: boolean, reason?: string) {
    const response = await api.put(`/jobs/eligibility/${studentId}`, {
      eligible,
      ...(reason ? { reason } : {}),
    });
    return response.data;
  },
};

export default jobsService;
