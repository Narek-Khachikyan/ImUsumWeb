import { motion } from 'framer-motion';
import SEO from '@/components/ui/SEO';
import {
  DocumentationHero,
  ProblemsSection,
  StudentFeatures,
  TeacherFeatures,
  PrincipalFeatures,
  AISection,
  InvestmentSection,
  ConclusionSection,
} from '@/features/documentation';

const Documentation = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <SEO
        title="Documentation | ImUsum"
        description="Complete documentation of the ImUsum platform - an educational platform for schools and universities in Armenia. Features for students, teachers, and principals."
      />
      <DocumentationHero />
      <ProblemsSection />
      <StudentFeatures />
      <TeacherFeatures />
      <PrincipalFeatures />
      <AISection />
      <InvestmentSection />
      <ConclusionSection />
    </motion.div>
  );
};

export default Documentation;
