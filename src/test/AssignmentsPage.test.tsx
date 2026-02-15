import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AssignmentsPage from '@/pages/Dashboard/AssignmentsPage';
import type { Assignment, Submission } from '@/services/assignmentService';

const mockUseAuth = vi.fn();
const mockDispatch = vi.fn();
let mockState: {
  assignment: {
    assignments: Assignment[];
    myAssignments: Assignment[];
    currentAssignment: Assignment | null;
    submissions: Submission[];
    mySubmissions: Submission[];
    mySubmissionByAssignmentId: Record<number, Submission>;
    isLoading: boolean;
    error: string | null;
  };
};

const mockCreateAssignment = vi.fn((payload: unknown) => ({ type: 'createAssignment', payload }));
const mockDeleteAssignment = vi.fn((payload: unknown) => ({ type: 'deleteAssignment', payload }));
const mockFetchMyAssignments = vi.fn(() => ({ type: 'fetchMyAssignments' }));
const mockFetchMySubmissions = vi.fn(() => ({ type: 'fetchMySubmissions' }));
const mockFetchSubmissions = vi.fn((payload: unknown) => ({ type: 'fetchSubmissions', payload }));
const mockGradeSubmission = vi.fn((payload: unknown) => ({ type: 'gradeSubmission', payload }));
const mockSubmitAssignment = vi.fn((payload: unknown) => ({ type: 'submitAssignment', payload }));
const mockUpdateAssignment = vi.fn((payload: unknown) => ({ type: 'updateAssignment', payload }));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/app/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

vi.mock('@/app/slices/assignmentSlice', () => ({
  createAssignment: (payload: unknown) => mockCreateAssignment(payload),
  deleteAssignment: (payload: unknown) => mockDeleteAssignment(payload),
  fetchMyAssignments: () => mockFetchMyAssignments(),
  fetchMySubmissions: () => mockFetchMySubmissions(),
  fetchSubmissions: (payload: unknown) => mockFetchSubmissions(payload),
  gradeSubmission: (payload: unknown) => mockGradeSubmission(payload),
  submitAssignment: (payload: unknown) => mockSubmitAssignment(payload),
  updateAssignment: (payload: unknown) => mockUpdateAssignment(payload),
}));

function buildAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: 1,
    title: 'Մաթեմատիկա',
    description: 'Լուծել առաջադրանքները',
    assignment_type: 'individual',
    target_scope: 'CLASS',
    target_group_ids: [],
    target_student_ids: [],
    subject_id: 3,
    class_id: 7,
    teacher_id: 11,
    due_date: '2026-02-20T10:00:00.000Z',
    max_points: 10,
    is_published: true,
    created_at: '2026-02-07T10:00:00.000Z',
    updated_at: '2026-02-07T10:00:00.000Z',
    ...overrides,
  };
}

function buildSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 1,
    assignment_id: 1,
    student_id: 5,
    student_first_name: 'Ani',
    student_last_name: 'Petrosyan',
    content: 'My answer',
    file_url: null,
    submitted_at: '2026-02-07T12:00:00.000Z',
    points_earned: null,
    feedback: null,
    is_graded: false,
    ...overrides,
  };
}

function setAssignmentState(overrides: Partial<typeof mockState.assignment> = {}) {
  mockState = {
    assignment: {
      assignments: [],
      myAssignments: [],
      currentAssignment: null,
      submissions: [],
      mySubmissions: [],
      mySubmissionByAssignmentId: {},
      isLoading: false,
      error: null,
      ...overrides,
    },
  };
}

describe('AssignmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch.mockImplementation((action: { payload?: unknown }) => ({
      unwrap: () => Promise.resolve(action?.payload),
    }));
    setAssignmentState();
  });

  it('student successful submit updates status', async () => {
    const assignment = buildAssignment();
    setAssignmentState({ myAssignments: [assignment] });
    mockUseAuth.mockReturnValue({ user: { id: 5, role: 'student' } });

    const user = userEvent.setup();
    const { rerender } = render(<AssignmentsPage />);

    expect(screen.getByText('Չհանձնված')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Հանձնել առաջադրանքը' }));
    await user.type(screen.getByLabelText('Պատասխանի տեքստ'), 'Solved task');
    await user.click(screen.getByRole('button', { name: 'Հանձնել' }));

    await waitFor(() => {
      expect(mockSubmitAssignment).toHaveBeenCalledWith({
        assignmentId: 1,
        data: { content: 'Solved task' },
      });
    });

    setAssignmentState({
      myAssignments: [assignment],
      mySubmissionByAssignmentId: {
        1: buildSubmission({ assignment_id: 1, is_graded: false }),
      },
    });
    rerender(<AssignmentsPage />);

    expect(screen.getByText('Հանձնված')).toBeInTheDocument();
  });

  it('student sees graded feedback and score', () => {
    const assignment = buildAssignment();
    setAssignmentState({
      myAssignments: [assignment],
      mySubmissionByAssignmentId: {
        1: buildSubmission({
          assignment_id: 1,
          is_graded: true,
          points_earned: 9,
          feedback: 'Լավ աշխատանք',
        }),
      },
    });
    mockUseAuth.mockReturnValue({ user: { id: 5, role: 'student' } });

    render(<AssignmentsPage />);

    expect(screen.getByText('Ստուգված')).toBeInTheDocument();
    expect(screen.getByText('Արդյունք: 9/10')).toBeInTheDocument();
    expect(screen.getByText('Լավ աշխատանք')).toBeInTheDocument();
  });

  it('late assignment submit is disabled', () => {
    const assignment = buildAssignment({ due_date: '2026-02-01T10:00:00.000Z' });
    setAssignmentState({ myAssignments: [assignment] });
    mockUseAuth.mockReturnValue({ user: { id: 5, role: 'student' } });

    render(<AssignmentsPage />);

    const lateButton = screen.getByRole('button', { name: 'Ժամկետն ավարտված է' });
    expect(lateButton).toBeDisabled();
  });

  it('teacher opens review modal and grades submission', async () => {
    const assignment = buildAssignment({ teacher_id: 11 });
    setAssignmentState({
      myAssignments: [assignment],
      submissions: [buildSubmission({ id: 9, assignment_id: 1, student_id: 77 })],
    });
    mockUseAuth.mockReturnValue({ user: { id: 11, role: 'teacher' } });

    const user = userEvent.setup();
    render(<AssignmentsPage />);

    await user.click(screen.getByRole('button', { name: 'Ստուգել հանձնումները' }));

    const pointsInput = await screen.findByLabelText('Միավոր (10)');
    await user.clear(pointsInput);
    await user.type(pointsInput, '10');
    await user.type(screen.getByLabelText('Feedback'), 'Great result');
    await user.click(screen.getByRole('button', { name: 'Պահպանել արդյունքը' }));

    await waitFor(() => {
      expect(mockGradeSubmission).toHaveBeenCalledWith({
        assignmentId: 1,
        submissionId: 9,
        data: {
          points_earned: 10,
          feedback: 'Great result',
        },
      });
    });
  });

  it('unauthorized role does not see review actions', () => {
    setAssignmentState({ myAssignments: [buildAssignment()] });
    mockUseAuth.mockReturnValue({ user: { id: 5, role: 'student' } });

    render(<AssignmentsPage />);

    expect(screen.queryByRole('button', { name: 'Ստուգել հանձնումները' })).not.toBeInTheDocument();
  });
});
