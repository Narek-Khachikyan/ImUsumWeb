import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
   createAssignment,
   deleteAssignment,
   fetchMyAssignments,
   updateAssignment,
} from '@/app/slices/assignmentSlice';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api';
import type { Assignment, AssignmentCreate } from '@/services/assignmentService';

interface AssignmentFormState {
   title: string;
   description: string;
   assignment_type: 'individual' | 'group';
   subject_id: string;
   class_id: string;
   due_date: string;
   max_points: string;
   is_published: boolean;
}

function getDefaultDueDateValue() {
   const date = new Date();
   date.setDate(date.getDate() + 7);
   date.setHours(23, 59, 0, 0);
   return formatDateTimeLocal(date.toISOString());
}

function getInitialFormState(): AssignmentFormState {
   return {
      title: '',
      description: '',
      assignment_type: 'individual',
      subject_id: '',
      class_id: '',
      due_date: getDefaultDueDateValue(),
      max_points: '100',
      is_published: false,
   };
}

function formatDateTimeLocal(input: string) {
   const date = new Date(input);
   if (Number.isNaN(date.getTime())) {
      return '';
   }
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, '0');
   const day = String(date.getDate()).padStart(2, '0');
   const hours = String(date.getHours()).padStart(2, '0');
   const minutes = String(date.getMinutes()).padStart(2, '0');
   return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function resolveErrorMessage(error: unknown, fallback: string) {
   if (typeof error === 'string' && error.trim().length > 0) {
      return error;
   }
   return getApiErrorMessage(error, fallback);
}

function toApiAssignmentType(
   value: AssignmentFormState['assignment_type']
): NonNullable<AssignmentCreate['assignment_type']> {
   return value === 'group' ? 'GROUP' : 'INDIVIDUAL';
}

function isGroupAssignmentType(value: Assignment['assignment_type']) {
   return value === 'group' || value === 'GROUP';
}

