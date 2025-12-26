import { useMemo } from 'react';
import { copy } from '../constants';
import StatCard from './StatCard';

interface StatsSectionProps {
  lessonsTodayCount: number;
  upcomingAssignmentsCount: number;
  averageGrade: number | null;
  scheduleLoading: boolean;
  assignmentsLoading: boolean;
  gradeLoading: boolean;
}

const StatsSection = ({
  lessonsTodayCount,
  upcomingAssignmentsCount,
  averageGrade,
  scheduleLoading,
  assignmentsLoading,
  gradeLoading,
}: StatsSectionProps) => {
  const statCards = useMemo(
    () => [
      {
        id: 'lessons',
        title: copy.stats.lessonsToday,
        value: `${lessonsTodayCount}`,
        isLoading: scheduleLoading,
        iconWrapperClassName: 'bg-blue-100 text-blue-main',
        icon: (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        ),
      },
      {
        id: 'assignments',
        title: copy.stats.upcomingAssignments,
        value: `${upcomingAssignmentsCount}`,
        isLoading: assignmentsLoading,
        iconWrapperClassName: 'bg-orange-100 text-orange-600',
        icon: (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        ),
      },
      {
        id: 'average',
        title: copy.stats.averageGrade,
        value: averageGrade !== null ? averageGrade.toFixed(1) : '-',
        isLoading: gradeLoading,
        iconWrapperClassName: 'bg-green-100 text-green-600',
        icon: (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        ),
      },
    ],
    [
      lessonsTodayCount,
      scheduleLoading,
      upcomingAssignmentsCount,
      assignmentsLoading,
      averageGrade,
      gradeLoading,
    ]
  );

  return (
    <div className="grid gap-4">
      {statCards.map((card) => (
        <StatCard
          key={card.id}
          title={card.title}
          value={card.value}
          icon={card.icon}
          iconWrapperClassName={card.iconWrapperClassName}
          isLoading={card.isLoading}
        />
      ))}
    </div>
  );
};

export default StatsSection;
