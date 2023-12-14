import ChooseUsSection from '../../components/HomeComponetns/ChooseUs/ChooseUsSection';
import FindUsSection from '../../components/HomeComponetns/FindUs/FindUsSection';
import MainSection from '../../components/HomeComponetns/Main/MainSection';
import PartnersSection from '../../components/HomeComponetns/Partners/PartnersSection';
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
