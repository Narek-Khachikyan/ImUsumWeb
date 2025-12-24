import { motion } from 'framer-motion';

interface ChooseUsCardProps {
  title: string;
  text: string;
  image: string;
}

const ChooseUsCard = ({ title, text, image }: ChooseUsCardProps) => {
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
        {/* Icon container with gradient background on hover */}
        <div
          className="w-14 h-14 rounded-2xl bg-blue-light
                        flex items-center justify-center mb-6
                        group-hover:bg-blue-main transition-colors duration-400"
        >
          <img
            src={image}
            className="w-7 h-7 object-contain
                          group-hover:brightness-0 group-hover:invert
                          transition-all duration-400"
            alt=""
          />
        </div>

        {/* Content */}
        <h4 className="text-heading-3 font-semibold text-neutral-800 mb-3">
          {text}
        </h4>

        <p className="text-body text-neutral-500 leading-relaxed">{title}</p>

        {/* Decorative corner accent */}
        <div
          className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-light/50 to-transparent
                        rounded-tr-3xl rounded-bl-full
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-500"
        />
      </div>
    </motion.div>
  );
};

export default ChooseUsCard;
