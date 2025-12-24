import { PRINCIPAL_FEATURES } from '../constants';
import FeatureSection from './FeatureSection';
import FeatureCard from './FeatureCard';

const PrincipalFeatures = () => {
  return (
    <FeatureSection
      title="Principal Features"
      subtitle="School principals get powerful management tools"
      columns={3}
    >
      {PRINCIPAL_FEATURES.map((feature) => (
        <FeatureCard key={feature.id} item={feature} />
      ))}
    </FeatureSection>
  );
};

export default PrincipalFeatures;
