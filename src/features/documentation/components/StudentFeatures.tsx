import { STUDENT_FEATURES } from '../constants';
import FeatureSection from './FeatureSection';
import FeatureCard from './FeatureCard';

const StudentFeatures = () => {
  return (
    <FeatureSection
      title="Student Features"
      subtitle="Core capabilities of the ImUsum platform for students"
      columns={3}
    >
      {STUDENT_FEATURES.map((feature) => (
        <FeatureCard key={feature.id} item={feature} />
      ))}
    </FeatureSection>
  );
};

export default StudentFeatures;
