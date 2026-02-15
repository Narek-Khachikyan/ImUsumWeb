import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMyAssignments } from '@/app/slices/assignmentSlice';
import { checkInAttendanceByGeo, fetchMyAttendance } from '@/app/slices/attendanceSlice';
import { fetchGradeSummary } from '@/app/slices/gradeSlice';
import { fetchMySchedule } from '@/app/slices/scheduleSlice';
import { blogService } from '@/services/blogService';
import { offersService } from '@/services/offersService';
import type { Offer } from '@/types/offers';
import type { Schedule } from '@/services/scheduleService';

import {
  copy,
  sampleLessonsByDay,
  weekDays,
} from './student-home/constants';
import type {
  AnnouncementItem,
  DiscountItem,
  LessonItem,
  TimetableDay,
  WeekDayKey,
} from './student-home/types';
import {
  formatGradeBadge,
  formatTimeRange,
  getTodayKey,
  groupScheduleByDay,
  isNowWithinRange,
  isNowWithinTimeRange,
} from './student-home/utils';
import NotificationBell from './student-home/components/NotificationBell';
import QuickActionButton from './student-home/components/QuickActionButton';
import DiscountCard from './student-home/components/DiscountCard';
import BottomNav, { type NavKey } from './student-home/components/BottomNav';
import { AnnouncementSkeleton, TimetableSkeleton } from './student-home/components/Skeletons';
import StatsSection from './student-home/components/StatsSection';

const AnnouncementSlider = lazy(() => import('./student-home/components/AnnouncementSlider'));
const TimetableSlider = lazy(() => import('./student-home/components/TimetableSlider'));

const emptyScheduleMap: Record<WeekDayKey, Schedule[]> = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
};

const CHECK_IN_BEFORE_MINUTES = 15;
const CHECK_IN_AFTER_MINUTES = 20;

function toWeekDayKey(dayOfWeek: string): WeekDayKey | null {
  const normalized = dayOfWeek.toLowerCase();
  if (
    normalized === 'monday' ||
    normalized === 'tuesday' ||
    normalized === 'wednesday' ||
    normalized === 'thursday' ||
    normalized === 'friday'
  ) {
    return normalized;
  }
  return null;
}

function normalizeScheduleDay(schedule: Schedule): Schedule {
  const key = toWeekDayKey(schedule.day_of_week);
  return {
    ...schedule,
    day_of_week: key ?? schedule.day_of_week,
  };
}

function toAnnouncementItem(input: {
  id: number;
  title: string;
  date: string;
  letter: string;
  image: string | null;
  hot: boolean | null;
}): AnnouncementItem {
  return {
    id: String(input.id),
    title: input.title,
    date: new Date(input.date).toLocaleDateString('ru-RU'),
    description: input.letter,
    imageUrl: input.image ?? undefined,
    badge: input.hot ? 'Hot' : undefined,
  };
}

function extractDiscountLabel(offer: Offer): string {
  const match = offer.description?.match(/\d{1,3}%/);
  if (match?.[0]) {
    return match[0];
  }
  if (offer.category) {
    return offer.category.toUpperCase();
  }
  return 'Առաջարկ';
}

function toDiscountItem(offer: Offer): DiscountItem {
  return {
    id: String(offer.id),
    brand: offer.brand_name,
    date: offer.created_at ? new Date(offer.created_at).toLocaleDateString('ru-RU') : '',
    points: offer.price,
    discount: extractDiscountLabel(offer),
    imageUrl: offer.image_url ?? undefined,
  };
}

function parseTimeToMinutes(value: string): number | null {
  const parts = value.split(':');
  if (parts.length < 2) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
}

