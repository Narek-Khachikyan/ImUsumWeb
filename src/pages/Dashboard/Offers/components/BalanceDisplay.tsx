/**
 * Balance display widget with gradient background.
 */

import { motion } from 'framer-motion';
import { offersCopy } from '../constants';

interface BalanceDisplayProps {
   balance: number;
   isLoading?: boolean;
}

export default function BalanceDisplay({
   balance,
   isLoading,
}: BalanceDisplayProps) {
   return (
      <motion.div
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         className="flex items-center gap-3 bg-gradient-to-r from-blue-main to-blue-dark rounded-2xl px-5 py-3 text-white shadow-card"
      >
         <div className="p-2 bg-white/20 rounded-xl">
            <svg
               className="w-6 h-6"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
            >
               <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
               />
            </svg>
         </div>
         <div>
            <p className="text-xs text-white/80">{offersCopy.balance.title}</p>
            {isLoading ? (
               <div className="h-6 w-16 bg-white/20 rounded animate-pulse" />
            ) : (
               <p className="text-xl font-bold">
                  {balance} {offersCopy.balance.points}
               </p>
            )}
         </div>
      </motion.div>
   );
}
