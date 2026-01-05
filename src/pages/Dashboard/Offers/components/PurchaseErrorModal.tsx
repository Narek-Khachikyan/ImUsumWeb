/**
 * Purchase error modal.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { offersCopy } from '../constants';

interface PurchaseErrorModalProps {
   message: string | null;
   onClose: () => void;
}

export default function PurchaseErrorModal({
   message,
   onClose,
}: PurchaseErrorModalProps) {
   return (
      <AnimatePresence>
         {message && (
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
                  <motion.div
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ type: 'spring', delay: 0.1 }}
                     className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4"
                  >
                     <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M12 9v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
                        />
                     </svg>
                  </motion.div>

                  <h2 className="text-xl font-bold text-neutral-800 mb-2">
                     {offersCopy.errors.title}
                  </h2>
                  <p className="text-neutral-500 mb-6">{message}</p>

                  <button
                     onClick={onClose}
                     className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                  >
                     {offersCopy.errors.close}
                  </button>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
}
