import styles from './findUs.module.css';
import cn from 'classnames';
import findUsPhone from '../../../assets/findUsPhones.png';
import googlePlay from '../../../assets/googlePlay.webp';
import appStore from '../../../assets/appStore.webp';
import Title from '../../StyleComponents/Title';

const FindUsSection = () => {
   return (
      <section className={cn(styles.findUs, 'mb-24')}>
         <Title text="Where you can find us" />
         <div className={cn(styles.content, 'flex justify-between items-center')}>
            <img src={findUsPhone} alt="findUsPhones" />
            <div className={cn(styles.textWrapper)}>
               <p className="text-black text-2xl font-normal mb-10">
                  Discover the power of{' '}
                  <span className="text-blue-600 text-2xl font-semibold">ImUsum</span>, your
                  dedicated educational companion, meticulously crafted to elevate your learning
                  experience to new heights.
               </p>
               <p className="text-black text-2xl font-normal mb-10">
                  <span className="text-blue-600 text-2xl font-semibold">ImUsum</span> stands as a
                  beacon of knowledge, offering a diverse array of meticulously curated courses
                  designed to empower learners across various disciplines.
               </p>
               <div className={cn(styles.links, 'flex items-center gap-5')}>
                  <a href="#" className="w-64 h-24">
                     <img src={googlePlay} alt="" />
                  </a>
                  <a href="#" className="w-64 h-24">
                     <img src={appStore} alt="" />
                  </a>
               </div>
            </div>
         </div>
      </section>
   );
};

export default FindUsSection;
