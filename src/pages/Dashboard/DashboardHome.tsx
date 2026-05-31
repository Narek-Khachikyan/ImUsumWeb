import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMySchedule } from '@/app/slices/scheduleSlice';
import { fetchMyAssignments } from '@/app/slices/assignmentSlice';
import StudentHomePage from './StudentHomePage';

export default function DashboardHome() {
   const { user } = useAuth();

   // For students, show the new StudentHomePage design
   if (user?.role === 'student') {
      return <StudentHomePage />;
   }

   return <TeacherDirectorDashboard />;
}

function TeacherDirectorDashboard() {
   const { user } = useAuth();
   const dispatch = useAppDispatch();
   const { mySchedule } = useAppSelector((state) => state.schedule);
   const { myAssignments } = useAppSelector((state) => state.assignment);

   useEffect(() => {
      dispatch(fetchMySchedule());
      dispatch(fetchMyAssignments());
   }, [dispatch]);

   const todaySchedule = mySchedule.filter((s) => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = days[new Date().getDay()];
      return s.day_of_week.toLowerCase() === today;
   });

   const upcomingAssignments = myAssignments
      .filter((a) => new Date(a.due_date) > new Date())
      .slice(0, 5);


   return (
      <div className="space-y-6">
         {/* Welcome section */}
         <div className="bg-gradient-to-r from-blue-main to-blue-dark rounded-2xl p-6 text-white">
            <h2 className="text-2xl font-bold">Բարի գալուստ, {user?.first_name}!</h2>
            <p className="mt-2 text-blue-100">
               {user?.role === 'teacher' &&
                  'Կառավարեք աշակերտների առաջադրանքները եվ գնահատականները'}
               {user?.role === 'director' && 'Կառավարեք դպրոցը, դասացուցակը եվ անձնակազմը'}
            </p>
         </div>

         {/* Stats cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-soft p-6">
               <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                     <svg
                        className="w-6 h-6 text-blue-main"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                     </svg>
                  </div>
                  <div className="ml-4">
                     <p className="text-sm font-medium text-gray-500">Դասեր այսօր</p>
                     <p className="text-2xl font-bold text-gray-900">{todaySchedule.length}</p>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-6">
               <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                     <svg
                        className="w-6 h-6 text-orange-600"
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
                  </div>
                  <div className="ml-4">
                     <p className="text-sm font-medium text-gray-500">Առաջիկա առաջադրանքներ</p>
                     <p className="text-2xl font-bold text-gray-900">
                        {upcomingAssignments.length}
                     </p>
                  </div>
               </div>
            </div>

         </div>

         {/* Today's schedule */}
         <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Այսօրվա դասացուցակը</h3>
            {todaySchedule.length > 0 ? (
               <div className="space-y-3">
                  {todaySchedule.map((lesson) => (
                     <div key={lesson.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-center mr-4">
                           <p className="text-sm font-medium text-gray-900">{lesson.start_time}</p>
                           <p className="text-xs text-gray-500">{lesson.end_time}</p>
                        </div>
                        <div className="flex-1">
                           <p className="font-medium text-gray-900">Դաս #{lesson.subject_id}</p>
                           {lesson.room && (
                              <p className="text-sm text-gray-500">Սենյակ: {lesson.room}</p>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <p className="text-gray-500 text-center py-8">Այսօր դասեր չկան</p>
            )}
         </div>

         {/* Upcoming assignments */}
         <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Առաջիկա առաջադրանքներ</h3>
            {upcomingAssignments.length > 0 ? (
               <div className="space-y-3">
                  {upcomingAssignments.map((assignment) => (
                     <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                     >
                        <div>
                           <p className="font-medium text-gray-900">{assignment.title}</p>
                           <p className="text-sm text-gray-500">
                              Վերջնաժամկետ:{' '}
                              {new Date(assignment.due_date).toLocaleDateString('ru-RU')}
                           </p>
                        </div>
                        <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-main rounded-full">
                           {assignment.max_points} միավոր
                        </span>
                     </div>
                  ))}
               </div>
            ) : (
               <p className="text-gray-500 text-center py-8">Առաջիկա առաջադրանքներ չկան</p>
            )}
         </div>
      </div>
   );
}
