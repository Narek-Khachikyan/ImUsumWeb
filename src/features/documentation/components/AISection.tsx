import { motion } from 'framer-motion';
import { AI_FEATURES } from '../constants';
import Title from '@/components/ui/Title';
import FeatureCard from './FeatureCard';

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

const AISection = () => {
  return (
    <section className="py-section mb-section relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-neutral-50 -z-10" />

      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-blue-200/30 rounded-full blur-3xl" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-body-sm font-medium mb-6">
            Artificial Intelligence
          </span>
        </motion.div>

        <Title
          text="AI Integration"
          subtitle="The system integrates an artificial intelligence tool that automates key processes"
        />

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {AI_FEATURES.map((feature) => (
            <FeatureCard key={feature.id} item={feature} variant="ai" />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AISection;
