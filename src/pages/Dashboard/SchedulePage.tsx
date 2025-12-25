import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMySchedule } from '@/app/slices/scheduleSlice';

const dayNames: Record<string, string> = {
   monday: 'Երկուշաբթի',
   tuesday: 'Երեքշաբթի',
   wednesday: 'Չորեքշաբթի',
   thursday: 'Հինգշաբթի',
   friday: 'Ուրբաթ',
   saturday: 'Շաբաթ',
   sunday: 'Կիրակի',
};

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SchedulePage() {
   const dispatch = useAppDispatch();
   const { mySchedule, isLoading } = useAppSelector((state) => state.schedule);

   useEffect(() => {
      dispatch(fetchMySchedule());
   }, [dispatch]);

   // Group schedule by day
   const scheduleByDay = dayOrder.reduce(
      (acc, day) => {
         acc[day] = mySchedule
            .filter((s) => s.day_of_week === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
         return acc;
      },
      {} as Record<string, typeof mySchedule>
   );

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
            <h2 className="text-2xl font-bold text-gray-900">Իմ դասացուցակը</h2>
         </div>

         {mySchedule.length === 0 ? (
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
                     d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
               </svg>
               <h3 className="mt-4 text-lg font-medium text-gray-900">Դասացուցակը դատարկ է</h3>
               <p className="mt-2 text-gray-500">Ձեր դասացուցակը դեռ լրացված չէ</p>
            </div>
         ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               {dayOrder.map((day) => {
                  const lessons = scheduleByDay[day];
                  if (!lessons || lessons.length === 0) return null;

                  return (
                     <div key={day} className="bg-white rounded-xl shadow-soft overflow-hidden">
                        <div className="px-4 py-3 bg-blue-main text-white">
                           <h3 className="font-semibold">{dayNames[day]}</h3>
                        </div>
                        <div className="divide-y">
                           {lessons.map((lesson) => (
                              <div key={lesson.id} className="p-4">
                                 <div className="flex items-start justify-between">
                                    <div>
                                       <p className="font-medium text-gray-900">
                                          Առարկա #{lesson.subject_id}
                                       </p>
                                       {lesson.room && (
                                          <p className="text-sm text-gray-500">
                                             Սենյակ {lesson.room}
                                          </p>
                                       )}
                                    </div>
                                    <div className="text-right text-sm">
                                       <p className="font-medium text-gray-900">
                                          {lesson.start_time}
                                       </p>
                                       <p className="text-gray-500">{lesson.end_time}</p>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  );
               })}
            </div>
         )}
      </div>
   );
}
