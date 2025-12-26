/**
 * API service for offers marketplace.
 */

import api from './api';
import type {
   Offer,
   OfferDetail,
   OfferCreate,
   OfferUpdate,
   Purchase,
   StudentBalance,
} from '@/types/offers';

export const offersService = {
   // Offers
   async getAll(category?: string): Promise<Offer[]> {
      const response = await api.get<Offer[]>('/offers', {
         params: category ? { category } : undefined,
      });
      return response.data;
   },

   async getById(id: number): Promise<OfferDetail> {
      const response = await api.get<OfferDetail>(`/offers/${id}`);
      return response.data;
   },

   async create(data: OfferCreate): Promise<OfferDetail> {
      const response = await api.post<OfferDetail>('/offers', data);
      return response.data;
   },

   async update(id: number, data: OfferUpdate): Promise<OfferDetail> {
      const response = await api.put<OfferDetail>(`/offers/${id}`, data);
      return response.data;
   },

   async delete(id: number): Promise<void> {
      await api.delete(`/offers/${id}`);
   },

   async purchase(offerId: number): Promise<Purchase> {
      const response = await api.post<Purchase>(`/offers/${offerId}/purchase`);
      return response.data;
   },

   // Balance
   async getBalance(): Promise<StudentBalance> {
      const response = await api.get<StudentBalance>('/offers/balance');
      return response.data;
   },

   // Purchases
   async getMyPurchases(): Promise<Purchase[]> {
      const response = await api.get<Purchase[]>('/purchases');
      return response.data;
   },

   async getPurchase(id: number): Promise<Purchase> {
      const response = await api.get<Purchase>(`/purchases/${id}`);
      return response.data;
   },

   async redeemPurchase(
      id: number
   ): Promise<{ success: boolean; message: string }> {
      const response = await api.post<{ success: boolean; message: string }>(
         `/purchases/${id}/redeem`
      );
      return response.data;
   },
};

export default offersService;
