/**
 * Confirm purchase modal.
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { Offer } from '@/types/offers';
import { offersCopy } from '../constants';

interface ConfirmPurchaseModalProps {
   offer: Offer | null;
   balance: number;
   isPurchasing: boolean;
   onConfirm: () => void;
   onCancel: () => void;
}

export default function ConfirmPurchaseModal({
   offer,
   balance,
   isPurchasing,
   onConfirm,
   onCancel,
}: ConfirmPurchaseModalProps) {
   if (!offer) return null;

   const canAfford = balance >= offer.price;

   return (
      <AnimatePresence>
         {offer && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
               onClick={onCancel}
            >
               <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-elevated"
                  onClick={(e) => e.stopPropagation()}
               >
                  {/* Offer preview */}
                  <div className="flex items-center gap-4 mb-6">
                     {offer.image_url ? (
                        <img
                           src={offer.image_url}
                           alt={offer.name}
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
                     <div>
                        <p className="text-sm text-neutral-500">
                           {offer.brand_name}
                        </p>
                        <h3 className="font-semibold text-neutral-800">
                           {offer.name}
                        </h3>
                        <p className="text-lg font-bold text-blue-main">
                           {offer.price} {offersCopy.card.points}
                        </p>
                     </div>
                  </div>

                  {/* Confirmation text */}
                  <h2 className="text-xl font-bold text-neutral-800 mb-2">
                     {offersCopy.modal.confirmTitle}
                  </h2>
                  <p className="text-neutral-500 mb-4">
                     {offersCopy.modal.confirmMessage(offer.name, offer.price)}
                  </p>

                  {/* Balance info */}
                  <div className="bg-neutral-50 rounded-xl p-3 mb-6">
                     <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">
                           {offersCopy.balance.title}:
                        </span>
                        <span className="font-semibold">
                           {balance} {offersCopy.balance.points}
                        </span>
                     </div>
                     <div className="flex justify-between text-sm mt-1">
                        <span className="text-neutral-500">Պdelays:</span>
                        <span
                           className={`font-semibold ${canAfford ? 'text-green-600' : 'text-red-500'}`}
                        >
                           {balance - offer.price} {offersCopy.balance.points}
                        </span>
                     </div>
                  </div>

                  {!canAfford && (
                     <p className="text-red-500 text-sm text-center mb-4">
                        {offersCopy.modal.insufficientBalance}
                     </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                     <button
                        onClick={onCancel}
                        className="flex-1 py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-50 transition-colors"
                        disabled={isPurchasing}
                     >
                        {offersCopy.modal.cancel}
                     </button>
                     <button
                        onClick={onConfirm}
                        disabled={!canAfford || isPurchasing}
                        className={`flex-1 py-3 font-semibold rounded-xl transition-colors ${
                           canAfford && !isPurchasing
                              ? 'bg-blue-main text-white hover:bg-blue-dark'
                              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        }`}
                     >
                        {isPurchasing ? (
                           <span className="flex items-center justify-center gap-2">
                              <svg
                                 className="animate-spin h-4 w-4"
                                 viewBox="0 0 24 24"
                              >
                                 <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                 />
                                 <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                 />
                              </svg>
                           </span>
                        ) : (
                           offersCopy.modal.confirm
                        )}
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
}
