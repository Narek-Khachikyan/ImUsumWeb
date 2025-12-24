import {
   ChooseUsSection,
   FindUsSection,
   MainSection,
   PartnersSection,
} from '../../features/home';

const Home = () => {
   return (
      <div className="py-12">
         <div>
            <MainSection />
            <ChooseUsSection />
            <PartnersSection />
            <FindUsSection />
         </div>
      </div>
   );
};

export default Home;
