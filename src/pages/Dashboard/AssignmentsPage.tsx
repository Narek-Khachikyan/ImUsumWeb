import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  createAssignment,
  deleteAssignment,
  fetchMyAssignments,
  fetchMySubmissions,
  fetchSubmissions,
  gradeSubmission,
  submitAssignment,
  updateAssignment,
} from '@/app/slices/assignmentSlice';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api';
import {
  assignmentService,
  type Assignment,
  type AssignmentCreate,
  type AssignmentTargetingOptions,
  type AssignmentTargetScope,
  type Submission,
} from '@/services/assignmentService';

interface AssignmentFormState {
  title: string;
  description: string;
  assignment_type: 'individual' | 'group';
  target_scope: AssignmentTargetScope;
  target_group_ids: number[];
  target_student_ids: number[];
  subject_id: string;
  class_id: string;
  due_date: string;
  max_points: string;
  is_published: boolean;
}

interface SubmissionFormState {
  content: string;
  file_url: string;
}

interface ReviewFormState {
  points_earned: string;
  feedback: string;
}

type StudentSubmissionStatus = 'not_submitted' | 'submitted' | 'checked';
const TEN_SCALE_MIN_POINTS = 2;
const TEN_SCALE_MAX_POINTS = 10;

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

function formatDisplayDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('ru-RU');
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
    target_scope: 'CLASS',
    target_group_ids: [],
    target_student_ids: [],
    subject_id: '',
    class_id: '',
    due_date: getDefaultDueDateValue(),
    max_points: String(TEN_SCALE_MAX_POINTS),
    is_published: false,
  };
}

