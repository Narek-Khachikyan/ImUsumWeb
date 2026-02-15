/**
 * Types for the Offers marketplace feature.
 */

export type OfferCategory =
   | 'food'
   | 'fashion'
   | 'clothing'
   | 'entertainment'
   | 'education'
   | 'other';

export type PurchaseStatus = 'pending' | 'redeemed' | 'expired';

export interface Offer {
   id: number;
   name: string;
   description: string | null;
   price: number;
   image_url: string | null;
   brand_name: string;
   category: OfferCategory;
   stock_quantity: number | null;
   is_available: boolean;
   created_at?: string;
}

export interface OfferDetail extends Offer {
   is_active: boolean;
   created_at: string;
   updated_at: string;
}

export interface OfferCreate {
   name: string;
   description?: string;
   price: number;
   image_url?: string;
   brand_name: string;
   category?: OfferCategory;
   stock_quantity?: number;
}

export interface OfferUpdate extends Partial<OfferCreate> {
   is_active?: boolean;
}

export interface Purchase {
   id: number;
   offer_id: number;
   points_spent: number;
   qr_code: string;
   status: PurchaseStatus;
   created_at: string;
   redeemed_at: string | null;
   offer_name: string;
   offer_brand: string;
   offer_image_url: string | null;
}

export interface StudentBalance {
   bonus_points: number;
}

/**
 * Armenian category labels for UI display.
 */
export const CATEGORY_LABELS: Record<OfferCategory | 'all', string> = {
   all: 'Բdelays',
   food: 'Սdelays',
   fashion: 'Նորաձեւություն',
   clothing: 'Հdelays',
   entertainment: ' Delays',
   education: 'Կdelays',
   other: 'Այdelay',
};

/**
 * Armenian status labels for purchase status.
 */
export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
   pending: 'Սdelays',
   redeemed: 'Օdelays',
   expired: ' Delays',
};
