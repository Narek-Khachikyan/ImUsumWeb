/**
 * My purchases page with purchase history and QR codes.
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchPurchases } from '@/app/slices/offersSlice';
import { StaggerContainer, StaggerItem } from '@/components/animations';
import PurchaseCard from './components/PurchaseCard';
import { offersCopy } from './constants';

export default function MyPurchasesPage() {
   const dispatch = useAppDispatch();
   const { purchases, isLoading } = useAppSelector((s) => s.offers);

   useEffect(() => {
      dispatch(fetchPurchases());
   }, [dispatch]);

   return (
      <div className="min-h-screen bg-neutral-50 pb-8">
         <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
            {/* Header */}
            <h1 className="text-2xl font-extrabold text-blue-main mb-8">
               {offersCopy.purchases.title}
            </h1>

            {/* Purchases list */}
            {isLoading ? (
               <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                     <div
                        key={i}
                        className="h-32 bg-white rounded-2xl animate-pulse"
                     />
                  ))}
               </div>
            ) : purchases.length === 0 ? (
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                     />
                  </svg>
                  <p className="text-neutral-500">{offersCopy.purchases.empty}</p>
               </motion.div>
            ) : (
               <StaggerContainer className="space-y-4">
                  {purchases.map((purchase) => (
                     <StaggerItem key={purchase.id}>
                        <PurchaseCard purchase={purchase} />
                     </StaggerItem>
                  ))}
               </StaggerContainer>
            )}
         </div>
      </div>
   );
}
