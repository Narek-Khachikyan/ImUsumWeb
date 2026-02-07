import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsersPage from '@/pages/Dashboard/UsersPage';
import type { User } from '@/types';

const mockGetAll = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockUpdateRole = vi.fn();
const mockUseAuth = vi.fn();
const mockDispatch = vi.fn();

vi.mock('@/services/userService', () => ({
  userService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    updateRole: (...args: unknown[]) => mockUpdateRole(...args),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/app/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}));

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'student',
    is_active: true,
    is_verified: false,
    avatar_url: null,
    phone: null,
    school_id: null,
    created_at: '2026-02-07T00:00:00.000Z',
    updated_at: '2026-02-07T00:00:00.000Z',
    ...overrides,
  };
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: buildUser({ id: 100, role: 'admin' }) });
  });

  it('creates user and refreshes list', async () => {
    const existingUser = buildUser({
      id: 10,
      email: 'existing@example.com',
      first_name: 'Existing',
      last_name: 'User',
      role: 'teacher',
    });
    const createdUser = buildUser({
      id: 11,
      email: 'new-user@example.com',
      first_name: 'New',
      last_name: 'Person',
      role: 'teacher',
    });

    mockGetAll.mockResolvedValueOnce([existingUser]).mockResolvedValueOnce([existingUser, createdUser]);
    mockCreate.mockResolvedValue(createdUser);

    const user = userEvent.setup();
    render(<UsersPage />);

    expect(await screen.findByText('existing@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ Ավելացնել' }));
    await user.type(screen.getByLabelText('Անուն'), 'New');
    await user.type(screen.getByLabelText('Ազգանուն'), 'Person');
    await user.type(screen.getByLabelText('Էլ․ փոստ'), 'new-user@example.com');
    await user.type(screen.getByLabelText('Ժամանակավոր գաղտնաբառ'), 'pass123456');
    await user.selectOptions(screen.getByLabelText('Դեր'), 'teacher');
    await user.click(screen.getByRole('button', { name: 'Ստեղծել' }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        first_name: 'New',
        last_name: 'Person',
        email: 'new-user@example.com',
        password: 'pass123456',
        role: 'teacher',
        is_active: true,
      });
    });

    expect(await screen.findByText('Օգտատերը հաջողությամբ ստեղծվեց')).toBeInTheDocument();
    expect(await screen.findByText('new-user@example.com')).toBeInTheDocument();
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });

  it('updates profile, status and role', async () => {
    const editableUser = buildUser({
      id: 20,
      email: 'student@example.com',
      first_name: 'Stu',
      last_name: 'Dent',
      role: 'student',
      is_active: true,
    });
    const afterUpdateUser = buildUser({
      ...editableUser,
      role: 'teacher',
      is_active: false,
    });

    mockGetAll.mockResolvedValueOnce([editableUser]).mockResolvedValueOnce([afterUpdateUser]);
    mockUpdate.mockResolvedValue(afterUpdateUser);
    mockUpdateRole.mockResolvedValue(afterUpdateUser);

    const user = userEvent.setup();
    render(<UsersPage />);

    expect(await screen.findByText('student@example.com')).toBeInTheDocument();

    const row = screen.getByText('student@example.com').closest('tr');
    expect(row).not.toBeNull();

    await user.click(within(row as HTMLTableRowElement).getByRole('button', { name: 'Խմբագրել' }));
    await user.selectOptions(screen.getByLabelText('Դեր'), 'teacher');
    await user.click(screen.getByLabelText('Ակտիվ է'));
    await user.click(screen.getByRole('button', { name: 'Պահպանել' }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        20,
        expect.objectContaining({
          first_name: 'Stu',
          last_name: 'Dent',
          phone: null,
          is_active: false,
        })
      );
    });

    expect(mockUpdateRole).toHaveBeenCalledWith(20, 'teacher');
    expect(await screen.findByText('Օգտատիրոջ տվյալները թարմացվեցին')).toBeInTheDocument();
    expect(await screen.findByText('Ակտիվ չէ')).toBeInTheDocument();
  });

  it('blocks director actions for admin and allows delete for student', async () => {
    const adminUser = buildUser({
      id: 30,
      email: 'admin@example.com',
      first_name: 'Main',
      last_name: 'Admin',
      role: 'admin',
    });
    const studentUser = buildUser({
      id: 31,
      email: 'student@example.com',
      first_name: 'Student',
      last_name: 'Target',
      role: 'student',
    });

    mockUseAuth.mockReturnValue({ user: buildUser({ id: 100, role: 'director' }) });
    mockGetAll.mockResolvedValueOnce([adminUser, studentUser]).mockResolvedValueOnce([adminUser]);
    mockDelete.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    render(<UsersPage />);

    expect(await screen.findByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('student@example.com')).toBeInTheDocument();

    const adminRow = screen.getByText('admin@example.com').closest('tr');
    const studentRow = screen.getByText('student@example.com').closest('tr');
    expect(adminRow).not.toBeNull();
    expect(studentRow).not.toBeNull();

    const adminEditButton = within(adminRow as HTMLTableRowElement).getByRole('button', {
      name: 'Խմբագրել',
    });
    const adminDeleteButton = within(adminRow as HTMLTableRowElement).getByRole('button', {
      name: 'Ջնջել',
    });
    expect(adminEditButton).toBeDisabled();
    expect(adminDeleteButton).toBeDisabled();

    const studentDeleteButton = within(studentRow as HTMLTableRowElement).getByRole('button', {
      name: 'Ջնջել',
    });
    expect(studentDeleteButton).not.toBeDisabled();
    await user.click(studentDeleteButton);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(31);
    });
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });
});