export default function AssignmentsPage() {
   const dispatch = useAppDispatch();
   const { user } = useAuth();
   const { myAssignments, isLoading } = useAppSelector((state) => state.assignment);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
   const [formState, setFormState] = useState<AssignmentFormState>(getInitialFormState);
   const [modalError, setModalError] = useState<string | null>(null);
   const [pageError, setPageError] = useState<string | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [deletingId, setDeletingId] = useState<number | null>(null);

   const canManageAssignments =
      user?.role === 'teacher' || user?.role === 'director' || user?.role === 'admin';
   const canCreateAssignments = user?.role === 'teacher';

   useEffect(() => {
      dispatch(fetchMyAssignments());
   }, [dispatch]);

   const { upcoming, past } = useMemo(() => {
      const now = new Date();
      return {
         upcoming: myAssignments.filter((a) => new Date(a.due_date) > now),
         past: myAssignments.filter((a) => new Date(a.due_date) <= now),
      };
   }, [myAssignments]);

   const openCreateModal = () => {
      setEditingAssignment(null);
      setFormState(getInitialFormState());
      setModalError(null);
      setIsModalOpen(true);
   };

   const openEditModal = (assignment: Assignment) => {
      setEditingAssignment(assignment);
      setFormState({
         title: assignment.title,
         description: assignment.description ?? '',
         assignment_type: isGroupAssignmentType(assignment.assignment_type)
            ? 'group'
            : 'individual',
         subject_id: String(assignment.subject_id),
         class_id: String(assignment.class_id),
         due_date: formatDateTimeLocal(assignment.due_date),
         max_points: String(assignment.max_points),
         is_published: assignment.is_published,
      });
      setModalError(null);
      setIsModalOpen(true);
   };

   const closeModal = () => {
      setIsModalOpen(false);
      setEditingAssignment(null);
      setModalError(null);
   };

   const handleDelete = async (assignment: Assignment) => {
      if (!canManageAssignments) return;
      const isConfirmed = window.confirm(
         `Հեռացնե՞լ «${assignment.title}» առաջադրանքը:`
      );
      if (!isConfirmed) return;

      setPageError(null);
      setDeletingId(assignment.id);
      try {
         await dispatch(deleteAssignment(assignment.id)).unwrap();
      } catch (error) {
         setPageError(resolveErrorMessage(error, 'Առաջադրանքի ջնջումը չհաջողվեց'));
      } finally {
         setDeletingId(null);
      }
   };

   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canManageAssignments) return;

      setModalError(null);
      setPageError(null);

      const trimmedTitle = formState.title.trim();
      if (!trimmedTitle) {
         setModalError('Նշեք առաջադրանքի վերնագիրը');
         return;
      }

      if (!formState.due_date) {
         setModalError('Ընտրեք վերջնաժամկետ');
         return;
      }
      const dueDate = new Date(formState.due_date);
      if (Number.isNaN(dueDate.getTime())) {
         setModalError('Վերջնաժամկետը սխալ է');
         return;
      }

      const maxPoints = Number(formState.max_points);
      if (!Number.isFinite(maxPoints) || maxPoints <= 0) {
         setModalError('Միավորների առավելագույն արժեքը պետք է լինի 0-ից մեծ');
         return;
      }

      const description = formState.description.trim();
      const assignmentType = toApiAssignmentType(formState.assignment_type);
      const descriptionPayload = description ? { description } : { description: '' };

      const updatePayload: Partial<AssignmentCreate> = {
         title: trimmedTitle,
         assignment_type: assignmentType,
         due_date: dueDate.toISOString(),
         max_points: maxPoints,
         is_published: formState.is_published,
         ...descriptionPayload,
      };

      let createPayload: AssignmentCreate | null = null;
      if (!editingAssignment) {
         const subjectId = Number(formState.subject_id);
         if (!Number.isInteger(subjectId) || subjectId <= 0) {
            setModalError('Առարկայի ID-ն պետք է լինի դրական ամբողջ թիվ');
            return;
         }

         const classId = Number(formState.class_id);
         if (!Number.isInteger(classId) || classId <= 0) {
            setModalError('Դասարանի ID-ն պետք է լինի դրական ամբողջ թիվ');
            return;
         }

         createPayload = {
            title: trimmedTitle,
            assignment_type: assignmentType,
            subject_id: subjectId,
            class_id: classId,
            due_date: dueDate.toISOString(),
            max_points: maxPoints,
            is_published: formState.is_published,
            ...descriptionPayload,
         };
      }

      setIsSubmitting(true);
      try {
         if (editingAssignment) {
            await dispatch(
               updateAssignment({ id: editingAssignment.id, data: updatePayload })
            ).unwrap();
         } else if (createPayload) {
            await dispatch(createAssignment(createPayload)).unwrap();
         }
         closeModal();
      } catch (error) {
         setModalError(resolveErrorMessage(error, 'Չհաջողվեց պահպանել առաջադրանքը'));
      } finally {
         setIsSubmitting(false);
      }
   };

   const renderAssignmentCard = (assignment: Assignment, isPast: boolean) => (
      <div
         key={assignment.id}
         className={`bg-white rounded-xl shadow-soft p-6 transition-shadow ${
            isPast ? 'opacity-75' : 'hover:shadow-card'
         }`}
      >
         <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
               <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
               {assignment.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{assignment.description}</p>
               )}
            </div>
            <span
               className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  isGroupAssignmentType(assignment.assignment_type)
                     ? 'bg-purple-100 text-purple-700'
                     : 'bg-blue-100 text-blue-700'
               }`}
            >
               {isGroupAssignmentType(assignment.assignment_type) ? 'Խմբային' : 'Անհատական'}
            </span>
         </div>

         <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">
               {isPast ? 'Ժամկետ:' : 'Վերջնաժամկետ:'}{' '}
               {new Date(assignment.due_date).toLocaleDateString('ru-RU')}
            </span>
            <span className="font-medium text-blue-main">{assignment.max_points} միավոր</span>
         </div>

         {canManageAssignments ? (
            <div className="mt-4 flex items-center justify-between gap-3">
               <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                     assignment.is_published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
               >
                  {assignment.is_published ? 'Հրապարակված' : 'Սևագիր'}
               </span>
               <div className="flex items-center gap-2">
                  <button
                     onClick={() => openEditModal(assignment)}
                     className="px-3 py-1.5 text-sm rounded-lg border border-blue-200 text-blue-main hover:bg-blue-50"
                  >
                     Խմբագրել
                  </button>
                  <button
                     onClick={() => void handleDelete(assignment)}
                     disabled={deletingId === assignment.id}
                     className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                     {deletingId === assignment.id ? 'Ջնջվում է...' : 'Ջնջել'}
                  </button>
               </div>
            </div>
         ) : (
            user?.role === 'student' && (
               <button className="mt-4 w-full px-4 py-2 bg-blue-main text-white rounded-lg hover:bg-blue-dark transition-colors">
                  Հանձնել առաջադրանքը
               </button>
            )
         )}
      </div>
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
            <h2 className="text-2xl font-bold text-gray-900">
               {user?.role === 'teacher' ? 'Իմ առաջադրանքները' : 'Առաջադրանքներ'}
            </h2>
            {canCreateAssignments && (
               <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-blue-main text-white rounded-lg hover:bg-blue-dark transition-colors"
               >
                  + Ստեղծել առաջադրանք
               </button>
            )}
         </div>

         {pageError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
               {pageError}
            </div>
         )}

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
                  {canCreateAssignments
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
                        {upcoming.map((assignment) => renderAssignmentCard(assignment, false))}
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
                        {past.map((assignment) => renderAssignmentCard(assignment, true))}
                     </div>
                  </div>
               )}
            </>
         )}

         {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
               <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                     <h3 className="text-lg font-semibold text-gray-900">
                        {editingAssignment ? 'Խմբագրել առաջադրանքը' : 'Ստեղծել առաջադրանք'}
                     </h3>
                     <button
                        onClick={closeModal}
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                        aria-label="Close"
                     >
                        ×
                     </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                     {modalError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                           {modalError}
                        </div>
                     )}

                     <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                           Վերնագիր
                        </label>
                        <input
                           id="title"
                           type="text"
                           value={formState.title}
                           onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
                           className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                           placeholder="Առաջադրանքի անունը"
                           required
                        />
                     </div>

                     <div>
                        <label
                           htmlFor="description"
                           className="block text-sm font-medium text-gray-700"
                        >
                           Նկարագրություն
                        </label>
                        <textarea
                           id="description"
                           value={formState.description}
                           onChange={(e) =>
                              setFormState((s) => ({ ...s, description: e.target.value }))
                           }
                           rows={3}
                           className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                           placeholder="Լրացուցիչ բացատրություն (ըստ ցանկության)"
                        />
                     </div>

                     <div className="grid gap-4 md:grid-cols-2">
                        <div>
                           <label
                              htmlFor="assignment_type"
                              className="block text-sm font-medium text-gray-700"
                           >
                              Տեսակ
                           </label>
                           <select
                              id="assignment_type"
                              value={formState.assignment_type}
                              onChange={(e) =>
                                 setFormState((s) => ({
                                    ...s,
                                    assignment_type: e.target.value as 'individual' | 'group',
                                 }))
                              }
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                           >
                              <option value="individual">Անհատական</option>
                              <option value="group">Խմբային</option>
                           </select>
                        </div>
                        <div>
                           <label
                              htmlFor="max_points"
                              className="block text-sm font-medium text-gray-700"
                           >
                              Առավելագույն միավոր
                           </label>
                           <input
                              id="max_points"
                              type="number"
                              min={1}
                              value={formState.max_points}
                              onChange={(e) =>
                                 setFormState((s) => ({ ...s, max_points: e.target.value }))
                              }
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                              required
                           />
                        </div>
                     </div>

                     <div className="grid gap-4 md:grid-cols-2">
                        <div>
                           <label
                              htmlFor="subject_id"
                              className="block text-sm font-medium text-gray-700"
                           >
                              Առարկայի ID
                           </label>
                           <input
                              id="subject_id"
                              type="number"
                              min={1}
                              value={formState.subject_id}
                              onChange={(e) =>
                                 setFormState((s) => ({ ...s, subject_id: e.target.value }))
                              }
                              disabled={Boolean(editingAssignment)}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                              required
                           />
                        </div>
                        <div>
                           <label
                              htmlFor="class_id"
                              className="block text-sm font-medium text-gray-700"
                           >
                              Դասարանի ID
                           </label>
                           <input
                              id="class_id"
                              type="number"
                              min={1}
                              value={formState.class_id}
                              onChange={(e) =>
                                 setFormState((s) => ({ ...s, class_id: e.target.value }))
                              }
                              disabled={Boolean(editingAssignment)}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                              required
                           />
                        </div>
                     </div>

                     <div>
                        <label
                           htmlFor="due_date"
                           className="block text-sm font-medium text-gray-700"
                        >
                           Վերջնաժամկետ
                        </label>
                        <input
                           id="due_date"
                           type="datetime-local"
                           value={formState.due_date}
                           onChange={(e) =>
                              setFormState((s) => ({ ...s, due_date: e.target.value }))
                           }
                           className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                           required
                        />
                     </div>

                     <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                           type="checkbox"
                           checked={formState.is_published}
                           onChange={(e) =>
                              setFormState((s) => ({ ...s, is_published: e.target.checked }))
                           }
                           className="h-4 w-4 rounded border-gray-300 text-blue-main focus:ring-blue-main"
                        />
                        Հրապարակված
                     </label>

                     <div className="flex justify-end gap-3 border-t pt-4">
                        <button
                           type="button"
                           onClick={closeModal}
                           className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
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
