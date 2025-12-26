export type WeekDayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface WeekDayItem {
  key: WeekDayKey;
  label: string;
  shortLabel: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  date: string;
  description: string;
  imageUrl?: string;
  badge?: string;
}

export interface LessonItem {
  id: number | string;
  title: string;
  time: string;
  detail?: string;
  grade?: string;
  order: number;
  isActive?: boolean;
}

export interface TimetableDay extends WeekDayItem {
  lessons: LessonItem[];
  isToday: boolean;
}

export interface DiscountItem {
  id: string;
  brand: string;
  date: string;
  points: number;
  discount: string;
  imageUrl?: string;
}
