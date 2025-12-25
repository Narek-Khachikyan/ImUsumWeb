import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
   ChevronDownIcon,
   TrophyIcon,
   ExclamationTriangleIcon,
   CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import Title from '@/components/ui/Title';
import { GOALS_TEXT, ACHIEVEMENTS_TEXT, FUNDING_PROBLEMS, BUDGET_BREAKDOWN } from '../constants';
import type { BudgetCategory } from '@/types';

const BudgetAccordionItem = ({ category }: { category: BudgetCategory }) => {
   const [isOpen, setIsOpen] = useState(false);

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
         className="border border-neutral-200 rounded-2xl overflow-hidden bg-white"
      >
         <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-neutral-50 transition-colors"
         >
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-blue-light flex items-center justify-center">
                  <span className="text-blue-main font-bold">{category.percentage}%</span>
               </div>
               <div className="text-left">
                  <h4 className="text-heading-3 font-semibold text-neutral-800">
                     {category.category}
                  </h4>
                  <p className="text-body-sm text-neutral-500">
                     ${category.amount.toLocaleString()}
                  </p>
               </div>
            </div>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
               <ChevronDownIcon className="w-6 h-6 text-neutral-400" />
            </motion.div>
         </button>

         <AnimatePresence>
            {isOpen && (
               <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
               >
                  <div className="px-6 pb-5 pt-2 border-t border-neutral-100">
                     {category.details.map((detail, idx) => (
                        <div key={idx} className="mb-4 last:mb-0">
                           <div className="flex justify-between items-center py-2">
                              <span className="text-body font-medium text-neutral-700">
                                 {detail.name}
                              </span>
                              <span className="text-body text-neutral-500">
                                 ${detail.amount.toLocaleString()}
                              </span>
                           </div>
                           {detail.subItems && (
                              <div className="pl-4 border-l-2 border-blue-light ml-2">
                                 {detail.subItems.map((subItem, subIdx) => (
                                    <div
                                       key={subIdx}
                                       className="flex justify-between items-center py-1.5"
                                    >
                                       <span className="text-body-sm text-neutral-500">
                                          {subItem.name}
                                       </span>
                                       <span className="text-body-sm text-neutral-400">
                                          ${subItem.amount.toLocaleString()}
                                       </span>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
   );
};

const InvestmentSection = () => {
   return (
      <section className="py-section mb-section">
         <div className="container">
            {/* Goals Section */}
            <div className="mb-24">
               <Title text="Նպատակներ և ներդրումներ" />
               <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="max-w-4xl mx-auto mt-12"
               >
                  <div className="bg-gradient-to-br from-blue-50 to-blue-light/30 rounded-3xl p-8 md:p-12">
                     <p className="text-body-lg text-neutral-700 leading-relaxed text-center">
                        {GOALS_TEXT}
                     </p>
                  </div>
               </motion.div>
            </div>

            {/* Achievements & Problems Section */}
            <div className="mb-24">
               <Title text="Խնդիրներ և ձեռքբերումներ" />
               <div className="grid md:grid-cols-2 gap-8 mt-12 max-w-5xl mx-auto">
                  {/* Achievements */}
                  <motion.div
                     initial={{ opacity: 0, x: -30 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true }}
                     transition={{ duration: 0.6 }}
                     className="bg-green-50 rounded-3xl p-8"
                  >
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                           <TrophyIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-heading-3 font-semibold text-neutral-800">
                           Ձեռքբերումներ
                        </h3>
                     </div>
                     <p className="text-body text-neutral-600 leading-relaxed">
                        {ACHIEVEMENTS_TEXT}
                     </p>
                  </motion.div>

                  {/* Problems */}
                  <motion.div
                     initial={{ opacity: 0, x: 30 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true }}
                     transition={{ duration: 0.6 }}
                     className="bg-amber-50 rounded-3xl p-8"
                  >
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                           <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="text-heading-3 font-semibold text-neutral-800">
                           Ֆինանսավորման խնդիրներ
                        </h3>
                     </div>
                     <ul className="space-y-3">
                        {FUNDING_PROBLEMS.map((problem, idx) => (
                           <li
                              key={idx}
                              className="flex items-start gap-3 text-body text-neutral-600"
                           >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                              {problem}
                           </li>
                        ))}
                     </ul>
                  </motion.div>
               </div>
            </div>

            {/* Budget Section */}
            <div>
               <Title
                  text="Բյուջե"
                  subtitle="ImUsum նախագծի իրականացման համար անհրաժեշտ է $200,000"
               />

               {/* Total amount highlight */}
               <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="flex justify-center mt-8 mb-12"
               >
                  <div className="inline-flex items-center gap-4 px-8 py-4 bg-blue-main rounded-2xl shadow-elevated">
                     <CurrencyDollarIcon className="w-8 h-8 text-white" />
                     <span className="text-display-2 font-bold text-white">$200,000</span>
                  </div>
               </motion.div>

               {/* Budget Accordion */}
               <div className="max-w-3xl mx-auto space-y-4">
                  {BUDGET_BREAKDOWN.map((category) => (
                     <BudgetAccordionItem key={category.id} category={category} />
                  ))}
               </div>
            </div>
         </div>
      </section>
   );
};

export default InvestmentSection;
