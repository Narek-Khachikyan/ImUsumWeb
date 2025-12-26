import type { Schedule } from '@/services/scheduleService';
import type { WeekDayKey } from './types';

const dayIndexMap: Record<number, WeekDayKey | null> = {
  0: null,
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: null,
};

const toMinutes = (value: string): number | null => {
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

export const getTodayKey = (): WeekDayKey | null => dayIndexMap[new Date().getDay()] ?? null;

export const formatTimeRange = (start: string, end: string): string => {
  const startShort = start.slice(0, 5);
  const endShort = end.slice(0, 5);
  return `${startShort}–${endShort}`;
};

export const formatGradeBadge = (average?: number | null): string | undefined => {
  if (average === null || average === undefined || Number.isNaN(average)) {
    return undefined;
  }

  const rounded = Math.round(average);
  if (rounded <= 10) {
    return `${Math.max(1, rounded)}`;
  }

  const scaled = Math.round(average / 10);
  return `${Math.min(Math.max(scaled, 1), 10)}`;
};

export const isNowWithinRange = (start: string, end: string, now = new Date()): boolean => {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  if (startMinutes === null || endMinutes === null) {
    return false;
  }
  return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
};

export const parseTimeRange = (timeRange: string): { start: string; end: string } | null => {
  const parts = timeRange.split('–');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  return { start: parts[0].trim(), end: parts[1].trim() };
};

export const isNowWithinTimeRange = (timeRange: string, now = new Date()): boolean => {
  const parsed = parseTimeRange(timeRange);
  if (!parsed) {
    return false;
  }
  return isNowWithinRange(parsed.start, parsed.end, now);
};

export const groupScheduleByDay = (schedule: Schedule[]): Record<WeekDayKey, Schedule[]> => {
  const grouped: Record<WeekDayKey, Schedule[]> = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  };

  schedule.forEach((item) => {
    const key = item.day_of_week as WeekDayKey;
    if (grouped[key]) {
      grouped[key].push(item);
    }
  });

  Object.values(grouped).forEach((items) => {
    items.sort((a, b) => (toMinutes(a.start_time) ?? 0) - (toMinutes(b.start_time) ?? 0));
  });

  return grouped;
};
