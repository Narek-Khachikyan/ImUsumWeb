import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  attendanceService,
  type AttendanceCheckInRequest,
  type AttendanceDayItem,
  type AttendanceRecord,
} from '@/services/attendanceService';

interface AttendanceState {
  myDay: AttendanceDayItem[];
  lastCheckIn: AttendanceRecord | null;
  isLoading: boolean;
  isCheckingIn: boolean;
  error: string | null;
}

const initialState: AttendanceState = {
  myDay: [],
  lastCheckIn: null,
  isLoading: false,
  isCheckingIn: false,
  error: null,
};

export const fetchMyAttendance = createAsyncThunk(
  'attendance/fetchMy',
  async (date: string | undefined, { rejectWithValue }) => {
    try {
      return await attendanceService.getMy(date);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch attendance');
    }
  }
);

export const checkInAttendanceByGeo = createAsyncThunk(
  'attendance/checkInByGeo',
  async (payload: AttendanceCheckInRequest, { rejectWithValue }) => {
    try {
      return await attendanceService.checkInByGeo(payload);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to check in attendance');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myDay = action.payload;
      })
      .addCase(fetchMyAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(checkInAttendanceByGeo.pending, (state) => {
        state.isCheckingIn = true;
        state.error = null;
      })
      .addCase(checkInAttendanceByGeo.fulfilled, (state, action) => {
        state.isCheckingIn = false;
        state.lastCheckIn = action.payload;
      })
      .addCase(checkInAttendanceByGeo.rejected, (state, action) => {
        state.isCheckingIn = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
