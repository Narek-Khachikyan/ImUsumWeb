import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import Title from '@/components/ui/Title';

interface FeatureSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const FeatureSection = ({
  title,
  subtitle,
  children,
  columns = 3,
  className = '',
}: FeatureSectionProps) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className={`py-section mb-section ${className}`}>
      <div className="container">
        <Title text={title} subtitle={subtitle} />

        <motion.div
          className={`grid ${gridCols[columns]} gap-8 mt-16`}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureSection;
