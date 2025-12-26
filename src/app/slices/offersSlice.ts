/**
 * Redux slice for offers marketplace.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { offersService } from '@/services/offersService';
import type {
   Offer,
   OfferDetail,
   OfferCreate,
   OfferUpdate,
   Purchase,
} from '@/types/offers';

interface OffersState {
   offers: Offer[];
   currentOffer: OfferDetail | null;
   purchases: Purchase[];
   balance: number;
   isLoading: boolean;
   isPurchasing: boolean;
   error: string | null;
   lastPurchase: Purchase | null;
}

const initialState: OffersState = {
   offers: [],
   currentOffer: null,
   purchases: [],
   balance: 0,
   isLoading: false,
   isPurchasing: false,
   error: null,
   lastPurchase: null,
};

// Async thunks
export const fetchOffers = createAsyncThunk(
   'offers/fetchAll',
   async (category: string | undefined, { rejectWithValue }) => {
      try {
         return await offersService.getAll(category);
      } catch (error) {
         if (error instanceof Error) {
            return rejectWithValue(error.message);
         }
         return rejectWithValue('Failed to fetch offers');
      }
   }
);

export const fetchBalance = createAsyncThunk(
   'offers/fetchBalance',
   async (_, { rejectWithValue }) => {
      try {
         const result = await offersService.getBalance();
         return result.bonus_points;
      } catch (error) {
         if (error instanceof Error) {
            return rejectWithValue(error.message);
         }
         return rejectWithValue('Failed to fetch balance');
      }
   }
);

export const fetchPurchases = createAsyncThunk(
   'offers/fetchPurchases',
   async (_, { rejectWithValue }) => {
      try {
         return await offersService.getMyPurchases();
      } catch (error) {
         if (error instanceof Error) {
            return rejectWithValue(error.message);
         }
         return rejectWithValue('Failed to fetch purchases');
      }
   }
);

export const purchaseOffer = createAsyncThunk(
   'offers/purchase',
   async (offerId: number, { rejectWithValue }) => {
      try {
         return await offersService.purchase(offerId);
      } catch (error) {
         if (error instanceof Error) {
            return rejectWithValue(error.message);
         }
         return rejectWithValue('Purchase failed');
      }
   }
);

export const createOffer = createAsyncThunk(
   'offers/create',
   async (data: OfferCreate, { rejectWithValue }) => {
      try {
         return await offersService.create(data);
      } catch (error) {
         if (error instanceof Error) {
            return rejectWithValue(error.message);
         }
         return rejectWithValue('Failed to create offer');
      }
   }
);

export const updateOffer = createAsyncThunk(
   'offers/update',
   async (
      { id, data }: { id: number; data: OfferUpdate },
      { rejectWithValue }
   ) => {
      try {
         return await offersService.update(id, data);
      } catch (error) {
         if (error instanceof Error) {
            return rejectWithValue(error.message);
         }
         return rejectWithValue('Failed to update offer');
      }
   }
);

export const deleteOffer = createAsyncThunk(
   'offers/delete',
   async (id: number, { rejectWithValue }) => {
      try {
         await offersService.delete(id);
         return id;
      } catch (error) {
         if (error instanceof Error) {
            return rejectWithValue(error.message);
         }
         return rejectWithValue('Failed to delete offer');
      }
   }
);

const offersSlice = createSlice({
   name: 'offers',
   initialState,
   reducers: {
      clearError: (state) => {
         state.error = null;
      },
      clearLastPurchase: (state) => {
         state.lastPurchase = null;
      },
      setCurrentOffer: (state, action: PayloadAction<OfferDetail | null>) => {
         state.currentOffer = action.payload;
      },
   },
   extraReducers: (builder) => {
      builder
         // Fetch offers
         .addCase(fetchOffers.pending, (state) => {
            state.isLoading = true;
            state.error = null;
         })
         .addCase(fetchOffers.fulfilled, (state, action) => {
            state.isLoading = false;
            state.offers = action.payload;
         })
         .addCase(fetchOffers.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
         })
         // Fetch balance
         .addCase(fetchBalance.fulfilled, (state, action) => {
            state.balance = action.payload;
         })
         // Fetch purchases
         .addCase(fetchPurchases.pending, (state) => {
            state.isLoading = true;
         })
         .addCase(fetchPurchases.fulfilled, (state, action) => {
            state.isLoading = false;
            state.purchases = action.payload;
         })
         .addCase(fetchPurchases.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
         })
         // Purchase
         .addCase(purchaseOffer.pending, (state) => {
            state.isPurchasing = true;
            state.error = null;
         })
         .addCase(purchaseOffer.fulfilled, (state, action) => {
            state.isPurchasing = false;
            state.lastPurchase = action.payload;
            state.purchases.unshift(action.payload);
            state.balance -= action.payload.points_spent;
            // Update offer availability
            const offerIndex = state.offers.findIndex(
               (o) => o.id === action.payload.offer_id
            );
            if (offerIndex !== -1) {
               const offer = state.offers[offerIndex];
               if (offer && offer.stock_quantity !== null) {
                  offer.stock_quantity = (offer.stock_quantity ?? 0) - 1;
                  offer.is_available = offer.stock_quantity > 0;
               }
            }
         })
         .addCase(purchaseOffer.rejected, (state, action) => {
            state.isPurchasing = false;
            state.error = action.payload as string;
         })
         // Create offer
         .addCase(createOffer.fulfilled, (state, action) => {
            state.offers.unshift({
               ...action.payload,
               is_available: action.payload.is_active,
            });
         })
         // Update offer
         .addCase(updateOffer.fulfilled, (state, action) => {
            const index = state.offers.findIndex(
               (o) => o.id === action.payload.id
            );
            if (index !== -1) {
               state.offers[index] = {
                  ...action.payload,
                  is_available: action.payload.is_active,
               };
            }
         })
         // Delete offer
         .addCase(deleteOffer.fulfilled, (state, action) => {
            state.offers = state.offers.filter((o) => o.id !== action.payload);
         });
   },
});

export const { clearError, clearLastPurchase, setCurrentOffer } =
   offersSlice.actions;
export default offersSlice.reducer;
