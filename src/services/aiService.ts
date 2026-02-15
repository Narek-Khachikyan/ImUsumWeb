import api from './api';

export interface AiDraftQuestionOption {
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface AiDraftQuestion {
  question_text: string;
  order_index: number;
  points: number;
  options: AiDraftQuestionOption[];
}

export interface GenerateTestDraftResponse {
  workflow_id: number;
  workflow_type: 'TEST_GENERATION';
  status: 'DRAFT';
  questions: AiDraftQuestion[];
  created_at: string;
}

export interface OptimizeScheduleDraftResponse {
  workflow_id: number;
  workflow_type: 'SCHEDULE_OPTIMIZATION';
  status: 'DRAFT';
  class_id: number;
  draft: {
    rationale: string;
    updates: Array<{
      schedule_id: number;
      day_of_week: string;
      start_time: string;
      end_time: string;
      room: string | null;
      teacher_id: number;
    }>;
  };
}

export interface ApplyScheduleWorkflowResponse {
  workflow_id: number;
  status: 'APPLIED';
  updated_schedules: Array<{
    id: number;
    class_id: number;
    subject_id: number;
    teacher_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room: string | null;
    effective_from: string;
    effective_to: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

export const aiService = {
  async generateTestDraft(payload: {
    topic: string;
    question_count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    subject_id?: number;
    class_id?: number;
  }): Promise<GenerateTestDraftResponse> {
    const response = await api.post<GenerateTestDraftResponse>('/ai/tests/generate-draft', payload);
    return response.data;
  },

  async optimizeScheduleDraft(payload: { class_id: number }): Promise<OptimizeScheduleDraftResponse> {
    const response = await api.post<OptimizeScheduleDraftResponse>('/ai/schedules/optimize-draft', payload);
    return response.data;
  },

  async applyScheduleWorkflow(workflowId: number): Promise<ApplyScheduleWorkflowResponse> {
    const response = await api.post<ApplyScheduleWorkflowResponse>(`/ai/schedules/workflows/${workflowId}/apply`);
    return response.data;
  },
};

export default aiService;
