import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { motion } from 'framer-motion';
import Title from '@/components/ui/Title';
import { partners } from '@/features/home/constants';
import PartnersCard from './PartnersCard';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const PartnersSection = () => {
   return (
      <motion.section
         className="py-section mb-section overflow-hidden"
         initial={{ opacity: 0 }}
         whileInView={{ opacity: 1 }}
         viewport={{ once: true }}
         transition={{ duration: 0.8 }}
      >
         <Title text="Վստահելի Գործընկերներ" />

         <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 px-4"
         >
            <Swiper
               spaceBetween={32}
               slidesPerView={1}
               modules={[Navigation, Pagination, Autoplay]}
               autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
               }}
               pagination={{
                  clickable: true,
                  bulletClass: 'swiper-pagination-bullet !w-3 !h-3 !bg-neutral-200 !opacity-100',
                  bulletActiveClass: '!bg-blue-main !w-8 !rounded-full',
               }}
               breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 4 },
               }}
               className="!pb-16"
            >
               {partners.map((item) => (
                  <SwiperSlide key={item.id}>
                     <PartnersCard {...item} />
                  </SwiperSlide>
               ))}
            </Swiper>
         </motion.div>
      </motion.section>
   );
};

export default PartnersSection;
