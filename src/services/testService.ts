import api from './api';

export interface TestOption {
  id: number;
  question_id: number;
  option_text: string;
  order_index: number;
  is_correct?: boolean;
}

export interface TestQuestion {
  id: number;
  test_id: number;
  question_text: string;
  order_index: number;
  points: number;
  created_at: string;
  updated_at: string;
  options: TestOption[];
}

export interface TestAttempt {
  id: number;
  test_id: number;
  student_id: number;
  submitted_at: string;
  score_points: number;
  max_points: number;
  percentage: number;
  created_at: string;
  updated_at: string;
  student_first_name?: string | null;
  student_last_name?: string | null;
}

export interface TestAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  selected_option_id: number;
  is_correct: boolean;
  awarded_points: number;
  question_text?: string;
  selected_option_text?: string;
  correct_option_text?: string;
}

export type RecommendationLevel = 'critical' | 'improving' | 'good' | 'excellent';
export type RecommendationDifficulty = 'easy' | 'medium' | 'hard';
export type RecommendationTrend = 'up' | 'down' | 'stable' | 'insufficient_data';

export interface TestAttemptRecommendation {
  level: RecommendationLevel;
  summary: string;
  recommended_difficulty: RecommendationDifficulty;
  action_items: string[];
  focus_questions: Array<{
    question_id: number;
    question_text: string;
    selected_option_text: string;
    correct_option_text: string;
    points_lost: number;
  }>;
  subject_context: {
    average_grade: number | null;
    trend: RecommendationTrend;
  };
}

export interface TestListItem {
  id: number;
  title: string;
  description: string | null;
  subject_id: number;
  class_id: number;
  teacher_id: number;
  due_date: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  questions_count: number;
  attempts_count?: number;
  is_closed: boolean;
  attempt?: TestAttempt | null;
}

export interface TestBase {
  id: number;
  title: string;
  description: string | null;
  subject_id: number;
  class_id: number;
  teacher_id: number;
  due_date: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestDetail extends TestBase {
  questions: TestQuestion[];
  has_attempted?: boolean;
  attempt?: TestAttempt | null;
}

export interface TestCreate {
  title: string;
  description?: string;
  subject_id: number;
  class_id: number;
  due_date: string;
  is_published?: boolean;
  teacher_id?: number;
}

export interface TestUpdate {
  title?: string;
  description?: string;
  subject_id?: number;
  class_id?: number;
  due_date?: string;
}

export interface TestQuestionCreate {
  question_text: string;
  order_index?: number;
  points?: number;
  options: Array<{
    option_text: string;
    is_correct: boolean;
    order_index?: number;
  }>;
}

export interface TestQuestionUpdate {
  question_text?: string;
  order_index?: number;
  points?: number;
  options?: Array<{
    option_text: string;
    is_correct: boolean;
    order_index?: number;
  }>;
}

export interface TestSubmit {
  answers: Array<{
    question_id: number;
    selected_option_id: number;
  }>;
}

export interface TestSubmitResponse {
  attempt: TestAttempt;
  answers: TestAnswer[];
}

export interface TestAttemptResponse {
  attempt: TestAttempt;
  answers: TestAnswer[];
  recommendations?: TestAttemptRecommendation;
  recommendations_source?: 'ai' | 'rule_based';
}

export interface TestAnalytics {
  students_total: number;
  attempts_total: number;
  completion_rate: number;
  average_score: number;
  score_distribution: {
    '0_20': number;
    '21_40': number;
    '41_60': number;
    '61_80': number;
    '81_100': number;
  };
  question_stats: Array<{
    question_id: number;
    correct_rate: number;
    wrong_count: number;
  }>;
}

export const testService = {
  async getMy(): Promise<TestListItem[]> {
    const response = await api.get<TestListItem[]>('/tests/my');
    return response.data;
  },

  async getById(testId: number): Promise<TestDetail> {
    const response = await api.get<TestDetail>(`/tests/${testId}`);
    return response.data;
  },

  async create(data: TestCreate): Promise<TestBase> {
    const response = await api.post<TestBase>('/tests', data);
    return response.data;
  },

  async update(testId: number, data: TestUpdate): Promise<TestBase> {
    const response = await api.put<TestBase>(`/tests/${testId}`, data);
    return response.data;
  },

  async delete(testId: number): Promise<void> {
    await api.delete(`/tests/${testId}`);
  },

  async publish(testId: number): Promise<TestBase> {
    const response = await api.post<TestBase>(`/tests/${testId}/publish`);
    return response.data;
  },

  async unpublish(testId: number): Promise<TestBase> {
    const response = await api.post<TestBase>(`/tests/${testId}/unpublish`);
    return response.data;
  },

  async createQuestions(testId: number, questions: TestQuestionCreate[]): Promise<TestQuestion[]> {
    const response = await api.post<TestQuestion[]>(`/tests/${testId}/questions`, { questions });
    return response.data;
  },

  async updateQuestion(testId: number, questionId: number, data: TestQuestionUpdate): Promise<TestQuestion> {
    const response = await api.put<TestQuestion>(`/tests/${testId}/questions/${questionId}`, data);
    return response.data;
  },

  async deleteQuestion(testId: number, questionId: number): Promise<void> {
    await api.delete(`/tests/${testId}/questions/${questionId}`);
  },

  async submit(testId: number, data: TestSubmit): Promise<TestSubmitResponse> {
    const response = await api.post<TestSubmitResponse>(`/tests/${testId}/submit`, data);
    return response.data;
  },

  async getAttempt(testId: number): Promise<TestAttemptResponse> {
    const response = await api.get<TestAttemptResponse>(`/tests/${testId}/attempt`);
    return response.data;
  },

  async getResults(testId: number): Promise<TestAttempt[]> {
    const response = await api.get<TestAttempt[]>(`/tests/${testId}/results`);
    return response.data;
  },

  async getAnalytics(testId: number): Promise<TestAnalytics> {
    const response = await api.get<TestAnalytics>(`/tests/${testId}/analytics`);
    return response.data;
  },
};

export default testService;
