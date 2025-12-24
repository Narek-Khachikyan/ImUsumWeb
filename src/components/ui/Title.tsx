import { motion } from 'framer-motion';

interface TitleProps {
  text: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
}

const Title = ({ text, subtitle, align = 'center' }: TitleProps) => {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const justifyClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={`mb-6 ${alignmentClasses[align]}`}
    >
      <h2 className="text-display-2 font-bold text-neutral-800 tracking-tight">
        {text}
      </h2>

      {subtitle && (
        <p className="text-body-lg text-neutral-500 mt-4 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}

      <motion.div
        className={`mt-6 flex ${justifyClasses[align]}`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-12 h-1 bg-blue-main rounded-full" />
          <div className="w-3 h-1 bg-blue-muted rounded-full" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Title;
