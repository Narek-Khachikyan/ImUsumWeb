import ChooseUsSection from '../../components/HomeComponents/ChooseUs/ChooseUsSection';
import FindUsSection from '../../components/HomeComponents/FindUs/FindUsSection';
import MainSection from '../../components/HomeComponents/Main/MainSection';
import PartnersSection from '../../components/HomeComponents/Partners/PartnersSection';
import styles from './home.module.css';
import cn from 'classnames';

const Home = () => {
   return (
      <div className={cn(styles.home, 'py-12')}>
         <div className={styles.content}>
            <MainSection />
            <ChooseUsSection />
            <PartnersSection />
            <FindUsSection />
         </div>
      </div>
   );
};

export default Home;
