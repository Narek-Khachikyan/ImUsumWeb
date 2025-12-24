import { motion } from 'framer-motion';
import Title from '../../../../components/ui/Title';
import ChooseUsCard from './ChooseUsCard';
import { chooseUsCardData } from '../../constants';

const ChooseUsSection = () => {
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

  return (
    <section className="py-section mb-section">
      <Title text="Why schools choose us" />

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        {chooseUsCardData.map((item) => (
          <ChooseUsCard key={item.id} {...item} />
        ))}
      </motion.div>
    </section>
  );
};

export default ChooseUsSection;
