/**
 * Purchase card for displaying in purchase history.
 */

import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import type { Purchase } from '@/types/offers';
import { offersCopy } from '../constants';

interface PurchaseCardProps {
   purchase: Purchase;
}

export default function PurchaseCard({ purchase }: PurchaseCardProps) {
   const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      redeemed: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
   };

   const formattedDate = new Date(purchase.created_at).toLocaleDateString(
      'hy-AM',
      {
         year: 'numeric',
         month: 'long',
         day: 'numeric',
      }
   );

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="bg-white rounded-2xl border border-neutral-200 shadow-card overflow-hidden"
      >
         <div className="flex flex-col sm:flex-row">
            {/* Left side - Offer info */}
            <div className="flex-1 p-4">
               <div className="flex items-start gap-3">
                  {purchase.offer_image_url ? (
                     <img
                        src={purchase.offer_image_url}
                        alt={purchase.offer_name}
                        className="w-16 h-16 rounded-xl object-cover"
                     />
                  ) : (
                     <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center">
                        <svg
                           className="w-8 h-8 text-neutral-400"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                           />
                        </svg>
                     </div>
                  )}
                  <div className="flex-1 min-w-0">
                     <p className="text-sm text-neutral-500">
                        {purchase.offer_brand}
                     </p>
                     <h3 className="font-semibold text-neutral-800 truncate">
                        {purchase.offer_name}
                     </h3>
                     <p className="text-sm text-neutral-400 mt-1">
                        {formattedDate}
                     </p>
                     <div className="flex items-center gap-2 mt-2">
                        <span className="text-blue-main font-bold">
                           {purchase.points_spent} {offersCopy.card.points}
                        </span>
                        <span
                           className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[purchase.status]}`}
                        >
                           {offersCopy.purchases.status[purchase.status]}
                        </span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right side - QR Code */}
            {purchase.status === 'pending' && (
               <div className="sm:w-40 p-4 bg-neutral-50 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-neutral-200">
                  <div className="bg-white p-2 rounded-lg">
                     <QRCode value={purchase.qr_code} size={100} />
                  </div>
                  <p className="text-xs text-neutral-400 mt-2 font-mono">
                     {purchase.qr_code}
                  </p>
               </div>
            )}
         </div>
      </motion.div>
   );
}
