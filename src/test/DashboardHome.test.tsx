import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardHome from '@/pages/Dashboard/DashboardHome';

const mockUseAuth = vi.fn();
const mockDispatch = vi.fn();

type MockState = {
  schedule: {
    mySchedule: Array<{
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
  };
  assignment: {
    myAssignments: Array<{
      id: number;
      title: string;
      due_date: string;
      max_points: number;
    }>;
  };
};

let mockState: MockState;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/app/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: MockState) => unknown) => selector(mockState),
}));

vi.mock('@/app/slices/scheduleSlice', () => ({
  fetchMySchedule: () => ({ type: 'fetchMySchedule' }),
}));

vi.mock('@/app/slices/assignmentSlice', () => ({
  fetchMyAssignments: () => ({ type: 'fetchMyAssignments' }),
}));

vi.mock('@/pages/Dashboard/StudentHomePage', () => ({
  default: () => <div>Student Home</div>,
}));

describe('DashboardHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      schedule: {
        mySchedule: [],
      },
      assignment: {
        myAssignments: [],
      },
    };
  });

  it('counts uppercase backend weekdays on the teacher dashboard', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-02T10:00:00.000Z'));

    mockUseAuth.mockReturnValue({
      user: {
        id: 7,
        role: 'teacher',
        first_name: 'Ani',
      },
    });

    mockState.schedule.mySchedule = [
      {
        id: 1,
        class_id: 2,
        subject_id: 3,
        teacher_id: 7,
        day_of_week: 'MONDAY',
        start_time: '09:00:00',
        end_time: '09:45:00',
        room: '201',
        effective_from: '2026-02-01',
        effective_to: null,
        created_at: '2026-02-01T09:00:00.000Z',
        updated_at: '2026-02-01T09:00:00.000Z',
      },
    ];

    render(<DashboardHome />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Դաս #3')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
