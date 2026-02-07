import { motion } from 'framer-motion';
import {
  ChooseUsSection,
  BlogSection,
  FindUsSection,
  MainSection,
  PartnersSection,
} from '../../features/home';

const Home = () => {
  return (
    <motion.div
      className="py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MainSection />
      <ChooseUsSection />
      <PartnersSection />
      <BlogSection />
      <FindUsSection />
    </motion.div>
  );
};

export default Home;
