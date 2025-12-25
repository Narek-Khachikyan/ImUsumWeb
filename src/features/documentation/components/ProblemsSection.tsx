import { EDUCATION_PROBLEMS } from '../constants';
import FeatureSection from './FeatureSection';
import FeatureCard from './FeatureCard';

const ProblemsSection = () => {
   return (
      <FeatureSection
         title="Կրթության ընթացիկ խնդիրները"
         subtitle="Ներկայումս կրթության ոլորտում առկա են հետևյալ խնդիրները, որոնք լուծում է ImUsum-ը"
         columns={3}
      >
         {EDUCATION_PROBLEMS.map((problem) => (
            <FeatureCard key={problem.id} item={problem} variant="problem" />
         ))}
      </FeatureSection>
   );
};

export default ProblemsSection;
