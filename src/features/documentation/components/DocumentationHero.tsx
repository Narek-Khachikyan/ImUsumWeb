import { motion } from 'framer-motion';

const DocumentationHero = () => {
   return (
      <section className="relative py-section mb-section-lg overflow-hidden">
         {/* Decorative background elements */}
         <div className="absolute top-20 -left-40 w-96 h-96 bg-blue-light rounded-full blur-3xl opacity-40 animate-pulse-soft" />
         <div className="absolute bottom-20 -right-40 w-80 h-80 bg-blue-muted/20 rounded-full blur-3xl opacity-30 animate-pulse-soft" />

         <div className="container relative z-10">
            <motion.div
               initial={{ opacity: 0, y: 40 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const }}
               className="text-center max-w-4xl mx-auto"
            >
               <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-block px-4 py-2 bg-blue-light text-blue-main rounded-full text-body-sm font-medium mb-6"
               >
                  Փաստաթղթեր
               </motion.span>

               <h1 className="text-display-1 font-bold text-neutral-800 tracking-tight mb-6">
                  ImUsum — <span className="text-gradient">Կրթության ապագան</span>
               </h1>

               <p className="text-body-lg text-neutral-500 leading-relaxed max-w-3xl mx-auto">
                  Հաջորդ սերնդի կրթական հարթակ Հայաստանի դպրոցների և համալսարանների համար։ Մենք
                  միավորում ենք բոլոր ուսումնական գործիքները մեկ տեղում, ավտոմատացնում ենք առօրյա
                  գործընթացները և բացում ենք նոր հնարավորություններ աշակերտների, ուսուցիչների և
                  տնօրենների համար։
               </p>

               {/* Decorative underline */}
               <motion.div
                  className="mt-8 flex justify-center"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
               >
                  <div className="flex items-center gap-2">
                     <div className="w-16 h-1 bg-blue-main rounded-full" />
                     <div className="w-4 h-1 bg-blue-muted rounded-full" />
                     <div className="w-2 h-1 bg-blue-light rounded-full" />
                  </div>
               </motion.div>
            </motion.div>
         </div>
      </section>
   );
};

export default DocumentationHero;
