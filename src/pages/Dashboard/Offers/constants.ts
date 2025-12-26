/**
 * Armenian UI copy for Offers feature.
 */

import type { OfferCategory, PurchaseStatus } from '@/types/offers';

export const offersCopy = {
   pageTitle: 'Առաջարկներ',
   balance: {
      title: 'Իմ հաշիվը',
      points: 'միավոր',
   },
   categories: {
      all: 'Բոլորը',
      food: 'Սնունդ',
      clothing: 'Հագուստ',
      entertainment: 'Ժամանց',
      education: 'Կրթություն',
      other: 'Այլ',
   } as Record<'all' | OfferCategory, string>,
   card: {
      points: 'միավոր',
      outOfStock: 'Սպառված է',
      buy: 'Գնել',
   },
   modal: {
      confirmTitle: 'Հաստատե՞լ գնումը',
      confirmMessage: (name: string, price: number) =>
         `Ցանկանու՞մ եք գնել "${name}"-ը ${price} միավորով:`,
      cancel: 'Չեղարկել',
      confirm: 'Հաստատել',
      insufficientBalance: 'Անբավարար միավորներ',
   },
   success: {
      title: 'Շնորհավորում ենք!',
      message: 'Ցուցադրեք QR կոդը պատվերը ստանալու համար:',
      showQR: 'Ցուցադրել QR',
      done: 'Լավ',
   },
   purchases: {
      title: 'Իմ գնումները',
      empty: 'Դուք դեռ գնումներ չունեք:',
      status: {
         pending: 'Վավեր',
         redeemed: 'Օգտագործված',
         expired: 'Ժամկետանց',
      } as Record<PurchaseStatus, string>,
      showQR: 'Ցուցադրել QR',
   },
   admin: {
      addOffer: 'Ավելացնել առաջարկ',
      editOffer: 'Խմբագրել',
      deleteConfirm: 'Վստա՞հ եք, որ ուզում եք ջնջել:',
   },
};
