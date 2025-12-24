import { TEACHER_FEATURES } from '../constants';
import FeatureSection from './FeatureSection';
import FeatureCard from './FeatureCard';

const TeacherFeatures = () => {
  return (
    <FeatureSection
      title="Teacher Features"
      subtitle="With ImUsum's modern solutions, teachers can"
      columns={3}
    >
      {TEACHER_FEATURES.map((feature) => (
        <FeatureCard key={feature.id} item={feature} />
      ))}
    </FeatureSection>
  );
};

export default TeacherFeatures;
