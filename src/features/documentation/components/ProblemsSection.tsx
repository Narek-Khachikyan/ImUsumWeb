import { EDUCATION_PROBLEMS } from '../constants';
import FeatureSection from './FeatureSection';
import FeatureCard from './FeatureCard';

const ProblemsSection = () => {
  return (
    <FeatureSection
      title="Current Problems in Education"
      subtitle="Currently, there are the following problems in education that ImUsum solves"
      columns={3}
    >
      {EDUCATION_PROBLEMS.map((problem) => (
        <FeatureCard key={problem.id} item={problem} variant="problem" />
      ))}
    </FeatureSection>
  );
};

export default ProblemsSection;
