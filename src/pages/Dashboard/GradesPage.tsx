import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMyGrades, fetchGradeSummary } from '@/app/slices/gradeSlice';
import { type Grade, type GradeSummary } from '@/services/gradeService';

export default function GradesPage() {
   const TEN_SCALE_MAX = 10;
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

   const demoSummary: GradeSummary[] = [
      {
         subject_id: 1,
         subject_name: 'Մաթեմատիկա',
         average: 9,
         total_grades: 4,
         highest: 10,
         lowest: 7,
      },
      {
         subject_id: 2,
         subject_name: 'Անգլերեն',
         average: 9,
         total_grades: 3,
         highest: 10,
         lowest: 8,
      },
      {
         subject_id: 3,
         subject_name: 'Պատմություն',
         average: 8,
         total_grades: 2,
         highest: 8,
         lowest: 7,
      },
   ];

   const demoGrades: Grade[] = [
      {
         id: 101,
         student_id: 1,
         subject_id: 1,
         teacher_id: 10,
         grade_value: 10,
         max_value: 10,
         grade_type: 'Թեստ',
         reference_id: null,
         date: '2024-05-03',
         comment: 'Շատ լավ աշխատանք',
         created_at: '2024-05-03T10:30:00Z',
         updated_at: '2024-05-03T10:30:00Z',
      },
      {
         id: 102,
         student_id: 1,
         subject_id: 2,
         teacher_id: 11,
         grade_value: 9,
         max_value: 10,
         grade_type: 'Քննություն',
         reference_id: null,
         date: '2024-05-01',
         comment: 'Լավ, բայց ուշադրություն դարձնել քերականությանը',
         created_at: '2024-05-01T09:15:00Z',
         updated_at: '2024-05-01T09:15:00Z',
      },
      {
         id: 103,
         student_id: 1,
         subject_id: 3,
         teacher_id: 12,
         grade_value: 7,
         max_value: 10,
         grade_type: 'Ներկայացում',
         reference_id: null,
         date: '2024-04-27',
         comment: 'Պետք է ավելի մանրամասն օրինակներ',
         created_at: '2024-04-27T13:00:00Z',
         updated_at: '2024-04-27T13:00:00Z',
      },
      {
         id: 104,
         student_id: 1,
         subject_id: 1,
         teacher_id: 10,
         grade_value: 7,
         max_value: 10,
         grade_type: 'Տնային աշխատանք',
         reference_id: null,
         date: '2024-04-22',
         comment: null,
         created_at: '2024-04-22T16:20:00Z',
         updated_at: '2024-04-22T16:20:00Z',
      },
      {
         id: 105,
         student_id: 1,
         subject_id: 2,
         teacher_id: 11,
         grade_value: 10,
         max_value: 10,
         grade_type: 'Թեստ',
         reference_id: null,
         date: '2024-04-18',
         comment: 'Գերազանց',
         created_at: '2024-04-18T11:45:00Z',
         updated_at: '2024-04-18T11:45:00Z',
      },
   ];

   const shouldShowDemo = myGrades.length === 0 && summary.length === 0;
   const displayedSummary = shouldShowDemo ? demoSummary : summary;
   const displayedGrades = shouldShowDemo ? demoGrades : myGrades;
   const roundGradeValue = (value: number) => Math.round(value);
   const summaryScale = TEN_SCALE_MAX;
   const averageGrade =
      displayedSummary.length > 0
         ? displayedSummary.reduce((acc, s) => acc + s.average, 0) / displayedSummary.length
         : 0;

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Իմ գնահատականները</h2>
         </div>

         {/* Summary cards */}
         {displayedSummary.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               <div className="bg-gradient-to-br from-blue-main to-blue-dark rounded-xl p-6 text-white">
                  <p className="text-sm opacity-80">Միջին գնահատական</p>
                  <p className="text-3xl font-bold mt-1">{roundGradeValue(averageGrade)}</p>
               </div>
               <div className="bg-white rounded-xl shadow-soft p-6">
                  <p className="text-sm text-gray-500">Առարկաներ</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{displayedSummary.length}</p>
               </div>
               <div className="bg-white rounded-xl shadow-soft p-6">
                  <p className="text-sm text-gray-500">Ընդհանուր գնահատականներ</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                     {displayedSummary.reduce((acc, s) => acc + s.total_grades, 0)}
                  </p>
               </div>
               <div className="bg-white rounded-xl shadow-soft p-6">
                  <p className="text-sm text-gray-500">Լավագույն արդյունք</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                     {displayedSummary.length > 0
                        ? roundGradeValue(Math.max(...displayedSummary.map((s) => s.highest)))
                        : '-'}
                  </p>
               </div>
            </div>
         )}

         {/* Subject breakdown */}
         {displayedSummary.length > 0 && (
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
               <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Ըստ առարկաների</h3>
               </div>
               <div className="divide-y">
                  {displayedSummary.map((subject) => {
                     const roundedAverage = roundGradeValue(subject.average);
                     const roundedLowest = roundGradeValue(subject.lowest);
                     const roundedHighest = roundGradeValue(subject.highest);

                     return (
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
                                    {roundedAverage}
                                 </p>
                                 <p className="text-xs text-gray-500">
                                    {roundedLowest}-ից {roundedHighest}
                                 </p>
                              </div>
                           </div>
                           {/* Progress bar */}
                           <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                 className="h-full bg-blue-main rounded-full transition-all"
                                 style={{
                                    width: `${Math.min(
                                       (roundedAverage / summaryScale) * 100,
                                       100
                                    )}%`,
                                 }}
                              />
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         )}

         {/* Recent grades */}
         <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b">
               <h3 className="text-lg font-semibold text-gray-900">Վերջին գնահատականները</h3>
            </div>
            {displayedGrades.length > 0 ? (
               <div className="divide-y">
                  {displayedGrades.slice(0, 10).map((grade) => (
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
                           {(() => {
                              const maxValue = grade.max_value || TEN_SCALE_MAX;
                              const roundedGradeValue = roundGradeValue(grade.grade_value);
                              const percent = (roundedGradeValue / maxValue) * 100;
                              const colorClass =
                                 percent >= 80
                                    ? 'text-green-600'
                                    : percent >= 60
                                      ? 'text-yellow-600'
                                      : 'text-red-600';

                              return (
                                 <>
                                    <span className={`text-2xl font-bold ${colorClass}`}>
                                       {roundedGradeValue}
                                    </span>
                                    <span className="text-gray-400">/{TEN_SCALE_MAX}</span>
                                 </>
                              );
                           })()}
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
