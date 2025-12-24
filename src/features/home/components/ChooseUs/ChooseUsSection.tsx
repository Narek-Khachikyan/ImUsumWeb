import Title from '../../../../components/ui/Title';
import ChooseUsCard from './ChooseUsCard';
import { chooseUsCardData } from '../../constants';

const ChooseUsSection = () => {
   return (
      <section className="mb-24">
         <Title text="Why schools choose us" />
         <div className="grid grid-cols-3 grid-rows-2 gap-10">
            {chooseUsCardData.map((item) => (
               <ChooseUsCard key={item.id} {...item} />
            ))}
         </div>
      </section>
   );
};

export default ChooseUsSection;
