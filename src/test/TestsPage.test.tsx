import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TestsPage from '@/pages/Dashboard/TestsPage';
import type { TestAnalytics, TestAttempt, TestAttemptResponse, TestDetail, TestListItem } from '@/services/testService';

const mockUseAuth = vi.fn();
const mockDispatch = vi.fn();

const mockFetchMyTests = vi.fn(() => ({ type: 'fetchMyTests' }));
const mockFetchTestById = vi.fn((payload: unknown) => ({ type: 'fetchTestById', payload }));
const mockCreateTest = vi.fn((payload: unknown) => ({ type: 'createTest', payload }));
const mockUpdateTest = vi.fn((payload: unknown) => ({ type: 'updateTest', payload }));
const mockDeleteTest = vi.fn((payload: unknown) => ({ type: 'deleteTest', payload }));
const mockPublishTest = vi.fn((payload: unknown) => ({ type: 'publishTest', payload }));
const mockUnpublishTest = vi.fn((payload: unknown) => ({ type: 'unpublishTest', payload }));
const mockCreateTestQuestions = vi.fn((payload: unknown) => ({ type: 'createTestQuestions', payload }));
const mockUpdateTestQuestion = vi.fn((payload: unknown) => ({ type: 'updateTestQuestion', payload }));
const mockDeleteTestQuestion = vi.fn((payload: unknown) => ({ type: 'deleteTestQuestion', payload }));
const mockSubmitTest = vi.fn((payload: unknown) => ({ type: 'submitTest', payload }));
const mockFetchMyTestAttempt = vi.fn((payload: unknown) => ({ type: 'fetchMyTestAttempt', payload }));
const mockFetchTestResults = vi.fn((payload: unknown) => ({ type: 'fetchTestResults', payload }));
const mockFetchTestAnalytics = vi.fn((payload: unknown) => ({ type: 'fetchTestAnalytics', payload }));

interface MockState {
  test: {
    myTests: TestListItem[];
    currentTest: TestDetail | null;
    attempt: TestAttemptResponse | null;
    results: TestAttempt[];
    analytics: TestAnalytics | null;
    isLoading: boolean;
    error: string | null;
  };
}

let mockState: MockState;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/app/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: MockState) => unknown) => selector(mockState),
}));

vi.mock('@/app/slices/testSlice', () => ({
  fetchMyTests: () => mockFetchMyTests(),
  fetchTestById: (payload: unknown) => mockFetchTestById(payload),
  createTest: (payload: unknown) => mockCreateTest(payload),
  updateTest: (payload: unknown) => mockUpdateTest(payload),
  deleteTest: (payload: unknown) => mockDeleteTest(payload),
  publishTest: (payload: unknown) => mockPublishTest(payload),
  unpublishTest: (payload: unknown) => mockUnpublishTest(payload),
  createTestQuestions: (payload: unknown) => mockCreateTestQuestions(payload),
  updateTestQuestion: (payload: unknown) => mockUpdateTestQuestion(payload),
  deleteTestQuestion: (payload: unknown) => mockDeleteTestQuestion(payload),
  submitTest: (payload: unknown) => mockSubmitTest(payload),
  fetchMyTestAttempt: (payload: unknown) => mockFetchMyTestAttempt(payload),
  fetchTestResults: (payload: unknown) => mockFetchTestResults(payload),
  fetchTestAnalytics: (payload: unknown) => mockFetchTestAnalytics(payload),
  clearCurrentTest: () => ({ type: 'clearCurrentTest' }),
  clearTestError: () => ({ type: 'clearTestError' }),
}));

function buildListItem(overrides: Partial<TestListItem> = {}): TestListItem {
  return {
    id: 1,
    title: 'Math Test',
    description: 'Unit 1',
    subject_id: 2,
    class_id: 1,
    teacher_id: 1,
    due_date: '2026-02-20T10:00:00.000Z',
    is_published: true,
    created_at: '2026-02-07T10:00:00.000Z',
    updated_at: '2026-02-07T10:00:00.000Z',
    questions_count: 1,
    attempts_count: 0,
    is_closed: false,
    attempt: null,
    ...overrides,
  };
}

