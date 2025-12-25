import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/app/hooks';
import { setUser } from '@/app/slices/authSlice';
import { userService } from '@/services/userService';

export default function ProfilePage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updatedUser = await userService.update(user.id, formData);
      dispatch(setUser(updatedUser));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (role: string | undefined) => {
    switch (role) {
      case 'student':
        return 'Ученик';
      case 'teacher':
        return 'Учитель';
      case 'director':
        return 'Директор';
      case 'admin':
        return 'Администратор';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Мой профиль</h2>

      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {/* Avatar section */}
        <div className="bg-gradient-to-r from-blue-main to-blue-dark px-6 py-8">
          <div className="flex items-center">
            <div className="w-20 h-20 rounded-full bg-white text-blue-main flex items-center justify-center text-2xl font-bold">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </div>
            <div className="ml-6 text-white">
              <h3 className="text-xl font-bold">
                {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-blue-100">{getRoleLabel(user?.role)}</p>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                Имя
              </label>
              {isEditing ? (
                <input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-main focus:border-transparent"
                />
              ) : (
                <p className="mt-1 text-gray-900">{user?.first_name}</p>
              )}
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Фамилия
              </label>
              {isEditing ? (
                <input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-main focus:border-transparent"
                />
              ) : (
                <p className="mt-1 text-gray-900">{user?.last_name}</p>
              )}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700">Email</span>
            <p className="mt-1 text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-500 mt-1">Email нельзя изменить</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Телефон
            </label>
            {isEditing ? (
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-main focus:border-transparent"
                placeholder="+7 (999) 123-45-67"
              />
            ) : (
              <p className="mt-1 text-gray-900">{user?.phone || 'Не указан'}</p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700">Роль</span>
            <p className="mt-1 text-gray-900">{getRoleLabel(user?.role)}</p>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700">Статус</span>
            <div className="mt-1 flex items-center">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user?.is_verified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {user?.is_verified ? 'Подтверждён' : 'Не подтверждён'}
              </span>
              <span
                className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user?.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {user?.is_active ? 'Активен' : 'Неактивен'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-main text-white rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-main text-white rounded-lg hover:bg-blue-dark transition-colors"
              >
                Редактировать
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
