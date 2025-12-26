import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { LessonItem } from '../types';

interface LessonCardProps {
  lesson: LessonItem;
  isSelected: boolean;
  onClick: (lesson: LessonItem) => void;
}

const LessonCard = ({ lesson, isSelected, onClick }: LessonCardProps) => {
  const handleClick = useCallback(() => onClick(lesson), [onClick, lesson]);
  const isHighlighted = lesson.isActive || isSelected;

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`group w-full rounded-xl border p-4 text-left transition-colors transform-gpu ${
        isHighlighted
          ? 'border-blue-main bg-blue-main text-white shadow-[0_0_60px_rgba(0,0,0,0.2)]'
          : 'border-blue-main bg-white text-slate-900 hover:border-blue-main hover:bg-blue-main hover:text-white hover:shadow-[0_0_60px_rgba(0,0,0,0.2)]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`text-base transition-colors ${
              isHighlighted ? 'text-white/80' : 'text-slate-600'
            } group-hover:text-white/80`}
          >
            {lesson.order}.
          </span>
          <p className="text-[22px] font-normal leading-tight">{lesson.title}</p>
        </div>
        <span
          className={`text-[10px] font-medium transition-colors ${
            isHighlighted ? 'text-white' : 'text-slate-900'
          } group-hover:text-white`}
        >
          {lesson.time}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        {lesson.detail && (
          <p
            className={`text-[10px] font-medium transition-colors ${
              isHighlighted ? 'text-white/80' : 'text-slate-600'
            } group-hover:text-white/80`}
          >
            {lesson.detail}
          </p>
        )}
        {lesson.grade && (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-[30px] font-bold leading-none transition-all ${
              isHighlighted
                ? 'border-transparent opacity-0 scale-90'
                : 'border-blue-main text-blue-main'
            } group-hover:border-transparent group-hover:opacity-0 group-hover:scale-90`}
          >
            {lesson.grade}
          </div>
        )}
      </div>
    </motion.button>
  );
};

export default memo(LessonCard);
