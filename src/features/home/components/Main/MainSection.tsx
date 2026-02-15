import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import generalImg from '@/assets/homeImg1.svg';

const MainSection = () => {
   const sectionRef = useRef<HTMLElement>(null);

   const { scrollYProgress } = useScroll({
      target: sectionRef,
      offset: ['start start', 'end start'],
   });

   const imageY = useTransform(scrollYProgress, [0, 1], [0, 150]);
   const imageRotate = useTransform(scrollYProgress, [0, 1], [0, 5]);

   const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
         opacity: 1,
         transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
         },
      },
   };

   const textVariants = {
      hidden: { opacity: 0, y: 30 },
      visible: {
         opacity: 1,
         y: 0,
         transition: {
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1] as const,
         },
      },
   };

   return (
      <section ref={sectionRef} className="relative pt-16 pb-32 mb-section-lg overflow-hidden">
         {/* Decorative gradient orbs */}
         <div className="absolute top-20 -left-40 w-96 h-96 bg-blue-light rounded-full blur-3xl opacity-40 animate-pulse-soft" />
         <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-light rounded-full blur-3xl opacity-30" />

         <div className="relative flex justify-between items-center gap-16">
            {/* Text Content */}
            <motion.div
               className="max-w-2xl"
               variants={containerVariants}
               initial="hidden"
               animate="visible"
            >
               <motion.h1
                  variants={textVariants}
                  className="text-display-1 font-bold text-neutral-800 tracking-tight"
               >
                  Բարի գալուստ <span className="text-gradient">ImUsum</span>
               </motion.h1>

               <motion.p
                  variants={textVariants}
                  className="text-display-2 font-bold text-neutral-800 mt-2"
               >
                  որտեղ <span className="text-blue-main">կրթությունը</span> հանդիպում է{' '}
                  <span className="text-blue-main">ոգեշնչմանը</span>
               </motion.p>

               <motion.p
                  variants={textVariants}
                  className="text-body-lg text-neutral-500 mt-8 max-w-lg leading-relaxed"
               >
                  Կրթությունը անցնում է սահմանները, նորարարությունը հանդիպում է ոգեշնչմանը, և
                  ուսուցման ապագան վերաիմաստավորվում է։
               </motion.p>

               <motion.div variants={textVariants}>
                  <motion.a
                     href="#"
                     className="inline-flex items-center gap-3 mt-10 px-8 py-4 border-2 border-blue-main rounded-xl text-blue-main
                         text-lg font-medium
                         hover:bg-blue-main hover:text-white
                         transition-all duration-400 ease-out-expo
                         group"
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                  >
                     Իմանալ ավելին
                     <svg
                        className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                     </svg>
                  </motion.a>
               </motion.div>
            </motion.div>

            {/* Hero Image with Parallax */}
            <motion.div
               className="relative"
               style={{ y: imageY, rotate: imageRotate }}
               initial={{ opacity: 0, scale: 0.9, x: 50 }}
               animate={{ opacity: 1, scale: 1, x: 0 }}
               transition={{
                  duration: 1,
                  delay: 0.4,
                  ease: [0.25, 0.1, 0.25, 1],
               }}
            >
               <motion.img
                  src={generalImg}
                  alt="ImUsum Platform Preview"
                  className="relative z-10 max-w-lg"
                  animate={{
                     y: [0, -15, 0],
                  }}
                  transition={{
                     duration: 6,
                     repeat: Infinity,
                     ease: 'easeInOut',
                  }}
               />
               {/* Decorative element behind image */}
               <div className="absolute -inset-8 bg-gradient-to-br from-blue-light to-transparent rounded-4xl -z-10 opacity-50" />
            </motion.div>
         </div>
      </section>
   );
};

export default MainSection;
