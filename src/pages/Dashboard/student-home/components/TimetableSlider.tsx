import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { copy } from '../constants';
import type { LessonItem, TimetableDay } from '../types';
import LessonCard from './LessonCard';
import { TimetableSkeleton } from './Skeletons';

import 'swiper/css';
import 'swiper/css/pagination';

export interface TimetableSliderProps {
  days: TimetableDay[];
  isLoading: boolean;
  onLessonClick?: (lesson: LessonItem) => void;
}

const TimetableSlider = ({ days, isLoading, onLessonClick }: TimetableSliderProps) => {
  const initialIndex = useMemo(() => {
    const index = days.findIndex((day) => day.isToday);
    return index >= 0 ? index : 0;
  }, [days]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [selectedLessonId, setSelectedLessonId] = useState<LessonItem['id'] | null>(null);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  const handleDayClick = useCallback(
    (index: number) => {
      swiperInstance?.slideTo(index);
    },
    [swiperInstance]
  );

  const handleLessonSelect = useCallback(
    (lesson: LessonItem) => {
      setSelectedLessonId(lesson.id);
      onLessonClick?.(lesson);
    },
    [onLessonClick]
  );

  useEffect(() => {
    setActiveIndex(initialIndex);
    if (swiperInstance) {
      swiperInstance.slideTo(initialIndex, 0);
    }
  }, [initialIndex, swiperInstance]);

  if (isLoading) {
    return <TimetableSkeleton />;
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {days.map((day, index) => (
            <button
              key={day.key}
              type="button"
              onClick={() => handleDayClick(index)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                index === activeIndex
                  ? 'bg-blue-main text-white'
                  : 'bg-blue-50 text-blue-main/70 hover:text-blue-main'
              }`}
            >
              {day.shortLabel}
              {day.isToday && (
                <span className="ml-1 inline-flex h-1.5 w-1.5 items-center rounded-full bg-white/80" />
              )}
            </button>
          ))}
        </div>
        <span className="text-xs font-medium text-slate-400">{copy.labels.swipeHint}</span>
      </div>

      <div className="mt-6">
        <Swiper
          onSwiper={setSwiperInstance}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          slidesPerView={1}
          spaceBetween={16}
          modules={[Pagination]}
          pagination={{
            clickable: true,
            bulletClass: 'swiper-pagination-bullet !w-2 !h-2 !bg-slate-200 !opacity-100',
            bulletActiveClass: '!bg-blue-main !w-8 !rounded-full',
          }}
          className="!pb-12"
        >
          {days.map((day) => (
            <SwiperSlide key={day.key}>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-blue-main">{day.label}</h3>
                  {day.isToday && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-main">
                      {copy.labels.today}
                    </span>
                  )}
                </div>
                <div className="grid gap-4">
                  <AnimatePresence mode="popLayout">
                    {day.lessons.length > 0 ? (
                      day.lessons.map((lesson) => (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          isSelected={lesson.id === selectedLessonId}
                          onClick={handleLessonSelect}
                        />
                      ))
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-xl border border-dashed border-blue-100 bg-blue-50 px-4 py-6 text-center text-sm text-slate-500"
                      >
                        {copy.labels.emptySchedule}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default TimetableSlider;
