import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMyGrades, fetchGradeSummary } from '@/app/slices/gradeSlice';

export default function GradesPage() {
   const dispatch = useAppDispatch();
   const { myGrades, summary, isLoading } = useAppSelector((state) => state.grade);

   useEffect(() => {
      dispatch(fetchMyGrades());
      dispatch(fetchGradeSummary());
   }, [dispatch]);

   if (isLoading) {
      return (
         <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-main"></div>
         </div>
      );
   }

   const averageGrade =
      summary.length > 0 ? summary.reduce((acc, s) => acc + s.average, 0) / summary.length : 0;

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Իմ գնահատականները</h2>
         </div>

         {/* Summary cards */}
         {summary.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               <div className="bg-gradient-to-br from-blue-main to-blue-dark rounded-xl p-6 text-white">
                  <p className="text-sm opacity-80">Միջին գնահատական</p>
                  <p className="text-3xl font-bold mt-1">{averageGrade.toFixed(1)}</p>
               </div>
               <div className="bg-white rounded-xl shadow-soft p-6">
                  <p className="text-sm text-gray-500">Առարկաներ</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{summary.length}</p>
               </div>
               <div className="bg-white rounded-xl shadow-soft p-6">
                  <p className="text-sm text-gray-500">Ընդհանուր գնահատականներ</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                     {summary.reduce((acc, s) => acc + s.total_grades, 0)}
                  </p>
               </div>
               <div className="bg-white rounded-xl shadow-soft p-6">
                  <p className="text-sm text-gray-500">Լավագույն արդյունք</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                     {summary.length > 0
                        ? Math.max(...summary.map((s) => s.highest)).toFixed(0)
                        : '-'}
                  </p>
               </div>
            </div>
         )}

         {/* Subject breakdown */}
         {summary.length > 0 && (
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
               <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Ըստ առարկաների</h3>
               </div>
               <div className="divide-y">
                  {summary.map((subject) => (
                     <div key={subject.subject_id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="font-medium text-gray-900">{subject.subject_name}</p>
                              <p className="text-sm text-gray-500">
                                 Գնահատականներ: {subject.total_grades}
                              </p>
                           </div>
                           <div className="text-right">
                              <p className="text-2xl font-bold text-blue-main">
                                 {subject.average.toFixed(1)}
                              </p>
                              <p className="text-xs text-gray-500">
                                 {subject.lowest}-ից {subject.highest}
                              </p>
                           </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                           <div
                              className="h-full bg-blue-main rounded-full transition-all"
                              style={{ width: `${(subject.average / 100) * 100}%` }}
                           />
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Recent grades */}
         <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b">
               <h3 className="text-lg font-semibold text-gray-900">Վերջին գնահատականները</h3>
            </div>
            {myGrades.length > 0 ? (
               <div className="divide-y">
                  {myGrades.slice(0, 10).map((grade) => (
                     <div key={grade.id} className="px-6 py-4 flex items-center justify-between">
                        <div>
                           <p className="font-medium text-gray-900">Առարկա #{grade.subject_id}</p>
                           <p className="text-sm text-gray-500">
                              {new Date(grade.date).toLocaleDateString('ru-RU')} •{' '}
                              {grade.grade_type}
                           </p>
                           {grade.comment && (
                              <p className="text-sm text-gray-600 mt-1">{grade.comment}</p>
                           )}
                        </div>
                        <div className="text-right">
                           <span
                              className={`text-2xl font-bold ${
                                 grade.grade_value >= 80
                                    ? 'text-green-600'
                                    : grade.grade_value >= 60
                                      ? 'text-yellow-600'
                                      : 'text-red-600'
                              }`}
                           >
                              {grade.grade_value}
                           </span>
                           <span className="text-gray-400">/{grade.max_value}</span>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="p-12 text-center">
                  <p className="text-gray-500">Գնահատականներ դեռ չկան</p>
               </div>
            )}
         </div>
      </div>
   );
}
