import logo from '@/assets/logo.svg';
import nikeLogo from '@/assets/nikeLogo.png';
import coffeHouseLogo from '@/assets/coffeHouseLogo.png';
import type { AnnouncementItem, DiscountItem, LessonItem, WeekDayItem, WeekDayKey } from './types';

export const copy = {
  appName: 'ImUsum',
  greeting: 'Բարի վերադարձ',
  announcementsTitle: 'Հայտարարություններ',
  timetableTitle: 'Դասացուցակ',
  discountsTitle: 'Զեղչեր',
  statsTitle: 'Ամփոփ ցուցանիշներ',
  buttons: {
    activities: 'Իմ ակտիվությունները',
    allDiscounts: 'Տեսնել բոլոր զեղչերը',
  },
  labels: {
    uploadDate: 'Վերբեռնման ամսաթիվ',
    room: 'Սենյակ',
    classLabel: 'Դասարան',
    lessonPrefix: 'Առարկա',
    today: 'Այսօր',
    emptySchedule: 'Այս օրը դասեր չկան',
    loadingSchedule: 'Դասացուցակը բեռնվում է…',
    swipeHint: 'Սահեցրու օրերը',
  },
  stats: {
    lessonsToday: 'Այսօրվա դասեր',
    upcomingAssignments: 'Մոտակա առաջադրանքներ',
    averageGrade: 'Միջին գնահատական',
  },
  discounts: {
    points: 'միավոր',
    saveUp: 'Խնայել մինչև',
  },
};

export const weekDays: WeekDayItem[] = [
  { key: 'monday', label: 'Երկուշաբթի', shortLabel: 'Երկ' },
  { key: 'tuesday', label: 'Երեքշաբթի', shortLabel: 'Երք' },
  { key: 'wednesday', label: 'Չորեքշաբթի', shortLabel: 'Չրք' },
  { key: 'thursday', label: 'Հինգշաբթի', shortLabel: 'Հնգ' },
  { key: 'friday', label: 'Ուրբաթ', shortLabel: 'Ուրբ' },
];

export const sampleAnnouncements: AnnouncementItem[] = [
  {
    id: 'announcement-1',
    title: 'Ալգեբրայի նոր ձեռնարկը հասանելի է',
    date: '10.05.2024',
    description: 'Դասագրքի թվային տարբերակը հասանելի է գրադարանում։',
    imageUrl: logo,
    badge: 'Նոր',
  },
  {
    id: 'announcement-2',
    title: 'Փորձարարական շաբաթ բնական գիտություններում',
    date: '14.05.2024',
    description: 'Այս շաբաթ իրականացվելու են կարճ լաբորատոր փորձեր։',
    imageUrl: logo,
  },
  {
    id: 'announcement-3',
    title: 'Քննությունների ժամանակացույցի նախագիծ',
    date: '20.05.2024',
    description: 'Խնդրում ենք ծանոթանալ և ներկայացնել առաջարկներ։',
    imageUrl: logo,
  },
];

export const sampleDiscounts: DiscountItem[] = [
  {
    id: 'discount-1',
    brand: 'Nike',
    date: '20.12.2024',
    points: 120,
    discount: '30%',
    imageUrl: nikeLogo,
  },
  {
    id: 'discount-2',
    brand: 'Coffee House',
    date: '01.01.2025',
    points: 80,
    discount: '20%',
    imageUrl: coffeHouseLogo,
  },
];

export const sampleLessonsByDay: Record<WeekDayKey, LessonItem[]> = {
  monday: [
    {
      id: 'monday-1',
      title: 'Անգլերեն',
      time: '10:00–11:20',
      detail: 'Վարժություն 10-16, էջ 202',
      grade: '7',
      order: 1,
    },
    {
      id: 'monday-2',
      title: 'Գեոմետրիա',
      time: '11:00–12:20',
      detail: 'Վարժություն 4-9, էջ 78',
      grade: '8',
      order: 2,
    },
    {
      id: 'monday-3',
      title: 'Ալգեբրա',
      time: '12:40–13:20',
      detail: 'Առաջադրանք 3, էջ 121',
      grade: '9',
      order: 3,
    },
  ],
  tuesday: [
    {
      id: 'tuesday-1',
      title: 'Պատմություն',
      time: '09:30–10:10',
      detail: 'Կարդալ էջ 45-50',
      grade: '6',
      order: 1,
    },
    {
      id: 'tuesday-2',
      title: 'Կենսաբանություն',
      time: '10:20–11:00',
      detail: 'Նշումներ արմատային բջիջների մասին',
      grade: '8',
      order: 2,
    },
  ],
  wednesday: [
    {
      id: 'wednesday-1',
      title: 'Ֆիզիկա',
      time: '10:00–11:20',
      detail: 'Լուծել խնդիր 12, էջ 64',
      grade: '7',
      order: 1,
    },
    {
      id: 'wednesday-2',
      title: 'Աշխարհագրություն',
      time: '11:40–12:20',
      detail: 'Քարտեզների վարժություն',
      grade: '8',
      order: 2,
    },
  ],
  thursday: [
    {
      id: 'thursday-1',
      title: 'Հայոց լեզու',
      time: '09:40–10:20',
      detail: 'Տեքստի վերլուծություն',
      grade: '9',
      order: 1,
    },
    {
      id: 'thursday-2',
      title: 'Գրականություն',
      time: '10:30–11:10',
      detail: 'Համեմատական շարադրանք',
      grade: '7',
      order: 2,
    },
    {
      id: 'thursday-3',
      title: 'Մաdelays( Delays Delays)',
      time: '12:30–13:30',
      detail: 'Delays #5',
      grade: '8',
      order: 3,
    },
  ],
  friday: [
    {
      id: 'friday-1',
      title: 'Ինֆորմատիկա',
      time: '10:00–11:00',
      detail: 'Կրկնել պայմանական օպերատորները',
      grade: '10',
      order: 1,
    },
    {
      id: 'friday-2',
      title: 'Քիմիա',
      time: '11:20–12:00',
      detail: 'Լաբորատոր աշխատանք #2',
      grade: '8',
      order: 2,
    },
  ],
};
