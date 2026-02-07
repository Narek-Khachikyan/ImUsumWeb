import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { setUser } from '@/app/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api';
import { userService } from '@/services/userService';
import type { User, UserRole, UserCreateRequest, UserAdminUpdate } from '@/types';

const DIRECTOR_MANAGEABLE_ROLES: UserRole[] = ['student', 'teacher'];

interface CreateFormState {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
}

interface EditFormState {
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
}

function getRoleLabel(role: UserRole) {
  switch (role) {
    case 'student':
      return 'Աշակերտ';
    case 'teacher':
      return 'Ուսուցիչ';
    case 'director':
      return 'Տնօրեն';
    case 'admin':
      return 'Ադմինիստրատոր';
  }
}

function getRoleBadgeColor(role: UserRole) {
  switch (role) {
    case 'student':
      return 'bg-blue-100 text-blue-700';
    case 'teacher':
      return 'bg-green-100 text-green-700';
    case 'director':
      return 'bg-purple-100 text-purple-700';
    case 'admin':
      return 'bg-red-100 text-red-700';
  }
}

function getInitialCreateForm(): CreateFormState {
  return {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'student',
    is_active: true,
  };
}

function getInitialEditForm(user: User): EditFormState {
  return {
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone ?? '',
    role: user.role,
    is_active: user.is_active,
  };
}

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<UserRole | ''>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState<CreateFormState>(getInitialCreateForm);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAll({
        role: filter || undefined,
      });
      setUsers(data);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error, 'Չհաջողվեց բեռնել օգտատերերը'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const isSelf = (user: User) => user.id === currentUser?.id;

  const canManageRole = (role: UserRole) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'director') {
      return DIRECTOR_MANAGEABLE_ROLES.includes(role);
    }
    return false;
  };

  const canEditUser = (user: User) => isSelf(user) || canManageRole(user.role);
  const canDeleteUser = (user: User) => !isSelf(user) && canManageRole(user.role);
  const canChangeRoleForUser = (user: User) => !isSelf(user) && canManageRole(user.role);
  const canChangeActiveForUser = (user: User) => !isSelf(user) && canManageRole(user.role);

  const openCreateModal = () => {
    setCreateForm(getInitialCreateForm());
    setModalError(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setModalError(null);
  };

  const openEditModal = (user: User) => {
    if (!canEditUser(user)) return;
    setEditForm(getInitialEditForm(user));
    setEditingUser(user);
    setModalError(null);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm(null);
    setModalError(null);
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError(null);
    setFeedback(null);

    const firstName = createForm.first_name.trim();
    const lastName = createForm.last_name.trim();
    const email = createForm.email.trim();
    const password = createForm.password;
    const phone = createForm.phone.trim();

    if (!firstName) {
      setModalError('Նշեք անունը');
      return;
    }

    if (!lastName) {
      setModalError('Նշեք ազգանունը');
      return;
    }

    if (!email) {
      setModalError('Նշեք էլ․ փոստը');
      return;
    }

    if (password.length < 6) {
      setModalError('Գաղտնաբառը պետք է պարունակի առնվազն 6 նիշ');
      return;
    }

    if (currentUser?.role === 'director' && !DIRECTOR_MANAGEABLE_ROLES.includes(createForm.role)) {
      setModalError('Տնօրենը կարող է ստեղծել միայն աշակերտ կամ ուսուցիչ');
      return;
    }

    const payload: UserCreateRequest = {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      role: createForm.role,
      is_active: createForm.is_active,
      ...(phone ? { phone } : {}),
    };

    setIsSubmitting(true);
    try {
      await userService.create(payload);
      closeCreateModal();
      setFeedback({ type: 'success', message: 'Օգտատերը հաջողությամբ ստեղծվեց' });
      await loadUsers();
    } catch (error) {
      setModalError(getApiErrorMessage(error, 'Օգտատիրոջ ստեղծումը չհաջողվեց'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser || !editForm) return;

    setModalError(null);
    setFeedback(null);

    const firstName = editForm.first_name.trim();
    const lastName = editForm.last_name.trim();
    const phone = editForm.phone.trim();

    if (!firstName) {
      setModalError('Նշեք անունը');
      return;
    }

    if (!lastName) {
      setModalError('Նշեք ազգանունը');
      return;
    }

    const canChangeRole = canChangeRoleForUser(editingUser);
    const canChangeActive = canChangeActiveForUser(editingUser);

    const payload: UserAdminUpdate = {
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      ...(canChangeActive ? { is_active: editForm.is_active } : {}),
    };

    setIsSubmitting(true);
    try {
      let finalUser = await userService.update(editingUser.id, payload);

      if (canChangeRole && editForm.role !== editingUser.role) {
        finalUser = await userService.updateRole(editingUser.id, editForm.role);
      }

      if (currentUser && editingUser.id === currentUser.id) {
        dispatch(setUser(finalUser));
      }

      closeEditModal();
      setFeedback({ type: 'success', message: 'Օգտատիրոջ տվյալները թարմացվեցին' });
      await loadUsers();
    } catch (error) {
      setModalError(getApiErrorMessage(error, 'Օգտատիրոջ թարմացումը չհաջողվեց'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!canDeleteUser(user)) return;
    const isConfirmed = window.confirm(
      `Ջնջե՞լ ${user.first_name} ${user.last_name} օգտատիրոջ հաշիվը:`
    );
    if (!isConfirmed) return;

    setFeedback(null);
    setDeletingId(user.id);
    try {
      await userService.delete(user.id);
      setFeedback({ type: 'success', message: 'Օգտատերը հաջողությամբ ջնջվեց' });
      await loadUsers();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error, 'Օգտատիրոջ ջնջումը չհաջողվեց'),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const roleOptions =
    currentUser?.role === 'director'
      ? DIRECTOR_MANAGEABLE_ROLES
      : (['student', 'teacher', 'director', 'admin'] as UserRole[]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Օգտատերեր</h2>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-main text-white rounded-lg hover:bg-blue-dark transition-colors"
        >
          + Ավելացնել
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-lg px-4 py-3 border ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-soft p-4">
        <div className="flex items-center space-x-4">
          <label htmlFor="role-filter" className="text-sm font-medium text-gray-700">
            Ֆիլտր ըստ դերի:
          </label>
          <select
            id="role-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as UserRole | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-main focus:border-transparent"
          >
            <option value="">Բոլորը</option>
            <option value="student">Աշակերտներ</option>
            <option value="teacher">Ուսուցիչներ</option>
            <option value="director">Տնօրեններ</option>
            <option value="admin">Ադմիններ</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Օգտատեր
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Դեր
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Կարգավիճակ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Գործողություններ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const canEdit = canEditUser(user);
              const canDelete = canDeleteUser(user);

              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-main text-white flex items-center justify-center font-medium">
                        {user.first_name[0]}
                        {user.last_name[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Ակտիվ է' : 'Ակտիվ չէ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => openEditModal(user)}
                      disabled={!canEdit}
                      className={`${
                        canEdit
                          ? 'text-blue-main hover:text-blue-dark'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Խմբագրել
                    </button>
                    <button
                      onClick={() => void handleDelete(user)}
                      disabled={!canDelete || deletingId === user.id}
                      className={`${
                        canDelete && deletingId !== user.id
                          ? 'text-red-600 hover:text-red-800'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {deletingId === user.id ? 'Ջնջվում է...' : 'Ջնջել'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500">Օգտատերեր չեն գտնվել</p>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg">
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Ավելացնել օգտատեր</h3>

              {modalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-first-name" className="block text-sm font-medium text-gray-700">
                    Անուն
                  </label>
                  <input
                    id="create-first-name"
                    type="text"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="create-last-name" className="block text-sm font-medium text-gray-700">
                    Ազգանուն
                  </label>
                  <input
                    id="create-last-name"
                    type="text"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="create-email" className="block text-sm font-medium text-gray-700">
                  Էլ․ փոստ
                </label>
                <input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="create-password" className="block text-sm font-medium text-gray-700">
                  Ժամանակավոր գաղտնաբառ
                </label>
                <input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="create-phone" className="block text-sm font-medium text-gray-700">
                  Հեռախոս
                </label>
                <input
                  id="create-phone"
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="create-role" className="block text-sm font-medium text-gray-700">
                  Դեր
                </label>
                <select
                  id="create-role"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={createForm.is_active}
                  onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-main focus:ring-blue-main"
                />
                Ակտիվ է
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-main text-white hover:bg-blue-dark disabled:opacity-50"
                >
                  {isSubmitting ? 'Պահպանում...' : 'Ստեղծել'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && editForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg">
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Խմբագրել օգտատեր</h3>

              {modalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-first-name" className="block text-sm font-medium text-gray-700">
                    Անուն
                  </label>
                  <input
                    id="edit-first-name"
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="edit-last-name" className="block text-sm font-medium text-gray-700">
                    Ազգանուն
                  </label>
                  <input
                    id="edit-last-name"
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700">
                  Հեռախոս
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">
                  Դեր
                </label>
                <select
                  id="edit-role"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  disabled={!canChangeRoleForUser(editingUser)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  disabled={!canChangeActiveForUser(editingUser)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-main focus:ring-blue-main disabled:opacity-50"
                />
                Ակտիվ է
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-main text-white hover:bg-blue-dark disabled:opacity-50"
                >
                  {isSubmitting ? 'Պահպանում...' : 'Պահպանել'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
