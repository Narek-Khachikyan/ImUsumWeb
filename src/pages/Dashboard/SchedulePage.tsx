import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMySchedule } from '@/app/slices/scheduleSlice';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api';
import { aiService, type OptimizeScheduleDraftResponse } from '@/services/aiService';

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

function normalizeDayKey(dayOfWeek: string): string {
  return dayOfWeek.toLowerCase();
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return getApiErrorMessage(error, fallback);
}

export default function SchedulePage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { mySchedule, isLoading } = useAppSelector((state) => state.schedule);

  const canUseAi = user?.role === 'director' || user?.role === 'admin';

  const [classId, setClassId] = useState('');
  const [draft, setDraft] = useState<OptimizeScheduleDraftResponse['draft'] | null>(null);
  const [workflowId, setWorkflowId] = useState<number | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isApplyingDraft, setIsApplyingDraft] = useState(false);

  useEffect(() => {
    void dispatch(fetchMySchedule());
  }, [dispatch]);

  const normalizedSchedule = useMemo(
    () => mySchedule.map((item) => ({ ...item, day_of_week: normalizeDayKey(item.day_of_week) })),
    [mySchedule]
  );

  const scheduleByDay = useMemo(
    () =>
      dayOrder.reduce(
        (acc, day) => {
          acc[day] = normalizedSchedule
            .filter((s) => s.day_of_week === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
          return acc;
        },
        {} as Record<string, typeof normalizedSchedule>
      ),
    [normalizedSchedule]
  );

  const handleGenerateDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canUseAi) {
      return;
    }

    setAiError(null);
    setAiSuccess(null);

    const parsedClassId = Number(classId);
    if (!Number.isInteger(parsedClassId) || parsedClassId <= 0) {
      setAiError('Դասարանի ID-ն պետք է լինի դրական ամբողջ թիվ');
      return;
    }

    setIsGeneratingDraft(true);
    try {
      const response = await aiService.optimizeScheduleDraft({ class_id: parsedClassId });
      setWorkflowId(response.workflow_id);
      setDraft(response.draft);
    } catch (error) {
      setAiError(resolveErrorMessage(error, 'Չհաջողվեց գեներացնել schedule draft'));
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleApplyDraft = async () => {
    if (!canUseAi || !workflowId) {
      return;
    }

    setAiError(null);
    setAiSuccess(null);
    setIsApplyingDraft(true);

    try {
      await aiService.applyScheduleWorkflow(workflowId);
      setAiSuccess('AI draft-ը կիրառվեց հաջողությամբ');
      setDraft(null);
      setWorkflowId(null);
      await dispatch(fetchMySchedule()).unwrap();
    } catch (error) {
      setAiError(resolveErrorMessage(error, 'Չհաջողվեց կիրառել workflow draft-ը'));
    } finally {
      setIsApplyingDraft(false);
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
        <h2 className="text-2xl font-bold text-gray-900">Իմ դասացուցակը</h2>
      </div>

      {canUseAi && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-gray-900">AI Schedule Workflow (Draft + Apply)</h3>
          <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={(event) => void handleGenerateDraft(event)}>
            <div>
              <label htmlFor="schedule_ai_class_id" className="block text-sm font-medium text-gray-700">
                Դասարանի ID
              </label>
              <input
                id="schedule_ai_class_id"
                type="number"
                min={1}
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                className="mt-1 w-44 rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isGeneratingDraft}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isGeneratingDraft ? 'Գեներացվում է...' : 'Գեներացնել draft'}
            </button>
          </form>

          {(aiError || aiSuccess) && (
            <div className="mt-3 space-y-2">
              {aiError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {aiError}
                </div>
              )}
              {aiSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {aiSuccess}
                </div>
              )}
            </div>
          )}

          {draft && (
            <div className="mt-4 space-y-3 rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-700">Workflow #{workflowId} • կարգավիճակ՝ DRAFT</p>
              <p className="text-sm text-gray-700">{draft.rationale}</p>

              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {draft.updates.map((update) => (
                  <div key={update.schedule_id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                    <p className="font-medium text-gray-900">Schedule #{update.schedule_id}</p>
                    <p className="text-gray-600">
                      {update.day_of_week} • {update.start_time} - {update.end_time}
                    </p>
                    <p className="text-gray-600">
                      Teacher #{update.teacher_id}
                      {update.room ? ` • Room ${update.room}` : ''}
                    </p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void handleApplyDraft()}
                disabled={isApplyingDraft}
                className="rounded-lg bg-blue-main px-4 py-2 text-sm font-semibold text-white hover:bg-blue-dark disabled:opacity-50"
              >
                {isApplyingDraft ? 'Կիրառվում է...' : 'Apply draft'}
              </button>
            </div>
          )}
        </section>
      )}

      {normalizedSchedule.length === 0 ? (
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
            if (!lessons || lessons.length === 0) {
              return null;
            }

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
                          <p className="font-medium text-gray-900">Առարկա #{lesson.subject_id}</p>
                          {lesson.room && <p className="text-sm text-gray-500">Սենյակ {lesson.room}</p>}
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium text-gray-900">{lesson.start_time}</p>
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
