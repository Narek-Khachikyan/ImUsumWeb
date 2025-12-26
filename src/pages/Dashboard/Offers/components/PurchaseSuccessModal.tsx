/**
 * Purchase success modal with QR code display.
 */

import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import type { Purchase } from '@/types/offers';
import { offersCopy } from '../constants';

interface PurchaseSuccessModalProps {
   purchase: Purchase | null;
   onClose: () => void;
}

export default function PurchaseSuccessModal({
   purchase,
   onClose,
}: PurchaseSuccessModalProps) {
   return (
      <AnimatePresence>
         {purchase && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
               onClick={onClose}
            >
               <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-elevated"
                  onClick={(e) => e.stopPropagation()}
               >
                  {/* Success icon */}
                  <motion.div
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ type: 'spring', delay: 0.1 }}
                     className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
                  >
                     <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M5 13l4 4L19 7"
                        />
                     </svg>
                  </motion.div>

                  <h2 className="text-xl font-bold text-neutral-800 mb-2">
                     {offersCopy.success.title}
                  </h2>
                  <p className="text-neutral-500 mb-6">
                     {offersCopy.success.message}
                  </p>

                  {/* Offer info */}
                  <div className="bg-neutral-50 rounded-xl p-3 mb-4">
                     <p className="text-sm text-neutral-500">
                        {purchase.offer_brand}
                     </p>
                     <p className="font-semibold text-neutral-800">
                        {purchase.offer_name}
                     </p>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-4 rounded-2xl border border-neutral-200 inline-block mb-4">
                     <QRCode value={purchase.qr_code} size={180} />
                  </div>
                  <p className="text-sm text-neutral-400 mb-6 font-mono">
                     {purchase.qr_code}
                  </p>

                  <button
                     onClick={onClose}
                     className="w-full py-3 bg-blue-main text-white font-semibold rounded-xl hover:bg-blue-dark transition-colors"
                  >
                     {offersCopy.success.done}
                  </button>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
}
