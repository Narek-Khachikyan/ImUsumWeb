/**
 * Offers marketplace page.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
   fetchOffers,
   fetchBalance,
   purchaseOffer,
   clearLastPurchase,
} from '@/app/slices/offersSlice';
import type { Offer, OfferCategory } from '@/types/offers';
import { StaggerContainer, StaggerItem } from '@/components/animations';
import OfferCard from './components/OfferCard';
import BalanceDisplay from './components/BalanceDisplay';
import ConfirmPurchaseModal from './components/ConfirmPurchaseModal';
import PurchaseSuccessModal from './components/PurchaseSuccessModal';
import PurchaseErrorModal from './components/PurchaseErrorModal';
import { offersCopy } from './constants';

const categories: Array<'all' | OfferCategory> = [
   'all',
   'food',
   'clothing',
   'entertainment',
   'education',
   'other',
];

export default function OffersPage() {
   const dispatch = useAppDispatch();
   const { offers, balance, isLoading, isPurchasing, lastPurchase } =
      useAppSelector((s) => s.offers);
   const { user } = useAppSelector((s) => s.auth);

   const [activeCategory, setActiveCategory] = useState<'all' | OfferCategory>(
      'all'
   );
   const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
   const [purchaseError, setPurchaseError] = useState<string | null>(null);

   useEffect(() => {
      dispatch(fetchOffers(undefined));
   }, [dispatch]);

   useEffect(() => {
      if (user?.role === 'student') {
         dispatch(fetchBalance());
      }
   }, [dispatch, user?.role]);

   const handlePurchase = useCallback(async () => {
      if (selectedOffer) {
         try {
            await dispatch(purchaseOffer(selectedOffer.id)).unwrap();
            setPurchaseError(null);
            setSelectedOffer(null);
            dispatch(fetchBalance());
         } catch (error) {
            const message =
               typeof error === 'string'
                  ? error
                  : error instanceof Error
                    ? error.message
                    : '';
            const normalizedMessage = message.toLowerCase();
            const resolvedMessage =
               normalizedMessage.includes('insufficient') ||
               normalizedMessage.includes('balance')
                  ? offersCopy.errors.insufficientBalance
                  : offersCopy.errors.generic;
            setPurchaseError(resolvedMessage);
            setSelectedOffer(null);
         }
      }
   }, [dispatch, selectedOffer]);

   const filteredOffers =
      activeCategory === 'all'
         ? offers
         : offers.filter(
              (o) => o.category.toLowerCase().trim() === activeCategory
           );

   return (
      <div className="min-h-screen bg-neutral-50 pb-8">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
               <h1 className="text-2xl font-extrabold text-blue-main">
                  {offersCopy.pageTitle}
               </h1>
               {user?.role === 'student' && (
                  <BalanceDisplay balance={balance} isLoading={isLoading} />
               )}
            </div>

            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
               {categories.map((cat) => (
                  <button
                     key={cat}
                     onClick={() => setActiveCategory(cat)}
                     className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        activeCategory === cat
                           ? 'bg-blue-main text-white'
                           : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                     }`}
                  >
                     {offersCopy.categories[cat]}
                  </button>
               ))}
            </div>

            {/* Offers grid */}
            {isLoading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {[...Array(8)].map((_, i) => (
                     <div
                        key={i}
                        className="h-72 bg-white rounded-2xl animate-pulse"
                     />
                  ))}
               </div>
            ) : filteredOffers.length === 0 ? (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
               >
                  <svg
                     className="mx-auto w-16 h-16 text-neutral-300 mb-4"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                     />
                  </svg>
                  <p className="text-neutral-500">
                     Delays delays delays...
                  </p>
               </motion.div>
            ) : (
               <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  <AnimatePresence mode="popLayout">
                     {filteredOffers.map((offer) => (
                        <StaggerItem key={offer.id}>
                           <OfferCard
                              offer={offer}
                              onSelect={(nextOffer) => {
                                 setPurchaseError(null);
                                 setSelectedOffer(nextOffer);
                              }}
                              canPurchase={
                                 user?.role === 'student' &&
                                 balance >= offer.price
                              }
                           />
                        </StaggerItem>
                     ))}
                  </AnimatePresence>
               </StaggerContainer>
            )}
         </div>

         {/* Confirm purchase modal */}
         <ConfirmPurchaseModal
            offer={selectedOffer}
            balance={balance}
            isPurchasing={isPurchasing}
            onConfirm={handlePurchase}
            onCancel={() => setSelectedOffer(null)}
         />

         {/* Success modal with QR */}
         <PurchaseSuccessModal
            purchase={lastPurchase}
            onClose={() => dispatch(clearLastPurchase())}
         />

         {/* Error modal */}
         <PurchaseErrorModal
            message={purchaseError}
            onClose={() => setPurchaseError(null)}
         />
      </div>
   );
}
