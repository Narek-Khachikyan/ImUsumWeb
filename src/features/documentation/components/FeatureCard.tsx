import { motion } from 'framer-motion';
import * as OutlineIcons from '@heroicons/react/24/outline';
import type { DocumentationItem } from '@/types';

interface FeatureCardProps {
  item: DocumentationItem;
  variant?: 'default' | 'problem' | 'ai';
}

type IconName = keyof typeof OutlineIcons;

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const FeatureCard = ({ item, variant = 'default' }: FeatureCardProps) => {
  const IconComponent = OutlineIcons[item.iconName as IconName] as React.FC<
    React.SVGProps<SVGSVGElement>
  >;

  const bgColorClass =
    variant === 'problem'
      ? 'bg-red-50 group-hover:bg-red-500'
      : variant === 'ai'
        ? 'bg-purple-100 group-hover:bg-purple-600'
        : 'bg-blue-light group-hover:bg-blue-main';

  const accentColorClass =
    variant === 'problem'
      ? 'from-red-100/50'
      : variant === 'ai'
        ? 'from-purple-100/50'
        : 'from-blue-light/50';

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
        y: -8,
        transition: { duration: 0.3, ease: 'easeOut' },
      }}
      className="group"
    >
      <div
        className="relative bg-white rounded-3xl p-8
                      shadow-soft hover:shadow-card-hover
                      border border-neutral-100
                      transition-shadow duration-500 ease-out-expo
                      h-full"
      >
        {/* Icon container */}
        <div
          className={`w-14 h-14 rounded-2xl ${bgColorClass}
                        flex items-center justify-center mb-6
                        transition-colors duration-400`}
        >
          {IconComponent && (
            <IconComponent
              className="w-7 h-7 text-neutral-700
                            group-hover:text-white
                            transition-colors duration-400"
            />
          )}
        </div>

        {/* Content */}
        <h4 className="text-heading-3 font-semibold text-neutral-800 mb-3">
          {item.title}
        </h4>

        <p className="text-body text-neutral-500 leading-relaxed">
          {item.description}
        </p>

        {/* Decorative corner accent */}
        <div
          className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${accentColorClass} to-transparent
                        rounded-tr-3xl rounded-bl-full
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-500`}
        />
      </div>
    </motion.div>
  );
};

export default FeatureCard;