function isWithinCheckInWindow(startTime: string, now = new Date()): boolean {
  const startMinutes = parseTimeToMinutes(startTime);
  if (startMinutes === null) {
    return false;
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openAt = startMinutes - CHECK_IN_BEFORE_MINUTES;
  const closeAt = startMinutes + CHECK_IN_AFTER_MINUTES;

  return nowMinutes >= openAt && nowMinutes <= closeAt;
}

function todayDateParam(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function StudentHomePage() {
  const dispatch = useAppDispatch();
  const { mySchedule, isLoading: scheduleLoading } = useAppSelector((state) => state.schedule);
  const { myAssignments, isLoading: assignmentsLoading } = useAppSelector((state) => state.assignment);
  const { summary, isLoading: gradeLoading } = useAppSelector((state) => state.grade);
  const { myDay: attendanceDay, isCheckingIn, error: attendanceError } = useAppSelector(
    (state) => state.attendance
  );

  const [activeNav, setActiveNav] = useState<NavKey>('home');

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);

  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const [discountsError, setDiscountsError] = useState<string | null>(null);

  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInFallbackVisible, setCheckInFallbackVisible] = useState(false);
  const [autoCheckInAttempted, setAutoCheckInAttempted] = useState(false);

  useEffect(() => {
    void dispatch(fetchMySchedule());
    void dispatch(fetchMyAssignments());
    void dispatch(fetchGradeSummary());
    void dispatch(fetchMyAttendance(todayDateParam()));
  }, [dispatch]);

  useEffect(() => {
    let isCancelled = false;

    const loadAnnouncements = async () => {
      setAnnouncementsLoading(true);
      setAnnouncementsError(null);
      try {
        const items = await blogService.getAll();
        if (isCancelled) {
          return;
        }

        const sorted = items
          .slice()
          .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
          .slice(0, 6)
          .map(toAnnouncementItem);

        setAnnouncements(sorted);
      } catch {
        if (!isCancelled) {
          setAnnouncementsError('Չհաջողվեց բեռնել հայտարարությունները');
          setAnnouncements([]);
        }
      } finally {
        if (!isCancelled) {
          setAnnouncementsLoading(false);
        }
      }
    };

    const loadDiscounts = async () => {
      setDiscountsLoading(true);
      setDiscountsError(null);
      try {
        const offers = await offersService.getAll();
        if (isCancelled) {
          return;
        }

        const topActive = offers
          .filter((offer) => offer.is_available)
          .sort((left, right) => {
            const leftDate = left.created_at ? new Date(left.created_at).getTime() : 0;
            const rightDate = right.created_at ? new Date(right.created_at).getTime() : 0;
            return rightDate - leftDate;
          })
          .slice(0, 4)
          .map(toDiscountItem);

        setDiscounts(topActive);
      } catch {
        if (!isCancelled) {
          setDiscountsError('Չհաջողվեց բեռնել զեղչերը');
          setDiscounts([]);
        }
      } finally {
        if (!isCancelled) {
          setDiscountsLoading(false);
        }
      }
    };

    void loadAnnouncements();
    void loadDiscounts();

    return () => {
      isCancelled = true;
    };
  }, []);

  const todayKey = getTodayKey();

  const normalizedSchedule = useMemo(
    () => mySchedule.map((item) => normalizeScheduleDay(item)),
    [mySchedule]
  );

  const scheduleByDay = useMemo(() => {
    if (normalizedSchedule.length === 0) {
      return emptyScheduleMap;
    }
    return groupScheduleByDay(normalizedSchedule);
  }, [normalizedSchedule]);

  const summaryBySubject = useMemo(() => {
    return new Map(summary.map((item) => [item.subject_id, item]));
  }, [summary]);

  const shouldUseSampleLessons = normalizedSchedule.length === 0;

  const timetableDays = useMemo<TimetableDay[]>(() => {
    return weekDays.map((day) => {
      const lessons: LessonItem[] = shouldUseSampleLessons
        ? (sampleLessonsByDay[day.key] ?? []).map((lesson) => ({
            ...lesson,
            isActive: day.key === todayKey && isNowWithinTimeRange(lesson.time),
          }))
        : (scheduleByDay[day.key] ?? []).map((lesson, index) => {
            const summaryItem = summaryBySubject.get(lesson.subject_id);
            const gradeValue = formatGradeBadge(summaryItem?.average);

            return {
              id: lesson.id,
              title: summaryItem?.subject_name ?? `${copy.labels.lessonPrefix} ${lesson.subject_id}`,
              time: formatTimeRange(lesson.start_time, lesson.end_time),
              detail: lesson.room ? `${copy.labels.room}: ${lesson.room}` : undefined,
              grade: gradeValue,
              order: index + 1,
              isActive: day.key === todayKey && isNowWithinRange(lesson.start_time, lesson.end_time),
            };
          });

      return {
        ...day,
        lessons,
        isToday: day.key === todayKey,
      };
    });
  }, [scheduleByDay, shouldUseSampleLessons, summaryBySubject, todayKey]);

  const lessonsTodayCount = useMemo(() => {
    if (!todayKey) {
      return 0;
    }
    return timetableDays.find((day) => day.key === todayKey)?.lessons.length ?? 0;
  }, [timetableDays, todayKey]);

  const averageGrade = useMemo(() => {
    if (summary.length === 0) {
      return null;
    }
    const total = summary.reduce((acc, item) => acc + item.average, 0);
    return total / summary.length;
  }, [summary]);

  const upcomingAssignments = useMemo(() => {
    const now = new Date();
    return myAssignments.filter((assignment) => new Date(assignment.due_date) > now).slice(0, 5);
  }, [myAssignments]);

  const attendanceScheduleCandidate = useMemo(() => {
    if (!todayKey) {
      return null;
    }

    const todayLessons = scheduleByDay[todayKey] ?? [];
    return (
      todayLessons.find((lesson) => isWithinCheckInWindow(lesson.start_time)) ?? null
    );
  }, [scheduleByDay, todayKey]);

  const currentAttendanceItem = useMemo(() => {
    if (!attendanceScheduleCandidate) {
      return null;
    }
    return attendanceDay.find((item) => item.schedule_id === attendanceScheduleCandidate.id) ?? null;
  }, [attendanceDay, attendanceScheduleCandidate]);

  const canAttemptCheckIn = useMemo(() => {
    if (!attendanceScheduleCandidate) {
      return false;
    }
    const status = currentAttendanceItem?.status;
    return status !== 'PRESENT' && status !== 'LATE' && status !== 'EXCUSED';
  }, [attendanceScheduleCandidate, currentAttendanceItem]);

  const executeCheckIn = useCallback(
    async (position: GeolocationPosition) => {
      setCheckInError(null);
      setCheckInMessage(null);

      try {
        await dispatch(
          checkInAttendanceByGeo({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy_m: Number.isFinite(position.coords.accuracy)
              ? Math.round(position.coords.accuracy)
              : undefined,
          })
        ).unwrap();

        await dispatch(fetchMyAttendance(todayDateParam())).unwrap();
        setCheckInMessage('Ներկայությունը հաջողությամբ գրանցվեց');
        setCheckInFallbackVisible(false);
      } catch {
        setCheckInFallbackVisible(true);
        setCheckInError('Չհաջողվեց կատարել check-in։ Փորձեք կրկին։');
      }
    },
    [dispatch]
  );

  const requestGeoAndCheckIn = useCallback(async () => {
    if (!navigator.geolocation) {
      setCheckInFallbackVisible(true);
      setCheckInError('Ձեր բրաուզերը չի աջակցում geolocation');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void executeCheckIn(position);
      },
      () => {
        setCheckInFallbackVisible(true);
        setCheckInError('Չհաջողվեց ստանալ տեղադրությունը։ Օգտագործեք ձեռքով check-in։');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, [executeCheckIn]);

  useEffect(() => {
    if (!canAttemptCheckIn || autoCheckInAttempted) {
      return;
    }

    setAutoCheckInAttempted(true);
    void requestGeoAndCheckIn();
  }, [autoCheckInAttempted, canAttemptCheckIn, requestGeoAndCheckIn]);

  const handleNavChange = useCallback((key: NavKey) => {
    setActiveNav(key);
  }, []);

  const notificationCount = Math.min(upcomingAssignments.length, 9);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h2 className="mb-4 text-2xl font-extrabold text-blue-main">{copy.announcementsTitle}</h2>
              {announcementsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {announcementsError}
                </div>
              ) : announcementsLoading ? (
                <AnnouncementSkeleton />
              ) : announcements.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Հայտարարություններ չկան
                </div>
              ) : (
                <Suspense fallback={<AnnouncementSkeleton />}>
                  <AnnouncementSlider items={announcements} />
                </Suspense>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-extrabold text-blue-main">{copy.timetableTitle}</h2>
              <Suspense fallback={<TimetableSkeleton />}>
                <TimetableSlider days={timetableDays} isLoading={scheduleLoading} />
              </Suspense>
            </section>

            <QuickActionButton>{copy.buttons.activities}</QuickActionButton>
          </div>

          <aside className="space-y-8">
            <div className="flex justify-end">
              <NotificationBell count={notificationCount} />
            </div>

            <StatsSection
              lessonsTodayCount={lessonsTodayCount}
              upcomingAssignmentsCount={upcomingAssignments.length}
              averageGrade={averageGrade}
              scheduleLoading={scheduleLoading}
              assignmentsLoading={assignmentsLoading}
              gradeLoading={gradeLoading}
            />

            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-gray-900">Ներկայություն</h2>
              {!attendanceScheduleCandidate ? (
                <p className="mt-2 text-sm text-gray-600">Այս պահին check-in պատուհան չկա</p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-gray-700">
                    Դաս #{attendanceScheduleCandidate.subject_id} • {formatTimeRange(
                      attendanceScheduleCandidate.start_time,
                      attendanceScheduleCandidate.end_time
                    )}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Check-in պատուհան: -15/+20 րոպե</p>

                  {currentAttendanceItem && currentAttendanceItem.status !== 'PENDING' && (
                    <p className="mt-2 text-sm text-green-700">Կարգավիճակ: {currentAttendanceItem.status}</p>
                  )}

                  {(attendanceError || checkInError) && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      {checkInError ?? attendanceError}
                    </div>
                  )}
                  {checkInMessage && (
                    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700">
                      {checkInMessage}
                    </div>
                  )}

                  {(checkInFallbackVisible || canAttemptCheckIn) && (
                    <button
                      type="button"
                      onClick={() => void requestGeoAndCheckIn()}
                      disabled={isCheckingIn || !canAttemptCheckIn}
                      className="mt-3 w-full rounded-lg bg-blue-main px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCheckingIn ? 'Գրանցվում է...' : 'Ձեռքով check-in'}
                    </button>
                  )}
                </>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-extrabold text-blue-main">{copy.discountsTitle}</h2>

              {discountsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {discountsError}
                </div>
              ) : discountsLoading ? (
                <div className="space-y-3">
                  <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
                  <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
                </div>
              ) : discounts.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Զեղչեր դեռ չկան
                </div>
              ) : (
                <div className="space-y-4">
                  {discounts.map((discount) => (
                    <DiscountCard key={discount.id} item={discount} />
                  ))}
                </div>
              )}
            </section>

            <QuickActionButton>{copy.buttons.allDiscounts}</QuickActionButton>
          </aside>
        </div>
      </div>

      <BottomNav activeKey={activeNav} onChange={handleNavChange} />
    </div>
  );
}
