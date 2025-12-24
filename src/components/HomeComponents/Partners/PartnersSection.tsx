import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { Autoplay } from 'swiper/modules';
import Title from '../../StyleComponents/Title';
import { partners } from '../../../data/data';
import PartnersCard from './PartnersCard';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import cn from 'classnames';
import styles from './partners.module.css';

const PartnersSection = () => {
   return (
      <section className={cn(styles.partners, 'mb-24')}>
         <Title text="Partners" />
         <div className={cn(styles.content)}>
            <Swiper
               spaceBetween={50}
               slidesPerView={3}
               modules={[Navigation, Pagination, Autoplay]}
               autoplay={{ delay: 3000 }}
               pagination={{ clickable: true }}>
               {partners.map((item) => (
                  <SwiperSlide key={item.id} className="pb-12">
                     <PartnersCard {...item} />
                  </SwiperSlide>
               ))}
            </Swiper>
         </div>
      </section>
   );
};

export default PartnersSection;
