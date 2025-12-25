import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  assignmentService,
  type Assignment,
  type AssignmentCreate,
  type Submission,
  type SubmissionCreate,
  type SubmissionGrade,
} from '@/services/assignmentService';

interface AssignmentState {
  assignments: Assignment[];
  myAssignments: Assignment[];
  currentAssignment: Assignment | null;
  submissions: Submission[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AssignmentState = {
  assignments: [],
  myAssignments: [],
  currentAssignment: null,
  submissions: [],
  isLoading: false,
  error: null,
};

export const fetchAssignments = createAsyncThunk(
  'assignment/fetchAll',
  async (params: { class_id?: number; subject_id?: number; is_published?: boolean } | undefined, { rejectWithValue }) => {
    try {
      return await assignmentService.getAll(params);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch assignments');
    }
  }
);

export const fetchMyAssignments = createAsyncThunk(
  'assignment/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      return await assignmentService.getMy();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch assignments');
    }
  }
);

export const fetchAssignmentById = createAsyncThunk(
  'assignment/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await assignmentService.getById(id);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch assignment');
    }
  }
);

export const createAssignment = createAsyncThunk(
  'assignment/create',
  async (data: AssignmentCreate, { rejectWithValue }) => {
    try {
      return await assignmentService.create(data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create assignment');
    }
  }
);

export const updateAssignment = createAsyncThunk(
  'assignment/update',
  async ({ id, data }: { id: number; data: Partial<AssignmentCreate> }, { rejectWithValue }) => {
    try {
      return await assignmentService.update(id, data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update assignment');
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  'assignment/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await assignmentService.delete(id);
      return id;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to delete assignment');
    }
  }
);

export const submitAssignment = createAsyncThunk(
  'assignment/submit',
  async ({ assignmentId, data }: { assignmentId: number; data: SubmissionCreate }, { rejectWithValue }) => {
    try {
      return await assignmentService.submit(assignmentId, data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to submit assignment');
    }
  }
);

export const fetchSubmissions = createAsyncThunk(
  'assignment/fetchSubmissions',
  async (assignmentId: number, { rejectWithValue }) => {
    try {
      return await assignmentService.getSubmissions(assignmentId);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch submissions');
    }
  }
);

export const gradeSubmission = createAsyncThunk(
  'assignment/gradeSubmission',
  async (
    { assignmentId, submissionId, data }: { assignmentId: number; submissionId: number; data: SubmissionGrade },
    { rejectWithValue }
  ) => {
    try {
      return await assignmentService.gradeSubmission(assignmentId, submissionId, data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to grade submission');
    }
  }
);

const assignmentSlice = createSlice({
  name: 'assignment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAssignment: (state) => {
      state.currentAssignment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAssignments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assignments = action.payload;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch my
      .addCase(fetchMyAssignments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyAssignments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myAssignments = action.payload;
      })
      .addCase(fetchMyAssignments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch by id
      .addCase(fetchAssignmentById.fulfilled, (state, action) => {
        state.currentAssignment = action.payload;
      })
      // Create
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.assignments.push(action.payload);
        state.myAssignments.push(action.payload);
      })
      // Update
      .addCase(updateAssignment.fulfilled, (state, action) => {
        const index = state.assignments.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.assignments[index] = action.payload;
        }
        const myIndex = state.myAssignments.findIndex((a) => a.id === action.payload.id);
        if (myIndex !== -1) {
          state.myAssignments[myIndex] = action.payload;
        }
      })
      // Delete
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.assignments = state.assignments.filter((a) => a.id !== action.payload);
        state.myAssignments = state.myAssignments.filter((a) => a.id !== action.payload);
      })
      // Submissions
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.submissions = action.payload;
      })
      .addCase(gradeSubmission.fulfilled, (state, action) => {
        const index = state.submissions.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.submissions[index] = action.payload;
        }
      });
  },
});

export const { clearError, clearCurrentAssignment } = assignmentSlice.actions;
export default assignmentSlice.reducer;
