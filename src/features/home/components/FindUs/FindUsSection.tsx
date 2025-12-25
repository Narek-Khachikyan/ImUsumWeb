import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import findUsPhone from '../../../../assets/findUsPhones.png';
import googlePlay from '../../../../assets/googlePlay.webp';
import appStore from '../../../../assets/appStore.webp';
import Title from '../../../../components/ui/Title';

const FindUsSection = () => {
   const sectionRef = useRef<HTMLElement>(null);

   const { scrollYProgress } = useScroll({
      target: sectionRef,
      offset: ['start end', 'end start'],
   });

   const phoneY = useTransform(scrollYProgress, [0, 1], [100, -100]);
   const phoneRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-5, 0, 5]);
   const contentY = useTransform(scrollYProgress, [0, 1], [50, -50]);

   const textVariants = {
      hidden: { opacity: 0, x: 40 },
      visible: (i: number) => ({
         opacity: 1,
         x: 0,
         transition: {
            delay: i * 0.15,
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1] as const,
         },
      }),
   };

   return (
      <section ref={sectionRef} className="relative py-section mb-section overflow-hidden">
         {/* Background decoration */}
         <div
            className="absolute inset-0 bg-gradient-to-br from-neutral-50 to-blue-light/20
                      rounded-4xl -mx-8"
         />

         <div className="relative">
            <Title text="Ներբեռնեք հավելվածը" />

            <div className="flex items-center justify-between gap-16 mt-16">
               {/* Phone mockup with parallax */}
               <motion.div
                  className="relative flex-shrink-0"
                  style={{ y: phoneY, rotate: phoneRotate }}
               >
                  {/* Glow effect behind phone */}
                  <div className="absolute inset-0 bg-blue-main/20 blur-3xl scale-75 rounded-full" />

                  <motion.img
                     src={findUsPhone}
                     alt="ImUsum App Preview"
                     className="relative z-10 max-w-md"
                     animate={{
                        y: [0, -10, 0],
                     }}
                     transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                     }}
                  />

                  {/* Floating decorative elements */}
                  <motion.div
                     className="absolute -top-4 -right-4 w-8 h-8 bg-blue-main rounded-lg"
                     animate={{
                        y: [0, -15, 0],
                        rotate: [0, 180, 360],
                     }}
                     transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                     }}
                  />
                  <motion.div
                     className="absolute bottom-20 -left-8 w-6 h-6 bg-blue-light rounded-full"
                     animate={{
                        y: [0, 20, 0],
                        x: [0, 10, 0],
                     }}
                     transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                     }}
                  />
               </motion.div>

               {/* Content */}
               <motion.div className="max-w-xl" style={{ y: contentY }}>
                  <motion.p
                     custom={0}
                     variants={textVariants}
                     initial="hidden"
                     whileInView="visible"
                     viewport={{ once: true }}
                     className="text-heading-2 font-normal text-neutral-700 mb-8 leading-relaxed"
                  >
                     Բացահայտեք <span className="text-blue-main font-semibold">ImUsum</span>-ի ուժը՝
                     ձեր նվիրված կրթական ուղեկիցը, որը մանրակրկիտ ստեղծված է ձեր ուսումնական
                     փորձառությունը նոր բարձունքների հասցնելու համար։
                  </motion.p>

                  <motion.p
                     custom={1}
                     variants={textVariants}
                     initial="hidden"
                     whileInView="visible"
                     viewport={{ once: true }}
                     className="text-body-lg text-neutral-500 mb-12 leading-relaxed"
                  >
                     <span className="text-blue-main font-medium">ImUsum</span>-ը գիտելիքի փարոս է,
                     որն առաջարկում է մանրակրկիտ ընտրված դասընթացների բազմազան ընտրանի՝ նախատեսված
                     տարբեր ոլորտների սովորողներին հզորացնելու համար։
                  </motion.p>

                  {/* App store buttons */}
                  <motion.div
                     custom={2}
                     variants={textVariants}
                     initial="hidden"
                     whileInView="visible"
                     viewport={{ once: true }}
                     className="flex items-center gap-6"
                  >
                     <motion.a
                        href="#"
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="block"
                     >
                        <img
                           src={googlePlay}
                           alt="Get it on Google Play"
                           className="h-16 w-auto rounded-xl shadow-soft hover:shadow-card transition-shadow duration-300"
                        />
                     </motion.a>

                     <motion.a
                        href="#"
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="block"
                     >
                        <img
                           src={appStore}
                           alt="Download on the App Store"
                           className="h-16 w-auto rounded-xl shadow-soft hover:shadow-card transition-shadow duration-300"
                        />
                     </motion.a>
                  </motion.div>
               </motion.div>
            </div>
         </div>
      </section>
   );
};

export default FindUsSection;
