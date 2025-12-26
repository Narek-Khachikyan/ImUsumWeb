import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { copy } from '../constants';
import type { AnnouncementItem } from '../types';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export interface AnnouncementSliderProps {
  items: AnnouncementItem[];
}

const AnnouncementCard = ({ item }: { item: AnnouncementItem }) => (
  <motion.article
    layout
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    className="relative overflow-hidden rounded-2xl bg-blue-main p-6 text-white shadow-lg"
    style={{ boxShadow: '0 16px 40px rgba(0, 127, 255, 0.25)' }}
  >
    <div className="flex items-start gap-5">
      {item.imageUrl && (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/15">
          <img src={item.imageUrl} alt="" className="h-10 w-10 object-contain" />
        </div>
      )}
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold leading-tight">{item.title}</h3>
          {item.badge && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              {item.badge}
            </span>
          )}
        </div>
        <p className="text-sm text-white/80">{item.description}</p>
        <p className="text-xs text-white/70">
          {copy.labels.uploadDate}: {item.date}
        </p>
      </div>
    </div>
  </motion.article>
);

const AnnouncementSlider = ({ items }: AnnouncementSliderProps) => (
  <Swiper
    spaceBetween={24}
    slidesPerView={1}
    loop={items.length > 1}
    modules={[Navigation, Pagination, Autoplay]}
    autoplay={{ delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true }}
    navigation
    pagination={{
      clickable: true,
      bulletClass: 'swiper-pagination-bullet !w-2 !h-2 !bg-white/40 !opacity-100',
      bulletActiveClass: '!bg-white !w-8 !rounded-full',
    }}
    className="!pb-12"
  >
    {items.map((item) => (
      <SwiperSlide key={item.id}>
        <AnnouncementCard item={item} />
      </SwiperSlide>
    ))}
  </Swiper>
);

export default AnnouncementSlider;
