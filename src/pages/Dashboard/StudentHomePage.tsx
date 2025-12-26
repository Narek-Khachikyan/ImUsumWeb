import { Suspense, lazy, useEffect, useMemo, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMyAssignments } from '@/app/slices/assignmentSlice';
import { fetchGradeSummary } from '@/app/slices/gradeSlice';
import { fetchMySchedule } from '@/app/slices/scheduleSlice';
import type { Schedule } from '@/services/scheduleService';
import {
  copy,
  sampleAnnouncements,
  sampleDiscounts,
  sampleLessonsByDay,
  weekDays,
} from './student-home/constants';
import type { LessonItem, TimetableDay, WeekDayKey } from './student-home/types';
import {
  formatGradeBadge,
  formatTimeRange,
  getTodayKey,
  groupScheduleByDay,
  isNowWithinRange,
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

export default function StudentHomePage() {
  const dispatch = useAppDispatch();
  const { mySchedule, isLoading: scheduleLoading } = useAppSelector((state) => state.schedule);
  const { myAssignments, isLoading: assignmentsLoading } = useAppSelector((state) => state.assignment);
  const { summary, isLoading: gradeLoading } = useAppSelector((state) => state.grade);
  const [activeNav, setActiveNav] = useState<NavKey>('home');

  useEffect(() => {
    dispatch(fetchMySchedule());
    dispatch(fetchMyAssignments());
    dispatch(fetchGradeSummary());
  }, [dispatch]);

  const todayKey = getTodayKey();

  const scheduleByDay = useMemo(() => {
    if (mySchedule.length === 0) {
      return emptyScheduleMap;
    }
    return groupScheduleByDay(mySchedule);
  }, [mySchedule]);

  const summaryBySubject = useMemo(() => {
    return new Map(summary.map((item) => [item.subject_id, item]));
  }, [summary]);

  const shouldUseSampleLessons = mySchedule.length === 0;

  const timetableDays = useMemo<TimetableDay[]>(() => {
    return weekDays.map((day) => {
      const lessons: LessonItem[] = shouldUseSampleLessons
        ? sampleLessonsByDay[day.key]
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
              <Suspense fallback={<AnnouncementSkeleton />}>
                <AnnouncementSlider items={sampleAnnouncements} />
              </Suspense>
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

            <section>
              <h2 className="mb-4 text-2xl font-extrabold text-blue-main">{copy.discountsTitle}</h2>
              <div className="space-y-4">
                {sampleDiscounts.map((discount) => (
                  <DiscountCard key={discount.id} item={discount} />
                ))}
              </div>
            </section>

            <QuickActionButton>{copy.buttons.allDiscounts}</QuickActionButton>
          </aside>
        </div>
      </div>

      <BottomNav activeKey={activeNav} onChange={handleNavChange} />
    </div>
  );
}
