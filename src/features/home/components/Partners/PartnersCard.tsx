import { motion } from 'framer-motion';

interface PartnersCardProps {
  image: string;
}

const PartnersCard = ({ image }: PartnersCardProps) => {
  return (
    <motion.div
      className="group"
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div
        className="relative h-32 rounded-2xl bg-white border border-neutral-100
                      shadow-soft hover:shadow-card
                      flex justify-center items-center
                      transition-all duration-400 ease-out-expo
                      overflow-hidden"
      >
        {/* Subtle gradient overlay on hover */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-light/0 to-blue-light/30
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-500"
        />
        <motion.img
          src={image}
          className="h-16 w-auto object-contain relative z-10
                       grayscale group-hover:grayscale-0
                       opacity-60 group-hover:opacity-100
                       transition-all duration-500"
          alt="Partner logo"
        />
      </div>
    </motion.div>
  );
};

export default PartnersCard;