function buildDetail(overrides: Partial<TestDetail> = {}): TestDetail {
  return {
    id: 1,
    title: 'Math Test',
    description: 'Unit 1',
    subject_id: 2,
    class_id: 1,
    teacher_id: 1,
    due_date: '2026-02-20T10:00:00.000Z',
    is_published: true,
    created_at: '2026-02-07T10:00:00.000Z',
    updated_at: '2026-02-07T10:00:00.000Z',
    questions: [
      {
        id: 101,
        test_id: 1,
        question_text: '2 + 2 = ?',
        order_index: 1,
        points: 5,
        created_at: '2026-02-07T10:00:00.000Z',
        updated_at: '2026-02-07T10:00:00.000Z',
        options: [
          { id: 501, question_id: 101, option_text: '3', order_index: 1 },
          { id: 502, question_id: 101, option_text: '4', order_index: 2 },
          { id: 503, question_id: 101, option_text: '5', order_index: 3 },
          { id: 504, question_id: 101, option_text: '6', order_index: 4 },
        ],
      },
    ],
    ...overrides,
  };
}

function setState(overrides: Partial<MockState['test']> = {}) {
  mockState = {
    test: {
      myTests: [],
      currentTest: null,
      attempt: null,
      results: [],
      analytics: null,
      isLoading: false,
      error: null,
      ...overrides,
    },
  };
}

