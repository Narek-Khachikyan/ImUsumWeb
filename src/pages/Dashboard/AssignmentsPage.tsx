import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMyAssignments } from '@/app/slices/assignmentSlice';
import { useAuth } from '@/hooks/useAuth';

export default function AssignmentsPage() {
   const dispatch = useAppDispatch();
   const { user } = useAuth();
   const { myAssignments, isLoading } = useAppSelector((state) => state.assignment);

   useEffect(() => {
      dispatch(fetchMyAssignments());
   }, [dispatch]);

   const now = new Date();
   const upcoming = myAssignments.filter((a) => new Date(a.due_date) > now);
   const past = myAssignments.filter((a) => new Date(a.due_date) <= now);

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
            <h2 className="text-2xl font-bold text-gray-900">
               {user?.role === 'teacher' ? 'Իմ առաջադրանքները' : 'Առաջադրանքներ'}
            </h2>
            {user?.role === 'teacher' && (
               <button className="px-4 py-2 bg-blue-main text-white rounded-lg hover:bg-blue-dark transition-colors">
                  + Ստեղծել առաջադրանք
               </button>
            )}
         </div>

         {myAssignments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-soft p-12 text-center">
               <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
               >
                  <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth={2}
                     d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
               </svg>
               <h3 className="mt-4 text-lg font-medium text-gray-900">Առաջադրանքներ չկան</h3>
               <p className="mt-2 text-gray-500">
                  {user?.role === 'teacher'
                     ? 'Դուք դեռ չեք ստեղծել ոչ մի առաջադրանք'
                     : 'Ձեզ դեռ չի նշանակվել ոչ մի առաջադրանք'}
               </p>
            </div>
         ) : (
            <>
               {/* Upcoming assignments */}
               {upcoming.length > 0 && (
                  <div>
                     <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Առաջիկա ({upcoming.length})
                     </h3>
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {upcoming.map((assignment) => (
                           <div
                              key={assignment.id}
                              className="bg-white rounded-xl shadow-soft p-6 hover:shadow-card transition-shadow"
                           >
                              <div className="flex items-start justify-between">
                                 <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">
                                       {assignment.title}
                                    </h4>
                                    {assignment.description && (
                                       <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                          {assignment.description}
                                       </p>
                                    )}
                                 </div>
                                 <span
                                    className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                                       assignment.assignment_type === 'group'
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-blue-100 text-blue-700'
                                    }`}
                                 >
                                    {assignment.assignment_type === 'group'
                                       ? 'Խմբային'
                                       : 'Անհատական'}
                                 </span>
                              </div>
                              <div className="mt-4 flex items-center justify-between text-sm">
                                 <span className="text-gray-500">
                                    Վերջնաժամկետ:{' '}
                                    {new Date(assignment.due_date).toLocaleDateString('ru-RU')}
                                 </span>
                                 <span className="font-medium text-blue-main">
                                    {assignment.max_points} միավոր
                                 </span>
                              </div>
                              {user?.role === 'student' && (
                                 <button className="mt-4 w-full px-4 py-2 bg-blue-main text-white rounded-lg hover:bg-blue-dark transition-colors">
                                    Հանձնել առաջադրանքը
                                 </button>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* Past assignments */}
               {past.length > 0 && (
                  <div>
                     <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Անցած ({past.length})
                     </h3>
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {past.map((assignment) => (
                           <div
                              key={assignment.id}
                              className="bg-white rounded-xl shadow-soft p-6 opacity-75"
                           >
                              <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                              <div className="mt-4 flex items-center justify-between text-sm">
                                 <span className="text-gray-500">
                                    Ժամկետ:{' '}
                                    {new Date(assignment.due_date).toLocaleDateString('ru-RU')}
                                 </span>
                                 <span className="font-medium text-gray-600">
                                    {assignment.max_points} միավոր
                                 </span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </>
         )}
      </div>
   );
}
