import { motion } from 'framer-motion';
import { copy } from '../constants';
import type { DiscountItem } from '../types';

interface DiscountCardProps {
  item: DiscountItem;
}

const DiscountCard = ({ item }: DiscountCardProps) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    className="relative overflow-hidden rounded-2xl"
    style={{
      backgroundImage: item.imageUrl
        ? `url(${item.imageUrl})`
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <div className="absolute inset-0 bg-slate-900/50" />
    <div className="relative p-5 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{item.brand}</h3>
        <span className="text-xs font-semibold">{item.date}</span>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-red-500">
          {item.points} {copy.discounts.points}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-600">
          {copy.discounts.saveUp} {item.discount}
        </span>
      </div>
    </div>
  </motion.div>
);

export default DiscountCard;
