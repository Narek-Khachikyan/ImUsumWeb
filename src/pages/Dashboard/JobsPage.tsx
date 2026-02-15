import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  applyToJob,
  createJobPosting,
  deleteJobPosting,
  fetchJobs,
  fetchMyJobApplications,
  fetchMyJobEligibility,
  updateJobPosting,
} from '@/app/slices/jobsSlice';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api';
import { jobsService } from '@/services/jobsService';

interface JobFormState {
  title: string;
  description: string;
  company_name: string;
  contact_email: string;
  external_url: string;
  is_active: boolean;
}

interface EligibilityOverrideFormState {
  student_id: string;
  eligible: boolean;
  reason: string;
}

function getInitialFormState(): JobFormState {
  return {
    title: '',
    description: '',
    company_name: '',
    contact_email: '',
    external_url: '',
    is_active: true,
  };
}

function getInitialOverrideFormState(): EligibilityOverrideFormState {
  return {
    student_id: '',
    eligible: true,
    reason: '',
  };
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return getApiErrorMessage(error, fallback);
}

function getApplicationStatusLabel(status: string): string {
  if (status === 'APPROVED') {
    return 'Հաստատված';
  }
  if (status === 'REJECTED') {
    return 'Մերժված';
  }
  return 'Սպասման մեջ';
}

