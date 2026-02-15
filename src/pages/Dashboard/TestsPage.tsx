import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  createTest,
  createTestQuestions,
  deleteTest,
  deleteTestQuestion,
  fetchMyTestAttempt,
  fetchMyTests,
  fetchTestAnalytics,
  fetchTestById,
  fetchTestResults,
  publishTest,
  submitTest,
  unpublishTest,
  updateTest,
  updateTestQuestion,
  clearCurrentTest,
  clearTestError,
} from '@/app/slices/testSlice';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api';
import type {
  RecommendationDifficulty,
  RecommendationLevel,
  RecommendationTrend,
  TestListItem,
  TestQuestion,
} from '@/services/testService';

interface TestFormState {
  title: string;
  description: string;
  subject_id: string;
  class_id: string;
  due_date: string;
}

interface QuestionFormState {
  question_text: string;
  order_index: string;
  points: string;
  options: string[];
  correct_index: string;
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

function getInitialTestFormState(): TestFormState {
  return {
    title: '',
    description: '',
    subject_id: '',
    class_id: '',
    due_date: getDefaultDueDateValue(),
  };
}

function getInitialQuestionFormState(): QuestionFormState {
  return {
    question_text: '',
    order_index: '',
    points: '1',
    options: ['', '', '', ''],
    correct_index: '0',
  };
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return getApiErrorMessage(error, fallback);
}

function getTestStatusBadge(test: TestListItem) {
  if (!test.is_published) {
    return { label: 'Սևագիր', className: 'bg-gray-100 text-gray-700' };
  }
  if (test.is_closed) {
    return { label: 'Փակված', className: 'bg-red-100 text-red-700' };
  }
  return { label: 'Հրապարակված', className: 'bg-green-100 text-green-700' };
}

function getRecommendationLevelBadge(level: RecommendationLevel) {
  if (level === 'critical') {
    return { label: 'Կրիտիկական', className: 'bg-red-100 text-red-700' };
  }

  if (level === 'improving') {
    return { label: 'Ամրապնդման փուլ', className: 'bg-amber-100 text-amber-700' };
  }

  if (level === 'good') {
    return { label: 'Լավ', className: 'bg-blue-100 text-blue-700' };
  }

  return { label: 'Գերազանց', className: 'bg-green-100 text-green-700' };
}

function getDifficultyLabel(difficulty: RecommendationDifficulty) {
  if (difficulty === 'easy') {
    return 'Թեթև';
  }

  if (difficulty === 'medium') {
    return 'Միջին';
  }

  return 'Բարդ';
}

function getTrendLabel(trend: RecommendationTrend) {
  if (trend === 'up') {
    return 'Աճող';
  }

  if (trend === 'down') {
    return 'Նվազող';
  }

  if (trend === 'stable') {
    return 'Կայուն';
  }

  return 'Տվյալները քիչ են';
}

export default function TestsPage() {
  const TEN_SCALE_MAX_POINTS = 10;
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { myTests, currentTest, attempt, results, analytics, isLoading, error } = useAppSelector((state) => state.test);

  const isStudent = user?.role === 'student';
  const canManageTests = user?.role === 'teacher' || user?.role === 'director' || user?.role === 'admin';

  const [pageError, setPageError] = useState<string | null>(null);

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestListItem | null>(null);
  const [testFormState, setTestFormState] = useState<TestFormState>(getInitialTestFormState);
  const [testModalError, setTestModalError] = useState<string | null>(null);
  const [isSavingTest, setIsSavingTest] = useState(false);

  const [activeTakeTest, setActiveTakeTest] = useState<TestListItem | null>(null);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<number, number>>({});
  const [takeTestError, setTakeTestError] = useState<string | null>(null);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  const [activeAttemptTest, setActiveAttemptTest] = useState<TestListItem | null>(null);

  const [questionBuilderTest, setQuestionBuilderTest] = useState<TestListItem | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<TestQuestion | null>(null);
  const [questionFormState, setQuestionFormState] = useState<QuestionFormState>(getInitialQuestionFormState);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  const [insightsTest, setInsightsTest] = useState<TestListItem | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchMyTests());
  }, [dispatch]);

  useEffect(() => {
    if (!error) {
      return;
    }
    setPageError(error);
  }, [error]);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentTest());
      dispatch(clearTestError());
    };
  }, [dispatch]);

  const upcomingTests = useMemo(
    () => myTests.filter((test) => new Date(test.due_date) > new Date()),
    [myTests]
  );

  const pastTests = useMemo(
    () => myTests.filter((test) => new Date(test.due_date) <= new Date()),
    [myTests]
  );

  const openCreateTestModal = () => {
    setEditingTest(null);
    setTestFormState(getInitialTestFormState());
    setTestModalError(null);
    setIsTestModalOpen(true);
  };

  const openEditTestModal = (test: TestListItem) => {
    setEditingTest(test);
    setTestFormState({
      title: test.title,
      description: test.description ?? '',
      subject_id: String(test.subject_id),
      class_id: String(test.class_id),
      due_date: formatDateTimeLocal(test.due_date),
    });
    setTestModalError(null);
    setIsTestModalOpen(true);
  };

  const closeTestModal = () => {
    setEditingTest(null);
    setTestModalError(null);
    setIsTestModalOpen(false);
  };

  const openTakeTestModal = async (test: TestListItem) => {
    setTakeTestError(null);
    setAnswersByQuestionId({});
    setActiveTakeTest(test);

    try {
      await dispatch(fetchTestById(test.id)).unwrap();
    } catch (error) {
      setTakeTestError(resolveErrorMessage(error, 'Չհաջողվեց բեռնել թեստը'));
    }
  };

  const closeTakeTestModal = () => {
    setActiveTakeTest(null);
    setAnswersByQuestionId({});
    setTakeTestError(null);
  };

  const openAttemptModal = async (test: TestListItem) => {
    setActiveAttemptTest(test);
    setPageError(null);
    try {
      await dispatch(fetchMyTestAttempt(test.id)).unwrap();
    } catch (error) {
      setPageError(resolveErrorMessage(error, 'Չհաջողվեց բեռնել արդյունքը'));
      setActiveAttemptTest(null);
    }
  };

  const closeAttemptModal = () => {
    setActiveAttemptTest(null);
  };

  const openQuestionBuilder = async (test: TestListItem) => {
    setQuestionBuilderTest(test);
    setEditingQuestion(null);
    setQuestionFormState(getInitialQuestionFormState());
    setQuestionError(null);

    try {
      await dispatch(fetchTestById(test.id)).unwrap();
    } catch (error) {
      setQuestionError(resolveErrorMessage(error, 'Չհաջողվեց բեռնել հարցերը'));
    }
  };

  const closeQuestionBuilder = () => {
    setQuestionBuilderTest(null);
    setEditingQuestion(null);
    setQuestionError(null);
    setQuestionFormState(getInitialQuestionFormState());
  };

  const startQuestionEdit = (question: TestQuestion) => {
    setEditingQuestion(question);
    const correctOptionIndex = question.options.findIndex((option) => option.is_correct);
    setQuestionFormState({
      question_text: question.question_text,
      order_index: String(question.order_index),
      points: String(question.points),
      options: question.options
        .slice()
        .sort((left, right) => left.order_index - right.order_index)
        .map((option) => option.option_text),
      correct_index: String(Math.max(correctOptionIndex, 0)),
    });
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQuestionFormState(getInitialQuestionFormState());
    setQuestionError(null);
  };

  const openInsightsModal = async (test: TestListItem) => {
    setInsightsTest(test);
    setIsInsightsLoading(true);
    setPageError(null);

    try {
      await Promise.all([
        dispatch(fetchTestResults(test.id)).unwrap(),
        dispatch(fetchTestAnalytics(test.id)).unwrap(),
      ]);
    } catch (error) {
      setPageError(resolveErrorMessage(error, 'Չհաջողվեց բեռնել արդյունքները'));
      setInsightsTest(null);
    } finally {
      setIsInsightsLoading(false);
    }
  };

  const closeInsightsModal = () => {
    setInsightsTest(null);
  };

  const handleSaveTest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTestModalError(null);
    setPageError(null);

    const title = testFormState.title.trim();
    const description = testFormState.description.trim();
    const subjectId = Number(testFormState.subject_id);
    const classId = Number(testFormState.class_id);
    const dueDate = new Date(testFormState.due_date);

    if (!title) {
      setTestModalError('Նշեք թեստի վերնագիրը');
      return;
    }

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      setTestModalError('Առարկայի ID-ն պետք է լինի դրական ամբողջ թիվ');
      return;
    }

    if (!Number.isInteger(classId) || classId <= 0) {
      setTestModalError('Դասարանի ID-ն պետք է լինի դրական ամբողջ թիվ');
      return;
    }

    if (Number.isNaN(dueDate.getTime())) {
      setTestModalError('Վերջնաժամկետը սխալ է');
      return;
    }

    setIsSavingTest(true);
    try {
      if (editingTest) {
        await dispatch(
          updateTest({
            testId: editingTest.id,
            data: {
              title,
              description,
              subject_id: subjectId,
              class_id: classId,
              due_date: dueDate.toISOString(),
            },
          })
        ).unwrap();
      } else {
        await dispatch(
          createTest({
            title,
            description,
            subject_id: subjectId,
            class_id: classId,
            due_date: dueDate.toISOString(),
          })
        ).unwrap();
      }

      await dispatch(fetchMyTests()).unwrap();
      closeTestModal();
    } catch (error) {
      setTestModalError(resolveErrorMessage(error, 'Թեստի պահպանումը չհաջողվեց'));
    } finally {
      setIsSavingTest(false);
    }
  };

  const handleDeleteTest = async (test: TestListItem) => {
    const isConfirmed = window.confirm(`Հեռացնե՞լ «${test.title}» թեստը:`);
    if (!isConfirmed) {
      return;
    }

    setPageError(null);
    try {
      await dispatch(deleteTest(test.id)).unwrap();
    } catch (error) {
      setPageError(resolveErrorMessage(error, 'Թեստի ջնջումը չհաջողվեց'));
    }
  };

  const handleTogglePublish = async (test: TestListItem) => {
    setPageError(null);
    try {
      if (test.is_published) {
        await dispatch(unpublishTest(test.id)).unwrap();
      } else {
        await dispatch(publishTest(test.id)).unwrap();
      }
      await dispatch(fetchMyTests()).unwrap();
    } catch (error) {
      setPageError(resolveErrorMessage(error, 'Թեստի կարգավիճակի թարմացումը չհաջողվեց'));
    }
  };

  const handleSubmitTest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeTakeTest || !currentTest) {
      return;
    }

    setTakeTestError(null);

    if (currentTest.questions.length === 0) {
      setTakeTestError('Այս թեստում հարցեր չկան');
      return;
    }

    const answers = currentTest.questions.map((question) => ({
      question_id: question.id,
      selected_option_id: answersByQuestionId[question.id] ?? 0,
    }));

    if (answers.some((answer) => answer.selected_option_id <= 0)) {
      setTakeTestError('Պատասխանեք բոլոր հարցերին');
      return;
    }

    setIsSubmittingTest(true);
    try {
      await dispatch(
        submitTest({
          testId: activeTakeTest.id,
          data: { answers },
        })
      ).unwrap();
      await dispatch(fetchMyTests()).unwrap();
      closeTakeTestModal();
      await openAttemptModal(activeTakeTest);
    } catch (error) {
      setTakeTestError(resolveErrorMessage(error, 'Թեստի հանձնումը չհաջողվեց'));
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const handleSaveQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!questionBuilderTest) {
      return;
    }

    setQuestionError(null);

    const questionText = questionFormState.question_text.trim();
    const orderIndex = Number(questionFormState.order_index);
    const points = Number(questionFormState.points);
    const correctIndex = Number(questionFormState.correct_index);

    if (!questionText) {
      setQuestionError('Հարցի տեքստը պարտադիր է');
      return;
    }

    if (!Number.isInteger(orderIndex) || orderIndex <= 0) {
      setQuestionError('Հերթական համարը պետք է լինի դրական ամբողջ թիվ');
      return;
    }

    if (!Number.isInteger(points) || points <= 0) {
      setQuestionError('Միավորները պետք է լինեն դրական ամբողջ թիվ');
      return;
    }

    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      setQuestionError('Ընտրեք ճիշտ պատասխանը');
      return;
    }

    const cleanedOptions = questionFormState.options.map((option) => option.trim());
    if (cleanedOptions.some((option) => !option)) {
      setQuestionError('Բոլոր 4 տարբերակները պարտադիր են');
      return;
    }

    setIsSavingQuestion(true);
    try {
      const optionsPayload = cleanedOptions.map((optionText, index) => ({
        option_text: optionText,
        order_index: index + 1,
        is_correct: index === correctIndex,
      }));

      if (editingQuestion) {
        await dispatch(
          updateTestQuestion({
            testId: questionBuilderTest.id,
            questionId: editingQuestion.id,
            data: {
              question_text: questionText,
              order_index: orderIndex,
              points,
              options: optionsPayload,
            },
          })
        ).unwrap();
      } else {
        await dispatch(
          createTestQuestions({
            testId: questionBuilderTest.id,
            questions: [
              {
                question_text: questionText,
                order_index: orderIndex,
                points,
                options: optionsPayload,
              },
            ],
          })
        ).unwrap();
      }

      await dispatch(fetchTestById(questionBuilderTest.id)).unwrap();
      resetQuestionForm();
    } catch (error) {
      setQuestionError(resolveErrorMessage(error, 'Հարցի պահպանումը չհաջողվեց'));
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (question: TestQuestion) => {
    if (!questionBuilderTest) {
      return;
    }

    const isConfirmed = window.confirm('Հեռացնե՞լ այս հարցը');
    if (!isConfirmed) {
      return;
    }

    setQuestionError(null);
    try {
      await dispatch(
        deleteTestQuestion({
          testId: questionBuilderTest.id,
          questionId: question.id,
        })
      ).unwrap();
      await dispatch(fetchTestById(questionBuilderTest.id)).unwrap();
    } catch (error) {
      setQuestionError(resolveErrorMessage(error, 'Հարցի ջնջումը չհաջողվեց'));
    }
  };

  const renderTeacherCardActions = (test: TestListItem) => (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => openEditTestModal(test)}
          className="px-3 py-1.5 text-sm rounded-lg border border-blue-200 text-blue-main hover:bg-blue-50"
        >
          Խմբագրել
        </button>
        <button
          type="button"
          onClick={() => void handleDeleteTest(test)}
          className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
        >
          Ջնջել
        </button>
        <button
          type="button"
          onClick={() => void handleTogglePublish(test)}
          className="px-3 py-1.5 text-sm rounded-lg border border-green-200 text-green-700 hover:bg-green-50"
        >
          {test.is_published ? 'Թաքցնել' : 'Հրապարակել'}
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void openQuestionBuilder(test)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Կառավարել հարցերը
        </button>
        <button
          type="button"
          onClick={() => void openInsightsModal(test)}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          Արդյունքներ / Analytics
        </button>
      </div>
    </div>
  );

  const renderStudentCardActions = (test: TestListItem) => {
    const hasAttempt = Boolean(test.attempt);

    return (
      <div className="mt-4 space-y-3">
        {hasAttempt && test.attempt ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            <p className="font-semibold">
              Արդյունք: {test.attempt.score_points}/{TEN_SCALE_MAX_POINTS}
            </p>
            <p>{test.attempt.percentage}%</p>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void openTakeTestModal(test)}
            disabled={hasAttempt || test.is_closed}
            className="px-4 py-2 rounded-lg bg-blue-main text-white hover:bg-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {hasAttempt ? 'Արդեն հանձնված է' : test.is_closed ? 'Ժամկետն ավարտված է' : 'Անցնել թեստը'}
          </button>
          <button
            type="button"
            onClick={() => void openAttemptModal(test)}
            disabled={!hasAttempt}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Դիտել արդյունքը
          </button>
        </div>
      </div>
    );
  };

  const renderTestCard = (test: TestListItem) => {
    const badge = getTestStatusBadge(test);

    return (
      <div key={test.id} className="bg-white rounded-xl shadow-soft p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">{test.title}</h3>
            {test.description && <p className="mt-1 text-sm text-gray-500">{test.description}</p>}
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>{badge.label}</span>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Վերջնաժամկետ</span>
            <span className="text-gray-700">{formatDisplayDate(test.due_date)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Հարցեր</span>
            <span className="font-medium text-blue-main">{test.questions_count}</span>
          </div>
          {!isStudent && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Փորձեր</span>
              <span className="font-medium text-indigo-600">{test.attempts_count ?? 0}</span>
            </div>
          )}
        </div>

        {isStudent ? renderStudentCardActions(test) : renderTeacherCardActions(test)}
      </div>
    );
  };

  if (isLoading && myTests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Թեստեր</h2>
        {canManageTests && (
          <button
            type="button"
            onClick={openCreateTestModal}
            className="px-4 py-2 bg-blue-main text-white rounded-lg hover:bg-blue-dark transition-colors"
          >
            + Ստեղծել թեստ
          </button>
        )}
      </div>

      {pageError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{pageError}</div>
      )}

      {myTests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft p-12 text-center text-gray-600">Թեստեր դեռ չկան</div>
      ) : (
        <>
          {upcomingTests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Առաջիկա ({upcomingTests.length})</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{upcomingTests.map(renderTestCard)}</div>
            </div>
          )}

          {pastTests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Փակված ({pastTests.length})</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{pastTests.map(renderTestCard)}</div>
            </div>
          )}
        </>
      )}

      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{editingTest ? 'Խմբագրել թեստը' : 'Ստեղծել թեստ'}</h3>
              <button onClick={closeTestModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="space-y-5 px-6 py-5">
              {testModalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{testModalError}</div>}

              <div>
                <label htmlFor="test_title" className="block text-sm font-medium text-gray-700">
                  Վերնագիր
                </label>
                <input
                  id="test_title"
                  type="text"
                  value={testFormState.title}
                  onChange={(event) => setTestFormState((state) => ({ ...state, title: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  placeholder="Թեստի անվանում"
                  required
                />
              </div>

              <div>
                <label htmlFor="test_description" className="block text-sm font-medium text-gray-700">
                  Նկարագրություն
                </label>
                <textarea
                  id="test_description"
                  value={testFormState.description}
                  onChange={(event) => setTestFormState((state) => ({ ...state, description: event.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="test_subject_id" className="block text-sm font-medium text-gray-700">
                    Առարկայի ID
                  </label>
                  <input
                    id="test_subject_id"
                    type="number"
                    min={1}
                    value={testFormState.subject_id}
                    onChange={(event) => setTestFormState((state) => ({ ...state, subject_id: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="test_class_id" className="block text-sm font-medium text-gray-700">
                    Դասարանի ID
                  </label>
                  <input
                    id="test_class_id"
                    type="number"
                    min={1}
                    value={testFormState.class_id}
                    onChange={(event) => setTestFormState((state) => ({ ...state, class_id: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="test_due_date" className="block text-sm font-medium text-gray-700">
                  Վերջնաժամկետ
                </label>
                <input
                  id="test_due_date"
                  type="datetime-local"
                  value={testFormState.due_date}
                  onChange={(event) => setTestFormState((state) => ({ ...state, due_date: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={closeTestModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                  Չեղարկել
                </button>
                <button type="submit" disabled={isSavingTest} className="px-4 py-2 rounded-lg bg-blue-main text-white hover:bg-blue-dark disabled:opacity-50">
                  {isSavingTest ? 'Պահպանում...' : 'Պահպանել'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTakeTest && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{activeTakeTest.title}</h3>
                <p className="text-sm text-gray-500">Վերջնաժամկետ՝ {formatDisplayDate(activeTakeTest.due_date)}</p>
              </div>
              <button onClick={closeTakeTestModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitTest} className="space-y-5 px-6 py-5">
              {takeTestError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{takeTestError}</div>}

              {currentTest?.questions.map((question, index) => (
                <div key={question.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-gray-900">{index + 1}. {question.question_text}</p>
                    <span className="text-sm text-blue-main font-medium">{question.points} միավոր</span>
                  </div>

                  <div className="space-y-2">
                    {question.options
                      .slice()
                      .sort((left, right) => left.order_index - right.order_index)
                      .map((option) => (
                        <label key={option.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name={`question_${question.id}`}
                            checked={answersByQuestionId[question.id] === option.id}
                            onChange={() =>
                              setAnswersByQuestionId((state) => ({
                                ...state,
                                [question.id]: option.id,
                              }))
                            }
                          />
                          <span className="text-gray-800">{option.option_text}</span>
                        </label>
                      ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={closeTakeTestModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                  Փակել
                </button>
                <button type="submit" disabled={isSubmittingTest} className="px-4 py-2 rounded-lg bg-blue-main text-white hover:bg-blue-dark disabled:opacity-50">
                  {isSubmittingTest ? 'Հանձնվում է...' : 'Հանձնել թեստը'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeAttemptTest && attempt && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Արդյունք</h3>
              <button onClick={closeAttemptModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close">
                ×
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm text-green-700">Միավոր</p>
                <p className="text-2xl font-bold text-green-800">
                  {attempt.attempt.score_points}/{TEN_SCALE_MAX_POINTS}
                </p>
                <p className="text-sm text-green-700">{attempt.attempt.percentage}%</p>
              </div>

              {attempt.recommendations && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-blue-900">Անհատական առաջարկներ</h4>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getRecommendationLevelBadge(attempt.recommendations.level).className}`}>
                      {getRecommendationLevelBadge(attempt.recommendations.level).label}
                    </span>
                  </div>

                  <p className="text-sm text-blue-900">{attempt.recommendations.summary}</p>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg bg-white/70 px-3 py-2">
                      <p className="text-xs text-gray-500">Հաջորդ բարդություն</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {getDifficultyLabel(attempt.recommendations.recommended_difficulty)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/70 px-3 py-2">
                      <p className="text-xs text-gray-500">Առարկայի միջին</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {attempt.recommendations.subject_context.average_grade ?? '—'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/70 px-3 py-2">
                      <p className="text-xs text-gray-500">Միտում</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {getTrendLabel(attempt.recommendations.subject_context.trend)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Հաջորդ քայլեր</p>
                    <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                      {attempt.recommendations.action_items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Ուշադրության հարցեր</p>
                    {attempt.recommendations.focus_questions.length > 0 ? (
                      <div className="space-y-2">
                        {attempt.recommendations.focus_questions.map((item) => (
                          <div key={item.question_id} className="rounded-lg border border-blue-100 bg-white px-3 py-2">
                            <p className="text-sm font-medium text-gray-900">{item.question_text}</p>
                            <p className="mt-1 text-xs text-gray-600">Ձեր պատասխանը: {item.selected_option_text}</p>
                            <p className="text-xs text-gray-600">Ճիշտ պատասխանը: {item.correct_option_text}</p>
                            <p className="text-xs text-red-700">Կորցրած միավոր: {item.points_lost}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">Այս փորձում ուշադրության հատուկ հարցեր չկան։</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {attempt.answers.map((answer) => (
                  <div key={answer.id} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-medium text-gray-900">{answer.question_text ?? `Հարց #${answer.question_id}`}</p>
                    <p className="text-sm text-gray-700 mt-1">Ձեր պատասխանը: {answer.selected_option_text ?? '—'}</p>
                    {!answer.is_correct && answer.correct_option_text && (
                      <p className="text-sm text-gray-700 mt-1">Ճիշտ պատասխանը: {answer.correct_option_text}</p>
                    )}
                    <p className={`text-sm mt-1 ${answer.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                      {answer.is_correct ? 'Ճիշտ' : 'Սխալ'} • +{answer.awarded_points}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {questionBuilderTest && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Հարցերի կոնստրուկտոր</h3>
                <p className="text-sm text-gray-500">{questionBuilderTest.title}</p>
              </div>
              <button onClick={closeQuestionBuilder} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close">
                ×
              </button>
            </div>

            <div className="grid gap-6 px-6 py-5 lg:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Առկա հարցեր</h4>
                {currentTest?.questions?.length ? (
                  currentTest.questions
                    .slice()
                    .sort((left, right) => left.order_index - right.order_index)
                    .map((question) => (
                      <div key={question.id} className="rounded-lg border border-gray-200 p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-gray-900">#{question.order_index} {question.question_text}</p>
                          <span className="text-xs text-blue-main">{question.points} միավոր</span>
                        </div>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {question.options
                            .slice()
                            .sort((left, right) => left.order_index - right.order_index)
                            .map((option) => (
                              <li key={option.id} className={option.is_correct ? 'text-green-700 font-medium' : ''}>
                                {option.order_index}. {option.option_text}
                              </li>
                            ))}
                        </ul>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => startQuestionEdit(question)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 text-blue-main hover:bg-blue-50"
                          >
                            Խմբագրել
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteQuestion(question)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Ջնջել
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-gray-600">
                    Հարցեր դեռ չկան
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{editingQuestion ? 'Խմբագրել հարցը' : 'Ավելացնել հարց'}</h4>
                <form onSubmit={handleSaveQuestion} className="space-y-3">
                  {questionError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{questionError}</div>}

                  <div>
                    <label htmlFor="question_text" className="block text-sm font-medium text-gray-700">Հարց</label>
                    <textarea
                      id="question_text"
                      value={questionFormState.question_text}
                      onChange={(event) =>
                        setQuestionFormState((state) => ({
                          ...state,
                          question_text: event.target.value,
                        }))
                      }
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="question_order" className="block text-sm font-medium text-gray-700">Հերթական համար</label>
                      <input
                        id="question_order"
                        type="number"
                        min={1}
                        value={questionFormState.order_index}
                        onChange={(event) =>
                          setQuestionFormState((state) => ({
                            ...state,
                            order_index: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="question_points" className="block text-sm font-medium text-gray-700">Միավորներ</label>
                      <input
                        id="question_points"
                        type="number"
                        min={1}
                        value={questionFormState.points}
                        onChange={(event) =>
                          setQuestionFormState((state) => ({
                            ...state,
                            points: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Պատասխանների տարբերակներ (4)</p>
                    {questionFormState.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct_option"
                          checked={Number(questionFormState.correct_index) === index}
                          onChange={() =>
                            setQuestionFormState((state) => ({
                              ...state,
                              correct_index: String(index),
                            }))
                          }
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(event) =>
                            setQuestionFormState((state) => ({
                              ...state,
                              options: state.options.map((item, optionIndex) =>
                                optionIndex === index ? event.target.value : item
                              ),
                            }))
                          }
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-main focus:border-transparent"
                          placeholder={`Տարբերակ ${index + 1}`}
                          required
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">Կլորակը նշում է ճիշտ պատասխանը։</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t pt-3">
                    {editingQuestion && (
                      <button type="button" onClick={resetQuestionForm} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                        Չեղարկել խմբագրումը
                      </button>
                    )}
                    <button type="submit" disabled={isSavingQuestion} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                      {isSavingQuestion ? 'Պահպանում...' : editingQuestion ? 'Թարմացնել հարցը' : 'Ավելացնել հարցը'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {insightsTest && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Արդյունքներ և Analytics</h3>
                <p className="text-sm text-gray-500">{insightsTest.title}</p>
              </div>
              <button onClick={closeInsightsModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close">
                ×
              </button>
            </div>

            <div className="space-y-6 px-6 py-5">
              {isInsightsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-main"></div>
                </div>
              ) : (
                <>
                  {analytics && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl bg-blue-main text-white p-4">
                        <p className="text-sm opacity-80">Միջին %</p>
                        <p className="text-2xl font-bold">{analytics.average_score}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Փորձեր</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.attempts_total}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Դասարանի աշակերտներ</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.students_total}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Completion</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.completion_rate}%</p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b bg-gray-50">
                      <h4 className="font-semibold text-gray-900">Ուսանողների արդյունքներ</h4>
                    </div>
                    {results.length === 0 ? (
                      <div className="p-4 text-gray-600">Արդյունքներ դեռ չկան</div>
                    ) : (
                      <div className="divide-y">
                        {results.map((item) => (
                          <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {(item.student_first_name || item.student_last_name)
                                  ? `${item.student_first_name ?? ''} ${item.student_last_name ?? ''}`.trim()
                                  : `Աշակերտ #${item.student_id}`}
                              </p>
                              <p className="text-sm text-gray-500">{formatDisplayDate(item.submitted_at)}</p>
                            </div>
                            <p className="font-semibold text-blue-main">{item.score_points}/{TEN_SCALE_MAX_POINTS} ({item.percentage}%)</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {analytics && (
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 border-b bg-gray-50">
                        <h4 className="font-semibold text-gray-900">Հարցերի բարդություն</h4>
                      </div>
                      <div className="divide-y">
                        {analytics.question_stats.map((item) => (
                          <div key={item.question_id} className="px-4 py-3 flex items-center justify-between">
                            <p className="text-gray-800">Հարց #{item.question_id}</p>
                            <p className="text-sm text-gray-600">Ճիշտ՝ {item.correct_rate}% • Սխալներ՝ {item.wrong_count}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
