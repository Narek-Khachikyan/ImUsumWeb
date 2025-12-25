import { motion } from 'framer-motion';
import { CONCLUSION_TEXT } from '../constants';

const ConclusionSection = () => {
   return (
      <section className="py-section relative overflow-hidden">
         {/* Gradient background */}
         <div className="absolute inset-0 bg-gradient-to-br from-blue-main via-blue-dark to-neutral-800 -z-10" />

         {/* Decorative elements */}
         <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-light rounded-full blur-3xl" />
         </div>

         <div className="container relative z-10">
            <motion.div
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const }}
               className="text-center max-w-4xl mx-auto"
            >
               <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-display-2 font-bold text-white tracking-tight mb-8"
               >
                  Եզրակացություն
               </motion.h2>

               <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-body-lg text-white/90 leading-relaxed"
               >
                  {CONCLUSION_TEXT}
               </motion.p>

               {/* Decorative underline */}
               <motion.div
                  className="mt-12 flex justify-center"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
               >
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-1 bg-white/50 rounded-full" />
                     <div className="w-4 h-1 bg-white/70 rounded-full" />
                     <div className="w-16 h-1 bg-white rounded-full" />
                     <div className="w-4 h-1 bg-white/70 rounded-full" />
                     <div className="w-2 h-1 bg-white/50 rounded-full" />
                  </div>
               </motion.div>
            </motion.div>
         </div>
      </section>
   );
};

export default ConclusionSection;
