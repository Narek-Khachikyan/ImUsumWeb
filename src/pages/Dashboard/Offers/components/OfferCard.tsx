/**
 * Offer card component with Framer Motion animations.
 */

import { motion } from 'framer-motion';
import type { Offer } from '@/types/offers';
import { offersCopy } from '../constants';

interface OfferCardProps {
   offer: Offer;
   onSelect: (offer: Offer) => void;
   canPurchase: boolean;
}

export default function OfferCard({
   offer,
   onSelect,
   canPurchase,
}: OfferCardProps) {
   const isAffordable = canPurchase && offer.is_available;

   return (
      <motion.div
         layout
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.95 }}
         whileHover={{
            y: -4,
            boxShadow: '0 20px 40px -10px rgba(28, 92, 253, 0.15)',
         }}
         className="relative overflow-hidden rounded-2xl bg-white border border-neutral-200 shadow-card cursor-pointer"
         onClick={() => onSelect(offer)}
      >
         {/* Image */}
         <div className="relative h-40 bg-neutral-100 overflow-hidden">
            {offer.image_url ? (
               <img
                  src={offer.image_url}
                  alt={offer.name}
                  className="w-full h-full object-cover"
               />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <svg
                     className="w-12 h-12"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                     />
                  </svg>
               </div>
            )}
            {/* Brand badge */}
            <span className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-neutral-700">
               {offer.brand_name}
            </span>
            {/* Out of stock overlay */}
            {!offer.is_available && (
               <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center">
                  <span className="text-white font-bold">
                     {offersCopy.card.outOfStock}
                  </span>
               </div>
            )}
         </div>

         {/* Content */}
         <div className="p-4">
            <h3 className="font-semibold text-neutral-800 line-clamp-1">
               {offer.name}
            </h3>
            {offer.description && (
               <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
                  {offer.description}
               </p>
            )}
            <div className="mt-3 flex items-center justify-between">
               <span className="text-lg font-bold text-blue-main">
                  {offer.price} {offersCopy.card.points}
               </span>
               <motion.button
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                     isAffordable
                        ? 'bg-blue-main text-white hover:bg-blue-dark'
                        : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                  disabled={!isAffordable}
                  onClick={(e) => {
                     e.stopPropagation();
                     if (isAffordable) {
                        onSelect(offer);
                     }
                  }}
               >
                  {offersCopy.card.buy}
               </motion.button>
            </div>
         </div>
      </motion.div>
   );
}
