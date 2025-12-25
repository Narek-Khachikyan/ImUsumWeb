import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { gradeService, type Grade, type GradeCreate, type GradeSummary } from '@/services/gradeService';

interface GradeState {
  grades: Grade[];
  myGrades: Grade[];
  summary: GradeSummary[];
  isLoading: boolean;
  error: string | null;
}

const initialState: GradeState = {
  grades: [],
  myGrades: [],
  summary: [],
  isLoading: false,
  error: null,
};

export const fetchGrades = createAsyncThunk(
  'grade/fetchAll',
  async (params: { student_id?: number; subject_id?: number } | undefined, { rejectWithValue }) => {
    try {
      return await gradeService.getAll(params);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch grades');
    }
  }
);

export const fetchMyGrades = createAsyncThunk(
  'grade/fetchMy',
  async (subject_id: number | undefined, { rejectWithValue }) => {
    try {
      return await gradeService.getMy(subject_id);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch grades');
    }
  }
);

export const fetchGradeSummary = createAsyncThunk(
  'grade/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await gradeService.getSummary();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch grade summary');
    }
  }
);

export const createGrade = createAsyncThunk(
  'grade/create',
  async (data: GradeCreate, { rejectWithValue }) => {
    try {
      return await gradeService.create(data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create grade');
    }
  }
);

export const updateGrade = createAsyncThunk(
  'grade/update',
  async ({ id, data }: { id: number; data: Partial<GradeCreate> }, { rejectWithValue }) => {
    try {
      return await gradeService.update(id, data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update grade');
    }
  }
);

export const deleteGrade = createAsyncThunk(
  'grade/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await gradeService.delete(id);
      return id;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to delete grade');
    }
  }
);

const gradeSlice = createSlice({
  name: 'grade',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchGrades.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.isLoading = false;
        state.grades = action.payload;
      })
      .addCase(fetchGrades.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch my grades
      .addCase(fetchMyGrades.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyGrades.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myGrades = action.payload;
      })
      .addCase(fetchMyGrades.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch summary
      .addCase(fetchGradeSummary.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchGradeSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchGradeSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createGrade.fulfilled, (state, action) => {
        state.grades.push(action.payload);
      })
      // Update
      .addCase(updateGrade.fulfilled, (state, action) => {
        const index = state.grades.findIndex((g) => g.id === action.payload.id);
        if (index !== -1) {
          state.grades[index] = action.payload;
        }
      })
      // Delete
      .addCase(deleteGrade.fulfilled, (state, action) => {
        state.grades = state.grades.filter((g) => g.id !== action.payload);
      });
  },
});

export const { clearError } = gradeSlice.actions;
export default gradeSlice.reducer;
