import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

interface NavItem {
   name: string;
   path: string;
   icon: React.ReactNode;
   roles?: UserRole[];
}

const navItems: NavItem[] = [
   {
      name: 'Գլխավոր',
      path: '/dashboard',
      icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={2}
               d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
         </svg>
      ),
   },
   {
      name: 'Դասացուցակ',
      path: '/dashboard/schedule',
      icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={2}
               d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
         </svg>
      ),
   },
   {
      name: 'Առաջադրանքներ',
      path: '/dashboard/assignments',
      icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={2}
               d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
         </svg>
      ),
   },
   {
      name: 'Գնահատականներ',
      path: '/dashboard/grades',
      icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={2}
               d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
         </svg>
      ),
      roles: ['student'],
   },
   {
      name: 'Առաջարկներ',
      path: '/dashboard/offers',
      icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={2}
               d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
            />
         </svg>
      ),
   },
   {
      name: 'Իմ գնումները',
      path: '/dashboard/my-purchases',
      icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={2}
               d="M9 5h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2zm0 0V3m6 2V3m-6 9h6m-6 4h6"
            />
         </svg>
      ),
      roles: ['student'],
   },
   {
      name: 'Օգտատերեր',
      path: '/dashboard/users',
      icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={2}
               d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
         </svg>
      ),
      roles: ['director', 'admin'],
   },
   {
      name: 'Պրոֆիլ',
      path: '/dashboard/profile',
      icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={2}
               d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
         </svg>
      ),
   },
];

export default function DashboardLayout() {
   const { user, logout } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();
   const [sidebarOpen, setSidebarOpen] = useState(false);

   const handleLogout = async () => {
      await logout();
      navigate('/login');
   };

   const filteredNavItems = navItems.filter((item) => {
      if (!item.roles) return true;
      return user && item.roles.includes(user.role);
   });

   const getRoleLabel = (role: UserRole | undefined) => {
      switch (role) {
         case 'student':
            return 'Աշակերտ';
         case 'teacher':
            return 'Ուսուցիչ';
         case 'director':
            return 'Տնօրեն';
         case 'admin':
            return 'Ադմինիստրատոր';
         default:
            return '';
      }
   };

   return (
      <div className="min-h-screen bg-gray-100">
         {/* Mobile sidebar overlay */}
         {sidebarOpen && (
            <div
               className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
               onClick={() => setSidebarOpen(false)}
               onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
               role="button"
               tabIndex={0}
               aria-label="Close sidebar"
            />
         )}

         {/* Sidebar */}
         <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
               sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
         >
            <div className="flex flex-col h-full">
               {/* Logo */}
               <div className="flex items-center justify-between h-16 px-4 border-b">
                  <Link to="/" className="text-xl font-bold text-blue-main">
                     ImUsum
                  </Link>
                  <button
                     onClick={() => setSidebarOpen(false)}
                     className="lg:hidden text-gray-500 hover:text-gray-700"
                  >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M6 18L18 6M6 6l12 12"
                        />
                     </svg>
                  </button>
               </div>

               {/* User info */}
               <div className="px-4 py-4 border-b">
                  <div className="flex items-center">
                     <div className="w-10 h-10 rounded-full bg-blue-main text-white flex items-center justify-center font-medium">
                        {user?.first_name?.[0]}
                        {user?.last_name?.[0]}
                     </div>
                     <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                           {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{getRoleLabel(user?.role)}</p>
                     </div>
                  </div>
               </div>

               {/* Navigation */}
               <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                  {filteredNavItems.map((item) => {
                     const isActive = location.pathname === item.path;
                     return (
                        <Link
                           key={item.path}
                           to={item.path}
                           className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                              isActive
                                 ? 'bg-blue-main text-white'
                                 : 'text-gray-700 hover:bg-gray-100'
                           }`}
                           onClick={() => setSidebarOpen(false)}
                        >
                           {item.icon}
                           <span className="ml-3">{item.name}</span>
                        </Link>
                     );
                  })}
               </nav>

               {/* Logout button */}
               <div className="p-4 border-t">
                  <button
                     onClick={handleLogout}
                     className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                     </svg>
                     <span className="ml-3">Դուրս գալ</span>
                  </button>
               </div>
            </div>
         </aside>

         {/* Main content */}
         <div className="lg:pl-64">
            <main className="p-4 lg:p-8">
               <div className="lg:hidden mb-4">
                  <button
                     onClick={() => setSidebarOpen(true)}
                     className="text-gray-500 hover:text-gray-700"
                  >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M4 6h16M4 12h16M4 18h16"
                        />
                     </svg>
                  </button>
               </div>
               <Outlet />
            </main>
         </div>
      </div>
   );
}
