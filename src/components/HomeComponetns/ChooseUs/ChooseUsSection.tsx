import Title from '../../StyleComponents/Title';
import ChooseUsCard from './ChooseUsCard';
import styles from './chooseUs.module.css';
import cn from 'classnames';
import { chooseUsCardData } from '../../../data/data';

const ChooseUsSection = () => {
   return (
      <section className={cn(styles.chooseUS, 'mb-24')}>
         <Title text="Why schools choose us" />
         <div className={cn(styles.content, 'grid grid-cols-3 grid-rows-2 gap-10')}>
            {chooseUsCardData.map((item) => (
               <ChooseUsCard key={item.id} {...item} />
            ))}
         </div>
      </section>
   );
};

export default ChooseUsSection;
