//IMG-in Jamanakavor dzeva, minchev chgna sax backend!!!
//IMG-in Jamanakavor dzeva, minchev chgna sax backend!!!
//IMG-in Jamanakavor dzeva, minchev chgna sax backend!!!

import blogImg1 from '@/assets/blogImg1.webp';
import blogImg2 from '@/assets/blogImg2.webp';
import blogImg3 from '@/assets/blogImg3.webp';
import img from '@/assets/choosUsCardImg1.png';
import coffeHouse from '@/assets/coffeHouseLogo.png';
import nike from '@/assets/nikeLogo.png';
import type { BlogPost, ChooseUsCard, Partner } from '@/types';

export const chooseUsCardData: ChooseUsCard[] = [
   {
      id: 1,
      text: 'Մենք ունենք գաղափարներ',
      title: 'ImUsum-ը հասկանում է, որ ուսուցումը միայն գնահատականների մասին չէ. այն ճանապարհորդության և գերազանցության հասնելու մոտիվացիայի մասին է։',
      image: img,
   },

   {
      id: 2,
      text: 'Մենք ունենք գաղափարներ',
      title: 'ImUsum-ը հասկանում է, որ ուսուցումը միայն գնահատականների մասին չէ. այն ճանապարհորդության և գերազանցության հասնելու մոտիվացիայի մասին է։',
      image: img,
   },

   {
      id: 3,
      text: 'Մենք ունենք գաղափարներ',
      title: 'ImUsum-ը հասկանում է, որ ուսուցումը միայն գնահատականների մասին չէ. այն ճանապարհորդության և գերազանցության հասնելու մոտիվացիայի մասին է։',
      image: img,
   },

   {
      id: 4,
      text: 'Մենք ունենք գաղափարներ',
      title: 'ImUsum-ը հասկանում է, որ ուսուցումը միայն գնահատականների մասին չէ. այն ճանապարհորդության և գերազանցության հասնելու մոտիվացիայի մասին է։',
      image: img,
   },

   {
      id: 5,
      text: 'Մենք ունենք գաղափարներ',
      title: 'ImUsum-ը հասկանում է, որ ուսուցումը միայն գնահատականների մասին չէ. այն ճանապարհորդության և գերազանցության հասնելու մոտիվացիայի մասին է։',
      image: img,
   },

   {
      id: 6,
      text: 'Մենք ունենք գաղափարներ',
      title: 'ImUsum-ը հասկանում է, որ ուսուցումը միայն գնահատականների մասին չէ. այն ճանապարհորդության և գերազանցության հասնելու մոտիվացիայի մասին է։',
      image: img,
   },
];

export const partners: Partner[] = [
   {
      id: 7,
      image: nike,
   },
   {
      id: 8,
      image: coffeHouse,
   },
   {
      id: 9,
      image: nike,
   },
   {
      id: 10,
      image: coffeHouse,
   },

   {
      id: 11,
      image: nike,
   },
   {
      id: 12,
      image: coffeHouse,
   },
   {
      id: 13,
      image: nike,
   },
];

export const blog: BlogPost[] = [
   {
      id: 14,
      image: blogImg1,
      title: 'ImUsum-ի նոր թարմացում։',
      letter:
         'Մենք ուրախ ենք հայտարարել ImUsum հավելվածի վերջին և ամենակարևոր թարմացման մասին, որը նշանավորում է բարելավված ուսումնական փորձառությունների և նորագույն հնարավորությունների նոր դարաշրջան։',
      date: '2023-01-01',
      hot: true,
   },
   {
      id: 14,
      image: blogImg2,
      title: 'ImUsum-ի նոր թարմացում։',
      letter:
         'Մենք ուրախ ենք հայտարարել ImUsum հավելվածի վերջին և ամենակարևոր թարմացման մասին, որը նշանավորում է բարելավված ուսումնական փորձառությունների և նորագույն հնարավորությունների նոր դարաշրջան։',
      date: '2023-01-01',
      hot: false,
   },
   {
      id: 14,
      image: blogImg3,
      title: 'ImUsum-ի նոր թարմացում։',
      letter:
         'Մենք ուրախ ենք հայտարարել ImUsum հավելվածի վերջին և ամենակարևոր թարմացման մասին, որը նշանավորում է բարելավված ուսումնական փորձառությունների և նորագույն հնարավորությունների նոր դարաշրջան։',
      date: '2023-01-01',
      hot: false,
   },
];
