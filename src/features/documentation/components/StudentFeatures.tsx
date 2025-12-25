import { STUDENT_FEATURES } from '../constants';
import FeatureSection from './FeatureSection';
import FeatureCard from './FeatureCard';

const StudentFeatures = () => {
   return (
      <FeatureSection
         title="Աշակերտի հնարավորություններ"
         subtitle="ImUsum հարթակի հիմնական հնարավորությունները աշակերտների համար"
         columns={3}
      >
         {STUDENT_FEATURES.map((feature) => (
            <FeatureCard key={feature.id} item={feature} />
         ))}
      </FeatureSection>
   );
};

export default StudentFeatures;
