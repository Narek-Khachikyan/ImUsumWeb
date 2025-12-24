import ChooseUsSection from '../../components/HomeComponents/ChooseUs/ChooseUsSection';
import FindUsSection from '../../components/HomeComponents/FindUs/FindUsSection';
import MainSection from '../../components/HomeComponents/Main/MainSection';
import PartnersSection from '../../components/HomeComponents/Partners/PartnersSection';

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
