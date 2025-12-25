import { useEffect, useState, useCallback } from 'react';
import { userService } from '@/services/userService';
import type { User, UserRole } from '@/types';

export default function UsersPage() {
   const [users, setUsers] = useState<User[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [filter, setFilter] = useState<UserRole | ''>('');

   const loadUsers = useCallback(async () => {
      setIsLoading(true);
      try {
         const data = await userService.getAll({
            role: filter || undefined,
         });
         setUsers(data);
      } catch (error) {
         console.error('Failed to load users:', error);
      } finally {
         setIsLoading(false);
      }
   }, [filter]);

   useEffect(() => {
      loadUsers();
   }, [loadUsers]);

   const getRoleLabel = (role: UserRole) => {
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
   };

   const getRoleBadgeColor = (role: UserRole) => {
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
   };

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
            <button className="px-4 py-2 bg-blue-main text-white rounded-lg hover:bg-blue-dark transition-colors">
               + Ավելացնել
            </button>
         </div>

         {/* Filters */}
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
               </select>
            </div>
         </div>

         {/* Users table */}
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
                  {users.map((user) => (
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
                                 {user.phone && (
                                    <div className="text-sm text-gray-500">{user.phone}</div>
                                 )}
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {user.email}
                        </td>
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
                                 user.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                           >
                              {user.is_active ? 'Ակտիվ է' : 'Ակտիվ չէ'}
                           </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           <button className="text-blue-main hover:text-blue-dark mr-3">
                              Խմբագրել
                           </button>
                           <button className="text-red-600 hover:text-red-800">Ջնջել</button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            {users.length === 0 && (
               <div className="p-12 text-center">
                  <p className="text-gray-500">Օգտատերեր չեն գտնվել</p>
               </div>
            )}
         </div>
      </div>
   );
}
