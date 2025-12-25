import { TEACHER_FEATURES } from '../constants';
import FeatureSection from './FeatureSection';
import FeatureCard from './FeatureCard';

const TeacherFeatures = () => {
   return (
      <FeatureSection
         title="Ուսուցչի հնարավորություններ"
         subtitle="ImUsum-ի ժամանակակից լուծումների միջոցով ուսուցիչները կարող են"
         columns={3}
      >
         {TEACHER_FEATURES.map((feature) => (
            <FeatureCard key={feature.id} item={feature} />
         ))}
      </FeatureSection>
   );
};

export default TeacherFeatures;
