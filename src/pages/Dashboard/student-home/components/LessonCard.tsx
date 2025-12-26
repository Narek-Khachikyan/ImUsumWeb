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
      className={`group w-full rounded-xl border-2 border-solid p-4 text-left transition-colors transform-gpu ${
        isHighlighted
          ? 'border-[#1C5CFD] bg-blue-main text-white shadow-[0_0_60px_rgba(0,0,0,0.2)]'
          : 'border-[#1C5CFD] bg-white text-slate-900 hover:bg-blue-main hover:text-white hover:shadow-[0_0_60px_rgba(0,0,0,0.2)]'
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
            className={`flex h-9 w-9 items-center justify-center text-[30px] font-bold leading-none transition-all ${
              isHighlighted
                ? 'text-white'
                : 'text-blue-main'
            } group-hover:text-white`}
          >
            {lesson.grade}
          </div>
        )}
      </div>
    </motion.button>
  );
};

export default memo(LessonCard);