export default function JobsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { jobs, myApplications, eligibility, isLoading, error } = useAppSelector((state) => state.jobs);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [formState, setFormState] = useState<JobFormState>(getInitialFormState);

  const [overrideFormState, setOverrideFormState] = useState<EligibilityOverrideFormState>(
    getInitialOverrideFormState
  );
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);
  const [isSavingOverride, setIsSavingOverride] = useState(false);

  const isStudent = user?.role === 'student';
  const canManage = user?.role === 'director' || user?.role === 'admin';
  const canOverrideEligibility = user?.role === 'teacher' || canManage;

  useEffect(() => {
    void dispatch(fetchJobs(isStudent ? true : undefined));
  }, [dispatch, isStudent]);

  useEffect(() => {
    if (!isStudent) {
      return;
    }

    void dispatch(fetchMyJobEligibility());
    void dispatch(fetchMyJobApplications());
  }, [dispatch, isStudent]);

  const appliedByJobId = useMemo(() => {
    const map = new Map<number, string>();
    for (const app of myApplications) {
      map.set(app.job_posting_id, app.status);
    }
    return map;
  }, [myApplications]);

  const openCreateModal = () => {
    setEditingJobId(null);
    setFormState(getInitialFormState());
    setIsModalOpen(true);
  };

  const openEditModal = (jobId: number) => {
    const item = jobs.find((job) => job.id === jobId);
    if (!item) {
      return;
    }

    setEditingJobId(jobId);
    setFormState({
      title: item.title,
      description: item.description,
      company_name: item.company_name,
      contact_email: item.contact_email ?? '',
      external_url: item.external_url ?? '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingJobId(null);
    setFormState(getInitialFormState());
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage) {
      return;
    }

    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      company_name: formState.company_name.trim(),
      contact_email: formState.contact_email.trim() || undefined,
      external_url: formState.external_url.trim() || undefined,
      is_active: formState.is_active,
    };

    if (editingJobId) {
      await dispatch(
        updateJobPosting({
          jobId: editingJobId,
          data: payload,
        })
      ).unwrap();
    } else {
      await dispatch(createJobPosting(payload)).unwrap();
    }

    closeModal();
  };

  const handleDelete = async (jobId: number) => {
    if (!canManage) {
      return;
    }
    const isConfirmed = window.confirm('Ջնջե՞լ աշխատանքի առաջարկը');
    if (!isConfirmed) {
      return;
    }
    await dispatch(deleteJobPosting(jobId)).unwrap();
  };

  const handleApply = async (jobId: number) => {
    if (!isStudent) {
      return;
    }
    await dispatch(applyToJob({ jobId })).unwrap();
    await dispatch(fetchMyJobApplications()).unwrap();
  };

  const handleOverrideSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canOverrideEligibility) {
      return;
    }

    setOverrideError(null);
    setOverrideSuccess(null);

    const studentId = Number(overrideFormState.student_id);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      setOverrideError('Student ID-ն պետք է լինի դրական ամբողջ թիվ');
      return;
    }

    setIsSavingOverride(true);
    try {
      await jobsService.setEligibilityOverride(
        studentId,
        overrideFormState.eligible,
        overrideFormState.reason.trim() || undefined
      );
      setOverrideSuccess('Eligibility override-ը պահպանված է');
      setOverrideFormState(getInitialOverrideFormState());
    } catch (overrideSubmitError) {
      setOverrideError(resolveErrorMessage(overrideSubmitError, 'Չհաջողվեց պահպանել override-ը'));
    } finally {
      setIsSavingOverride(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Աշխատանքային հնարավորություններ</h1>
        {canManage && (
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-main px-4 py-2 text-sm font-semibold text-white hover:bg-blue-dark"
          >
            + Ավելացնել
          </button>
        )}
      </div>

      {isStudent && eligibility && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Իմ իրավասությունը</h2>
          <p className="mt-2 text-sm text-gray-600">
            {eligibility.eligible ? 'Դուք իրավասու եք դիմել առաջարկներին։' : 'Դուք դեռ իրավասու չեք դիմելու համար։'}
          </p>
          <p className="mt-1 text-sm text-gray-500">{eligibility.reason}</p>
          <p className="mt-1 text-xs text-gray-400">
            Աղբյուր: {eligibility.source === 'manual_override' ? 'ձեռքով override' : 'ավտոմատ կանոն'}
          </p>
        </section>
      )}

      {canOverrideEligibility && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Eligibility override</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleOverrideSubmit}>
            <div>
              <label htmlFor="override_student_id" className="block text-sm font-medium text-gray-700">
                Student ID
              </label>
              <input
                id="override_student_id"
                type="number"
                min={1}
                value={overrideFormState.student_id}
                onChange={(event) =>
                  setOverrideFormState((prev) => ({
                    ...prev,
                    student_id: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label htmlFor="override_eligible" className="block text-sm font-medium text-gray-700">
                Կարգավիճակ
              </label>
              <select
                id="override_eligible"
                value={overrideFormState.eligible ? 'eligible' : 'not_eligible'}
                onChange={(event) =>
                  setOverrideFormState((prev) => ({
                    ...prev,
                    eligible: event.target.value === 'eligible',
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="eligible">Eligible</option>
                <option value="not_eligible">Not eligible</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="override_reason" className="block text-sm font-medium text-gray-700">
                Պատճառ (optional)
              </label>
              <textarea
                id="override_reason"
                value={overrideFormState.reason}
                onChange={(event) =>
                  setOverrideFormState((prev) => ({
                    ...prev,
                    reason: event.target.value,
                  }))
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Override-ի պատճառը"
              />
            </div>

            {(overrideError || overrideSuccess) && (
              <div className="md:col-span-2">
                {overrideError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {overrideError}
                  </div>
                )}
                {overrideSuccess && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    {overrideSuccess}
                  </div>
                )}
              </div>
            )}

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingOverride}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingOverride ? 'Պահպանում...' : 'Պահպանել override'}
              </button>
            </div>
          </form>
        </section>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map((job) => {
          const appliedStatus = appliedByJobId.get(job.id);
          const canApply = isStudent && eligibility?.eligible && !appliedStatus && job.is_active;
          return (
            <article key={job.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.company_name}</p>
                </div>
                {!job.is_active && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    Անջատված
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-gray-700">{job.description}</p>
              {job.external_url && (
                <a
                  href={job.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm text-blue-main underline"
                >
                  Արտաքին հղում
                </a>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isStudent && (
                  <button
                    type="button"
                    disabled={!canApply || isLoading}
                    onClick={() => void handleApply(job.id)}
                    className="rounded-lg bg-blue-main px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {appliedStatus ? `Դիմել եք (${getApplicationStatusLabel(appliedStatus)})` : 'Դիմել'}
                  </button>
                )}

                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditModal(job.id)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Խմբագրել
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(job.id)}
                      className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      Ջնջել
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {isStudent && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Իմ դիմումները</h2>
          {myApplications.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Դիմումներ դեռ չկան</p>
          ) : (
            <div className="mt-3 divide-y">
              {myApplications.map((application) => (
                <div key={application.id} className="py-2 text-sm text-gray-700">
                  <p className="font-medium text-gray-900">
                    {application.job_posting?.title ?? `Job #${application.job_posting_id}`}
                  </p>
                  <p className="text-gray-500">Կարգավիճակ: {getApplicationStatusLabel(application.status)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {jobs.length === 0 && !isLoading && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          Առայժմ առաջարկներ չկան
        </div>
      )}

      {isModalOpen && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900">{editingJobId ? 'Խմբագրել առաջարկը' : 'Նոր առաջարկ'}</h2>
            <form className="mt-4 space-y-3" onSubmit={(event) => void handleSave(event)}>
              <input
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Վերնագիր"
                required
              />
              <textarea
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                className="h-24 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Նկարագրություն"
                required
              />
              <input
                value={formState.company_name}
                onChange={(event) => setFormState((prev) => ({ ...prev, company_name: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Կազմակերպություն"
                required
              />
              <input
                value={formState.contact_email}
                onChange={(event) => setFormState((prev) => ({ ...prev, contact_email: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Contact email"
              />
              <input
                value={formState.external_url}
                onChange={(event) => setFormState((prev) => ({ ...prev, external_url: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="External URL"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formState.is_active}
                  onChange={(event) => setFormState((prev) => ({ ...prev, is_active: event.target.checked }))}
                />
                Ակտիվ
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-main px-4 py-2 text-sm font-semibold text-white"
                >
                  Պահպանել
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