function getInitialSubmissionFormState(): SubmissionFormState {
  return {
    content: '',
    file_url: '',
  };
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

function resolveStudentSubmissionStatus(submission: Submission | undefined): StudentSubmissionStatus {
  if (!submission) {
    return 'not_submitted';
  }
  if (submission.is_graded) {
    return 'checked';
  }
  return 'submitted';
}

function getStatusBadge(status: StudentSubmissionStatus) {
  if (status === 'checked') {
    return { label: 'Ստուգված', className: 'bg-green-100 text-green-700' };
  }
  if (status === 'submitted') {
    return { label: 'Հանձնված', className: 'bg-blue-100 text-blue-700' };
  }
  return { label: 'Չհանձնված', className: 'bg-gray-100 text-gray-700' };
}

function getTargetScopeLabel(scope: AssignmentTargetScope) {
  if (scope === 'GROUPS') {
    return 'Թիրախ: Խմբեր';
  }
  if (scope === 'STUDENTS') {
    return 'Թիրախ: Աշակերտներ';
  }
  return 'Թիրախ: Դասարան';
}

export default function AssignmentsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { myAssignments, isLoading, mySubmissionByAssignmentId, submissions } = useAppSelector(
    (state) => state.assignment
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formState, setFormState] = useState<AssignmentFormState>(getInitialFormState);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [submissionAssignment, setSubmissionAssignment] = useState<Assignment | null>(null);
  const [submissionFormState, setSubmissionFormState] = useState<SubmissionFormState>(
    getInitialSubmissionFormState
  );
  const [submissionModalError, setSubmissionModalError] = useState<string | null>(null);
  const [isSubmittingSubmission, setIsSubmittingSubmission] = useState(false);

  const [reviewingAssignment, setReviewingAssignment] = useState<Assignment | null>(null);
  const [isLoadingReviewSubmissions, setIsLoadingReviewSubmissions] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewForms, setReviewForms] = useState<Record<number, ReviewFormState>>({});
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null);
  const [targetingOptions, setTargetingOptions] = useState<AssignmentTargetingOptions>({
    groups: [],
    students: [],
  });
  const [isLoadingTargetingOptions, setIsLoadingTargetingOptions] = useState(false);
  const [targetingOptionsError, setTargetingOptionsError] = useState<string | null>(null);

  const isStudent = user?.role === 'student';
  const canManageAssignments = user?.role === 'teacher' || user?.role === 'director' || user?.role === 'admin';
  const canCreateAssignments = canManageAssignments;
  const canReviewAssignments = canManageAssignments;

  useEffect(() => {
    dispatch(fetchMyAssignments());
  }, [dispatch]);

  useEffect(() => {
    if (!isStudent) {
      return;
    }
    dispatch(fetchMySubmissions());
  }, [dispatch, isStudent]);

  useEffect(() => {
    if (!reviewingAssignment) {
      return;
    }

    setReviewForms((previous) => {
      const next = { ...previous };
      for (const submission of submissions) {
        const existing = next[submission.id];
        if (!existing) {
          next[submission.id] = {
            points_earned: submission.points_earned !== null ? String(submission.points_earned) : '',
            feedback: submission.feedback ?? '',
          };
        }
      }
      return next;
    });
  }, [reviewingAssignment, submissions]);

  useEffect(() => {
    if (!isModalOpen || !canManageAssignments) {
      return;
    }

    const classId = Number(formState.class_id);
    if (!Number.isInteger(classId) || classId <= 0) {
      setTargetingOptions({ groups: [], students: [] });
      setTargetingOptionsError(null);
      return;
    }

    let isCancelled = false;
    const load = async () => {
      setIsLoadingTargetingOptions(true);
      setTargetingOptionsError(null);
      try {
        const payload = await assignmentService.getTargetingOptions(classId);
        if (isCancelled) {
          return;
        }
        setTargetingOptions(payload);
      } catch (error) {
        if (isCancelled) {
          return;
        }
        setTargetingOptions({ groups: [], students: [] });
        setTargetingOptionsError(resolveErrorMessage(error, 'Չհաջողվեց բեռնել թիրախավորման տարբերակները'));
      } finally {
        if (!isCancelled) {
          setIsLoadingTargetingOptions(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [canManageAssignments, formState.class_id, isModalOpen]);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    return {
      upcoming: myAssignments.filter((assignment) => new Date(assignment.due_date) > now),
      past: myAssignments.filter((assignment) => new Date(assignment.due_date) <= now),
    };
  }, [myAssignments]);

  const openCreateModal = () => {
    setEditingAssignment(null);
    setFormState(getInitialFormState());
    setModalError(null);
    setTargetingOptions({ groups: [], students: [] });
    setTargetingOptionsError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormState({
      title: assignment.title,
      description: assignment.description ?? '',
      assignment_type: isGroupAssignmentType(assignment.assignment_type) ? 'group' : 'individual',
      target_scope: assignment.target_scope,
      target_group_ids: assignment.target_group_ids ?? [],
      target_student_ids: assignment.target_student_ids ?? [],
      subject_id: String(assignment.subject_id),
      class_id: String(assignment.class_id),
      due_date: formatDateTimeLocal(assignment.due_date),
      max_points: String(TEN_SCALE_MAX_POINTS),
      is_published: assignment.is_published,
    });
    setModalError(null);
    setTargetingOptionsError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
    setModalError(null);
    setTargetingOptions({ groups: [], students: [] });
    setTargetingOptionsError(null);
  };

  const openSubmissionModal = (assignment: Assignment) => {
    setSubmissionAssignment(assignment);
    setSubmissionFormState(getInitialSubmissionFormState());
    setSubmissionModalError(null);
  };

  const closeSubmissionModal = () => {
    setSubmissionAssignment(null);
    setSubmissionFormState(getInitialSubmissionFormState());
    setSubmissionModalError(null);
  };

  const openReviewModal = async (assignment: Assignment) => {
    if (!canReviewAssignments) {
      return;
    }

    setReviewingAssignment(assignment);
    setReviewForms({});
    setReviewError(null);
    setIsLoadingReviewSubmissions(true);

    try {
      await dispatch(fetchSubmissions(assignment.id)).unwrap();
    } catch (error) {
      setReviewError(resolveErrorMessage(error, 'Չհաջողվեց բեռնել հանձնումները'));
    } finally {
      setIsLoadingReviewSubmissions(false);
    }
  };

  const closeReviewModal = () => {
    setReviewingAssignment(null);
    setReviewError(null);
    setReviewForms({});
    setGradingSubmissionId(null);
    setIsLoadingReviewSubmissions(false);
  };

  const handleDelete = async (assignment: Assignment) => {
    if (!canManageAssignments) return;
    const isConfirmed = window.confirm(`Հեռացնե՞լ «${assignment.title}» առաջադրանքը:`);
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

  const handleSubmitAssignment = async (event: FormEvent<HTMLFormElement>) => {
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

    if (Number(formState.max_points) !== TEN_SCALE_MAX_POINTS) {
      setModalError('Առավելագույն միավորը ֆիքսված է 10');
      return;
    }

    const description = formState.description.trim();
    const assignmentType = toApiAssignmentType(formState.assignment_type);
    const descriptionPayload = description ? { description } : { description: '' };
    const targetScope = formState.target_scope;
    const targetGroupIds = formState.target_group_ids;
    const targetStudentIds = formState.target_student_ids;

    if (targetScope === 'GROUPS' && targetGroupIds.length === 0) {
      setModalError('GROUPS թիրախավորման համար ընտրեք առնվազն մեկ խումբ');
      return;
    }

    if (targetScope === 'STUDENTS' && targetStudentIds.length === 0) {
      setModalError('STUDENTS թիրախավորման համար ընտրեք առնվազն մեկ աշակերտ');
      return;
    }

    const updatePayload: Partial<AssignmentCreate> = {
      title: trimmedTitle,
      assignment_type: assignmentType,
      target_scope: targetScope,
      target_group_ids: targetScope === 'GROUPS' ? targetGroupIds : [],
      target_student_ids: targetScope === 'STUDENTS' ? targetStudentIds : [],
      due_date: dueDate.toISOString(),
      max_points: TEN_SCALE_MAX_POINTS,
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
        target_scope: targetScope,
        target_group_ids: targetScope === 'GROUPS' ? targetGroupIds : [],
        target_student_ids: targetScope === 'STUDENTS' ? targetStudentIds : [],
        subject_id: subjectId,
        class_id: classId,
        due_date: dueDate.toISOString(),
        max_points: TEN_SCALE_MAX_POINTS,
        is_published: formState.is_published,
        ...descriptionPayload,
      };
    }

    setIsSubmitting(true);
    try {
      if (editingAssignment) {
        await dispatch(updateAssignment({ id: editingAssignment.id, data: updatePayload })).unwrap();
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

  const handleSubmissionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!submissionAssignment) {
      return;
    }

    setSubmissionModalError(null);

    const content = submissionFormState.content.trim();
    const fileUrl = submissionFormState.file_url.trim();

    if (!content && !fileUrl) {
      setSubmissionModalError('Նշեք պատասխանի տեքստը կամ ֆայլի հղումը');
      return;
    }

    setIsSubmittingSubmission(true);
    try {
      await dispatch(
        submitAssignment({
          assignmentId: submissionAssignment.id,
          data: {
            ...(content ? { content } : {}),
            ...(fileUrl ? { file_url: fileUrl } : {}),
          },
        })
      ).unwrap();
      closeSubmissionModal();
    } catch (error) {
      setSubmissionModalError(resolveErrorMessage(error, 'Առաջադրանքի հանձնումը չհաջողվեց'));
    } finally {
      setIsSubmittingSubmission(false);
    }
  };

  const handleReviewFormChange = (submissionId: number, next: Partial<ReviewFormState>) => {
    setReviewForms((previous) => ({
      ...previous,
      [submissionId]: {
        points_earned: previous[submissionId]?.points_earned ?? '',
        feedback: previous[submissionId]?.feedback ?? '',
        ...next,
      },
    }));
  };

  const handleGradeSubmission = async (submission: Submission) => {
    if (!reviewingAssignment) {
      return;
    }

    const formStateForSubmission = reviewForms[submission.id] ?? {
      points_earned: '',
      feedback: '',
    };
    const points = Number(formStateForSubmission.points_earned);
    if (
      !Number.isInteger(points) ||
      points < TEN_SCALE_MIN_POINTS ||
      points > TEN_SCALE_MAX_POINTS
    ) {
      setReviewError(
        `Միավորները պետք է լինեն ամբողջ թիվ ${TEN_SCALE_MIN_POINTS}-${TEN_SCALE_MAX_POINTS} միջակայքում`
      );
      return;
    }

    setReviewError(null);
    setGradingSubmissionId(submission.id);
    try {
      await dispatch(
        gradeSubmission({
          assignmentId: reviewingAssignment.id,
          submissionId: submission.id,
          data: {
            points_earned: points,
            feedback: formStateForSubmission.feedback.trim() || undefined,
          },
        })
      ).unwrap();
    } catch (error) {
      setReviewError(resolveErrorMessage(error, 'Չհաջողվեց պահպանել ստուգման արդյունքը'));
    } finally {
      setGradingSubmissionId(null);
    }
  };

  const handleTargetScopeChange = (nextScope: AssignmentTargetScope) => {
    setFormState((previous) => ({
      ...previous,
      target_scope: nextScope,
      target_group_ids: nextScope === 'GROUPS' ? previous.target_group_ids : [],
      target_student_ids: nextScope === 'STUDENTS' ? previous.target_student_ids : [],
    }));
  };

  const toggleTargetGroup = (groupId: number) => {
    setFormState((previous) => ({
      ...previous,
      target_group_ids: previous.target_group_ids.includes(groupId)
        ? previous.target_group_ids.filter((item) => item !== groupId)
        : [...previous.target_group_ids, groupId],
    }));
  };

  const toggleTargetStudent = (studentId: number) => {
    setFormState((previous) => ({
      ...previous,
      target_student_ids: previous.target_student_ids.includes(studentId)
        ? previous.target_student_ids.filter((item) => item !== studentId)
        : [...previous.target_student_ids, studentId],
    }));
  };

  const renderStudentCardDetails = (assignment: Assignment) => {
    if (!isStudent) {
      return null;
    }

    const submission = mySubmissionByAssignmentId[assignment.id];
    const status = resolveStudentSubmissionStatus(submission);
    const badge = getStatusBadge(status);
    const isPastDue = new Date(assignment.due_date) < new Date();
    const canSubmitNow = status === 'not_submitted' && !isPastDue;

    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
          {submission?.submitted_at && (
            <span className="text-xs text-gray-500">Հանձնված է՝ {formatDisplayDate(submission.submitted_at)}</span>
          )}
        </div>

        {submission?.is_graded && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            <p className="font-semibold">
              Արդյունք: {submission.points_earned ?? TEN_SCALE_MIN_POINTS}/{TEN_SCALE_MAX_POINTS}
            </p>
            {submission.feedback && <p className="mt-1 text-green-700">{submission.feedback}</p>}
          </div>
        )}

        <button
          type="button"
          onClick={() => openSubmissionModal(assignment)}
          disabled={!canSubmitNow}
          className="w-full px-4 py-2 bg-blue-main text-white rounded-lg hover:bg-blue-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {status !== 'not_submitted'
            ? 'Հանձնված է'
            : isPastDue
              ? 'Ժամկետն ավարտված է'
              : 'Հանձնել առաջադրանքը'}
        </button>
      </div>
    );
  };

  const renderAssignmentCard = (assignment: Assignment, isPast: boolean) => (
    <div
      key={assignment.id}
      className={`bg-white rounded-xl shadow-soft p-6 transition-shadow ${isPast ? 'opacity-80' : 'hover:shadow-card'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
          {assignment.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{assignment.description}</p>}
        </div>
        <span
          className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
            isGroupAssignmentType(assignment.assignment_type) ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {isGroupAssignmentType(assignment.assignment_type) ? 'Խմբային' : 'Անհատական'}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">{isPast ? 'Ժամկետ:' : 'Վերջնաժամկետ:'}</span>
          <span className="text-gray-700">{formatDisplayDate(assignment.due_date)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Առավելագույն միավոր</span>
          <span className="font-medium text-blue-main">{TEN_SCALE_MAX_POINTS}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Թիրախավորում</span>
          <span className="text-gray-700">{getTargetScopeLabel(assignment.target_scope)}</span>
        </div>
      </div>

      {canManageAssignments ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                assignment.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {assignment.is_published ? 'Հրապարակված' : 'Սևագիր'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEditModal(assignment)}
                className="px-3 py-1.5 text-sm rounded-lg border border-blue-200 text-blue-main hover:bg-blue-50"
              >
                Խմբագրել
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(assignment)}
                disabled={deletingId === assignment.id}
                className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deletingId === assignment.id ? 'Ջնջվում է...' : 'Ջնջել'}
              </button>
            </div>
          </div>
          {canReviewAssignments && (
            <button
              type="button"
              onClick={() => void openReviewModal(assignment)}
              className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Ստուգել հանձնումները
            </button>
          )}
        </div>
      ) : (
        renderStudentCardDetails(assignment)
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
        <h2 className="text-2xl font-bold text-gray-900">{user?.role === 'teacher' ? 'Իմ առաջադրանքները' : 'Առաջադրանքներ'}</h2>
        {canCreateAssignments && (
          <button onClick={openCreateModal} className="px-4 py-2 bg-blue-main text-white rounded-lg hover:bg-blue-dark transition-colors">
            + Ստեղծել առաջադրանք
          </button>
        )}
      </div>

      {pageError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{pageError}</div>}

      {myAssignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Առաջադրանքներ չկան</h3>
          <p className="mt-2 text-gray-500">{canCreateAssignments ? 'Դուք դեռ չեք ստեղծել ոչ մի առաջադրանք' : 'Ձեզ դեռ չի նշանակվել ոչ մի առաջադրանք'}</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Առաջիկա ({upcoming.length})</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{upcoming.map((assignment) => renderAssignmentCard(assignment, false))}</div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Անցած ({past.length})</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{past.map((assignment) => renderAssignmentCard(assignment, true))}</div>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{editingAssignment ? 'Խմբագրել առաջադրանքը' : 'Ստեղծել առաջադրանք'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-5 px-6 py-5">
              {modalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{modalError}</div>}

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Վերնագիր
                </label>
                <input
                  id="title"
                  type="text"
                  value={formState.title}
                  onChange={(event) => setFormState((state) => ({ ...state, title: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  placeholder="Առաջադրանքի անունը"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Նկարագրություն
                </label>
                <textarea
                  id="description"
                  value={formState.description}
                  onChange={(event) => setFormState((state) => ({ ...state, description: event.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  placeholder="Լրացուցիչ բացատրություն (ըստ ցանկության)"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="assignment_type" className="block text-sm font-medium text-gray-700">
                    Տեսակ
                  </label>
                  <select
                    id="assignment_type"
                    value={formState.assignment_type}
                    onChange={(event) =>
                      setFormState((state) => ({
                        ...state,
                        assignment_type: event.target.value as 'individual' | 'group',
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  >
                    <option value="individual">Անհատական</option>
                    <option value="group">Խմբային</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="max_points" className="block text-sm font-medium text-gray-700">
                    Առավելագույն միավոր
                  </label>
                  <input
                    id="max_points"
                    type="number"
                    min={TEN_SCALE_MAX_POINTS}
                    max={TEN_SCALE_MAX_POINTS}
                    value={formState.max_points}
                    onChange={(event) => setFormState((state) => ({ ...state, max_points: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                    readOnly
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="subject_id" className="block text-sm font-medium text-gray-700">
                    Առարկայի ID
                  </label>
                  <input
                    id="subject_id"
                    type="number"
                    min={1}
                    value={formState.subject_id}
                    onChange={(event) => setFormState((state) => ({ ...state, subject_id: event.target.value }))}
                    disabled={Boolean(editingAssignment)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="class_id" className="block text-sm font-medium text-gray-700">
                    Դասարանի ID
                  </label>
                  <input
                    id="class_id"
                    type="number"
                    min={1}
                    value={formState.class_id}
                    onChange={(event) =>
                      setFormState((state) => ({
                        ...state,
                        class_id: event.target.value,
                        target_group_ids: [],
                        target_student_ids: [],
                      }))
                    }
                    disabled={Boolean(editingAssignment)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="target_scope" className="block text-sm font-medium text-gray-700">
                  Թիրախավորում
                </label>
                <select
                  id="target_scope"
                  value={formState.target_scope}
                  onChange={(event) => handleTargetScopeChange(event.target.value as AssignmentTargetScope)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                >
                  <option value="CLASS">Ամբողջ դասարան</option>
                  <option value="GROUPS">Խմբեր</option>
                  <option value="STUDENTS">Աշակերտներ</option>
                </select>
              </div>

              {isLoadingTargetingOptions && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Թիրախավորման տարբերակները բեռնվում են...
                </div>
              )}
              {targetingOptionsError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {targetingOptionsError}
                </div>
              )}

              {formState.target_scope === 'GROUPS' && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Ընտրեք խմբերը</p>
                  {targetingOptions.groups.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      Այս դասարանի համար խումբ չկա
                    </div>
                  ) : (
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                      {targetingOptions.groups.map((group) => (
                        <label key={group.id} className="flex items-center justify-between gap-3 text-sm text-gray-700">
                          <span>
                            {group.name} ({group.members_count})
                          </span>
                          <input
                            type="checkbox"
                            checked={formState.target_group_ids.includes(group.id)}
                            onChange={() => toggleTargetGroup(group.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-main focus:ring-blue-main"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {formState.target_scope === 'STUDENTS' && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Ընտրեք աշակերտներին</p>
                  {targetingOptions.students.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      Այս դասարանում աշակերտներ չեն գտնվել
                    </div>
                  ) : (
                    <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                      {targetingOptions.students.map((student) => (
                        <label key={student.id} className="flex items-center justify-between gap-3 text-sm text-gray-700">
                          <span>
                            {student.first_name} {student.last_name} (ID {student.id})
                          </span>
                          <input
                            type="checkbox"
                            checked={formState.target_student_ids.includes(student.id)}
                            onChange={() => toggleTargetStudent(student.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-main focus:ring-blue-main"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                  Վերջնաժամկետ
                </label>
                <input
                  id="due_date"
                  type="datetime-local"
                  value={formState.due_date}
                  onChange={(event) => setFormState((state) => ({ ...state, due_date: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  required
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formState.is_published}
                  onChange={(event) => setFormState((state) => ({ ...state, is_published: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-main focus:ring-blue-main"
                />
                Հրապարակված
              </label>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                  Չեղարկել
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-main text-white hover:bg-blue-dark disabled:opacity-50">
                  {isSubmitting ? 'Պահպանում...' : 'Պահպանել'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {submissionAssignment && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Հանձնել առաջադրանքը</h3>
              <button onClick={closeSubmissionModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmissionSubmit} className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{submissionAssignment.title}</span>
                <span className="ml-2 text-gray-500">({formatDisplayDate(submissionAssignment.due_date)})</span>
              </p>

              {submissionModalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submissionModalError}</div>
              )}

              <div>
                <label htmlFor="submission_content" className="block text-sm font-medium text-gray-700">
                  Պատասխանի տեքստ
                </label>
                <textarea
                  id="submission_content"
                  value={submissionFormState.content}
                  onChange={(event) =>
                    setSubmissionFormState((state) => ({
                      ...state,
                      content: event.target.value,
                    }))
                  }
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  placeholder="Գրեք պատասխանը"
                />
              </div>

              <div>
                <label htmlFor="submission_file_url" className="block text-sm font-medium text-gray-700">
                  Ֆայլի հղում
                </label>
                <input
                  id="submission_file_url"
                  type="url"
                  value={submissionFormState.file_url}
                  onChange={(event) =>
                    setSubmissionFormState((state) => ({
                      ...state,
                      file_url: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={closeSubmissionModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSubmission}
                  className="px-4 py-2 rounded-lg bg-blue-main text-white hover:bg-blue-dark disabled:opacity-50"
                >
                  {isSubmittingSubmission ? 'Հանձնվում է...' : 'Հանձնել'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ստուգել հանձնումները</h3>
                <p className="text-sm text-gray-500">{reviewingAssignment.title}</p>
              </div>
              <button onClick={closeReviewModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close">
                ×
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {reviewError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{reviewError}</div>}

              {isLoadingReviewSubmissions ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-main"></div>
                </div>
              ) : submissions.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-600">
                  Այս առաջադրանքի համար դեռ հանձնումներ չկան
                </div>
              ) : (
                submissions.map((submission) => {
                  const reviewForm = reviewForms[submission.id] ?? {
                    points_earned: submission.points_earned !== null ? String(submission.points_earned) : '',
                    feedback: submission.feedback ?? '',
                  };
                  const studentName =
                    submission.student_first_name || submission.student_last_name
                      ? `${submission.student_first_name ?? ''} ${submission.student_last_name ?? ''}`.trim()
                      : `Աշակերտ #${submission.student_id}`;

                  return (
                    <div key={submission.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{studentName}</h4>
                          <p className="text-xs text-gray-500">
                            Հանձնել է՝ {submission.submitted_at ? formatDisplayDate(submission.submitted_at) : '—'}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            submission.is_graded ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {submission.is_graded ? 'Ստուգված' : 'Սպասում է ստուգման'}
                        </span>
                      </div>

                      {submission.content && (
                        <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">
                          {submission.content}
                        </div>
                      )}

                      {submission.file_url && (
                        <a
                          href={submission.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-sm text-blue-main hover:underline break-all"
                        >
                          {submission.file_url}
                        </a>
                      )}

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`review_points_${submission.id}`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Միավոր ({TEN_SCALE_MAX_POINTS})
                          </label>
                          <input
                            id={`review_points_${submission.id}`}
                            type="number"
                            min={TEN_SCALE_MIN_POINTS}
                            max={TEN_SCALE_MAX_POINTS}
                            step={1}
                            value={reviewForm.points_earned}
                            onChange={(event) =>
                              handleReviewFormChange(submission.id, { points_earned: event.target.value })
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`review_feedback_${submission.id}`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Feedback
                          </label>
                          <textarea
                            id={`review_feedback_${submission.id}`}
                            value={reviewForm.feedback}
                            onChange={(event) =>
                              handleReviewFormChange(submission.id, { feedback: event.target.value })
                            }
                            rows={2}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                            placeholder="Մեկնաբանություն"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => void handleGradeSubmission(submission)}
                          disabled={gradingSubmissionId === submission.id}
                          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {gradingSubmissionId === submission.id ? 'Պահպանվում է...' : 'Պահպանել արդյունքը'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