describe('TestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch.mockImplementation((action: { payload?: unknown }) => ({
      unwrap: () => Promise.resolve(action?.payload),
    }));
    setState();
  });

  it('student submits test with selected answer', async () => {
    const listItem = buildListItem();
    setState({ myTests: [listItem], currentTest: buildDetail() });
    mockUseAuth.mockReturnValue({ user: { id: 5, role: 'student' } });

    const user = userEvent.setup();
    render(<TestsPage />);

    await user.click(screen.getByRole('button', { name: 'Անցնել թեստը' }));
    await user.click(screen.getByLabelText('4'));
    await user.click(screen.getByRole('button', { name: 'Հանձնել թեստը' }));

    await waitFor(() => {
      expect(mockSubmitTest).toHaveBeenCalledWith({
        testId: 1,
        data: {
          answers: [{ question_id: 101, selected_option_id: 502 }],
        },
      });
    });
  });

  it('student sees attempt score in 10-point format', () => {
    const listItem = buildListItem({
      attempt: {
        id: 301,
        test_id: 1,
        student_id: 5,
        submitted_at: '2026-02-08T10:00:00.000Z',
        score_points: 8,
        max_points: 10,
        percentage: 80,
        created_at: '2026-02-08T10:00:00.000Z',
        updated_at: '2026-02-08T10:00:00.000Z',
      },
    });
    setState({ myTests: [listItem] });
    mockUseAuth.mockReturnValue({ user: { id: 5, role: 'student' } });

    render(<TestsPage />);

    expect(screen.getByText('Արդյունք: 8/10')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('student sees personal recommendations in attempt modal', async () => {
    const listItem = buildListItem({
      attempt: {
        id: 301,
        test_id: 1,
        student_id: 5,
        submitted_at: '2026-02-08T10:00:00.000Z',
        score_points: 7,
        max_points: 10,
        percentage: 78,
        created_at: '2026-02-08T10:00:00.000Z',
        updated_at: '2026-02-08T10:00:00.000Z',
      },
    });

    setState({
      myTests: [listItem],
      attempt: {
        attempt: listItem.attempt!,
        answers: [
          {
            id: 11,
            attempt_id: 301,
            question_id: 101,
            selected_option_id: 501,
            is_correct: false,
            awarded_points: 0,
            question_text: '2 + 2 = ?',
            selected_option_text: '3',
            correct_option_text: '4',
          },
        ],
        recommendations: {
          level: 'good',
          summary: 'Լավ արդյունք է․ պահպանիր տեմպը և ամրապնդիր դժվար հարցերի թեմաները։',
          recommended_difficulty: 'medium',
          action_items: ['Քայլ 1', 'Քայլ 2', 'Քայլ 3'],
          focus_questions: [
            {
              question_id: 101,
              question_text: '2 + 2 = ?',
              selected_option_text: '3',
              correct_option_text: '4',
              points_lost: 5,
            },
          ],
          subject_context: {
            average_grade: 7.5,
            trend: 'up',
          },
        },
      },
    });
    mockUseAuth.mockReturnValue({ user: { id: 5, role: 'student' } });

    const user = userEvent.setup();
    render(<TestsPage />);

    await user.click(screen.getByRole('button', { name: 'Դիտել արդյունքը' }));

    expect(await screen.findByText('Անհատական առաջարկներ')).toBeInTheDocument();
    expect(screen.getByText('Քայլ 1')).toBeInTheDocument();
    expect(screen.getAllByText('Ճիշտ պատասխանը: 4').length).toBeGreaterThan(0);
  });

  it('attempt modal falls back gracefully when recommendations are missing', async () => {
    const listItem = buildListItem({
      attempt: {
        id: 302,
        test_id: 1,
        student_id: 5,
        submitted_at: '2026-02-08T11:00:00.000Z',
        score_points: 8,
        max_points: 10,
        percentage: 80,
        created_at: '2026-02-08T11:00:00.000Z',
        updated_at: '2026-02-08T11:00:00.000Z',
      },
    });

    setState({
      myTests: [listItem],
      attempt: {
        attempt: listItem.attempt!,
        answers: [
          {
            id: 12,
            attempt_id: 302,
            question_id: 102,
            selected_option_id: 602,
            is_correct: true,
            awarded_points: 5,
            question_text: '3 + 3 = ?',
            selected_option_text: '6',
          },
        ],
      },
    });
    mockUseAuth.mockReturnValue({ user: { id: 5, role: 'student' } });

    const user = userEvent.setup();
    render(<TestsPage />);

    await user.click(screen.getByRole('button', { name: 'Դիտել արդյունքը' }));

    expect(await screen.findByText('Արդյունք')).toBeInTheDocument();
    expect(screen.queryByText('Անհատական առաջարկներ')).not.toBeInTheDocument();
    expect(screen.getByText('Ձեր պատասխանը: 6')).toBeInTheDocument();
  });

  it('teacher creates test from modal', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, role: 'teacher' } });

    const user = userEvent.setup();
    render(<TestsPage />);

    await user.click(screen.getByRole('button', { name: '+ Ստեղծել թեստ' }));
    await user.type(screen.getByLabelText('Վերնագիր'), 'Physics Test');
    await user.type(screen.getByLabelText('Առարկայի ID'), '5');
    await user.type(screen.getByLabelText('Դասարանի ID'), '7');
    await user.click(screen.getByRole('button', { name: 'Պահպանել' }));

    await waitFor(() => {
      expect(mockCreateTest).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Physics Test',
          subject_id: 5,
          class_id: 7,
        })
      );
    });
  });

  it('teacher adds question in builder', async () => {
    const listItem = buildListItem();
    setState({ myTests: [listItem], currentTest: buildDetail({ questions: [] }) });
    mockUseAuth.mockReturnValue({ user: { id: 1, role: 'teacher' } });

    const user = userEvent.setup();
    render(<TestsPage />);

    await user.click(screen.getByRole('button', { name: 'Կառավարել հարցերը' }));
    await user.type(screen.getByLabelText('Հարց'), 'Capital of Armenia?');
    await user.type(screen.getByLabelText('Հերթական համար'), '1');
    await user.clear(screen.getByLabelText('Միավորներ'));
    await user.type(screen.getByLabelText('Միավորներ'), '3');

    const optionInputs = screen.getAllByPlaceholderText(/Տարբերակ/);
    expect(optionInputs).toHaveLength(4);
    await user.type(optionInputs[0]!, 'Tbilisi');
    await user.type(optionInputs[1]!, 'Yerevan');
    await user.type(optionInputs[2]!, 'Baku');
    await user.type(optionInputs[3]!, 'Paris');

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThan(1);
    await user.click(radios[1]!);

    await user.click(screen.getByRole('button', { name: 'Ավելացնել հարցը' }));

    await waitFor(() => {
      expect(mockCreateTestQuestions).toHaveBeenCalledWith(
        expect.objectContaining({
          testId: 1,
        })
      );
    });
  });

  it('teacher opens insights and requests results + analytics', async () => {
    const listItem = buildListItem();
    setState({ myTests: [listItem] });
    mockUseAuth.mockReturnValue({ user: { id: 1, role: 'teacher' } });

    const user = userEvent.setup();
    render(<TestsPage />);

    await user.click(screen.getByRole('button', { name: 'Արդյունքներ / Analytics' }));

    await waitFor(() => {
      expect(mockFetchTestResults).toHaveBeenCalledWith(1);
      expect(mockFetchTestAnalytics).toHaveBeenCalledWith(1);
    });
  });
});
