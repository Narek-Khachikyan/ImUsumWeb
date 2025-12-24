import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { Autoplay } from 'swiper/modules';
import Title from '../../../../components/ui/Title';
import { partners } from '../../constants';
import PartnersCard from './PartnersCard';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const PartnersSection = () => {
   return (
      <section className="mb-24">
         <Title text="Partners" />
         <div>
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
