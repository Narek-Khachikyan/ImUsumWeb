import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { scheduleService, type Schedule, type ScheduleCreate } from '@/services/scheduleService';

interface ScheduleState {
  schedules: Schedule[];
  mySchedule: Schedule[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ScheduleState = {
  schedules: [],
  mySchedule: [],
  isLoading: false,
  error: null,
};

export const fetchSchedules = createAsyncThunk(
  'schedule/fetchAll',
  async (params: { class_id?: number; teacher_id?: number; day_of_week?: string } | undefined, { rejectWithValue }) => {
    try {
      return await scheduleService.getAll(params);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch schedules');
    }
  }
);

export const fetchMySchedule = createAsyncThunk(
  'schedule/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      return await scheduleService.getMy();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch schedule');
    }
  }
);

export const createSchedule = createAsyncThunk(
  'schedule/create',
  async (data: ScheduleCreate, { rejectWithValue }) => {
    try {
      return await scheduleService.create(data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create schedule');
    }
  }
);

export const updateSchedule = createAsyncThunk(
  'schedule/update',
  async ({ id, data }: { id: number; data: Partial<ScheduleCreate> }, { rejectWithValue }) => {
    try {
      return await scheduleService.update(id, data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update schedule');
    }
  }
);

export const deleteSchedule = createAsyncThunk(
  'schedule/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await scheduleService.delete(id);
      return id;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to delete schedule');
    }
  }
);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchSchedules.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedules = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch my schedule
      .addCase(fetchMySchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMySchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.mySchedule = action.payload;
      })
      .addCase(fetchMySchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.schedules.push(action.payload);
      })
      // Update
      .addCase(updateSchedule.fulfilled, (state, action) => {
        const index = state.schedules.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.schedules[index] = action.payload;
        }
      })
      // Delete
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.schedules = state.schedules.filter((s) => s.id !== action.payload);
      });
  },
});

export const { clearError } = scheduleSlice.actions;
export default scheduleSlice.reducer;
