import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  jobsService,
  type JobApplication,
  type JobEligibility,
  type JobPosting,
} from '@/services/jobsService';

interface JobsState {
  jobs: JobPosting[];
  myApplications: JobApplication[];
  eligibility: JobEligibility | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  jobs: [],
  myApplications: [],
  eligibility: null,
  isLoading: false,
  error: null,
};

export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (isActive: boolean | undefined, { rejectWithValue }) => {
    try {
      return await jobsService.list(isActive);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch jobs');
    }
  }
);

export const fetchMyJobEligibility = createAsyncThunk('jobs/fetchEligibility', async (_, { rejectWithValue }) => {
  try {
    return await jobsService.getMyEligibility();
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to fetch eligibility');
  }
});

export const fetchMyJobApplications = createAsyncThunk('jobs/fetchMyApplications', async (_, { rejectWithValue }) => {
  try {
    return await jobsService.getMyApplications();
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to fetch applications');
  }
});

export const applyToJob = createAsyncThunk(
  'jobs/apply',
  async ({ jobId, coverLetter }: { jobId: number; coverLetter?: string }, { rejectWithValue }) => {
    try {
      return await jobsService.apply(jobId, coverLetter);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to apply for job');
    }
  }
);

export const createJobPosting = createAsyncThunk(
  'jobs/create',
  async (
    payload: {
      title: string;
      description: string;
      company_name: string;
      contact_email?: string;
      external_url?: string;
      is_active?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      return await jobsService.create(payload);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create job posting');
    }
  }
);

export const updateJobPosting = createAsyncThunk(
  'jobs/update',
  async ({ jobId, data }: { jobId: number; data: Partial<JobPosting> }, { rejectWithValue }) => {
    try {
      return await jobsService.update(jobId, data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update job posting');
    }
  }
);

export const deleteJobPosting = createAsyncThunk('jobs/delete', async (jobId: number, { rejectWithValue }) => {
  try {
    await jobsService.remove(jobId);
    return jobId;
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to delete job posting');
  }
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearJobsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchJobs.fulfilled, (state, action) => {
      state.isLoading = false;
      state.jobs = action.payload;
    });

    builder.addCase(fetchMyJobEligibility.fulfilled, (state, action) => {
      state.isLoading = false;
      state.eligibility = action.payload;
    });

    builder.addCase(fetchMyJobApplications.fulfilled, (state, action) => {
      state.isLoading = false;
      state.myApplications = action.payload;
    });

    builder.addCase(applyToJob.fulfilled, (state, action) => {
      state.isLoading = false;
      const index = state.myApplications.findIndex((item) => item.id === action.payload.id);
      if (index === -1) {
        state.myApplications.unshift(action.payload);
      } else {
        state.myApplications[index] = action.payload;
      }
    });

    builder.addCase(createJobPosting.fulfilled, (state, action) => {
      state.isLoading = false;
      state.jobs.unshift(action.payload);
    });

    builder.addCase(updateJobPosting.fulfilled, (state, action) => {
      state.isLoading = false;
      const index = state.jobs.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.jobs[index] = action.payload;
      }
    });

    builder.addCase(deleteJobPosting.fulfilled, (state, action) => {
      state.isLoading = false;
      state.jobs = state.jobs.filter((item) => item.id !== action.payload);
    });

    builder.addMatcher(
      (action) => action.type.startsWith('jobs/') && action.type.endsWith('/pending'),
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      (action) => action.type.startsWith('jobs/') && action.type.endsWith('/rejected'),
      (state, action) => {
        const payload =
          action && typeof action === 'object' && 'payload' in action
            ? (action as { payload?: unknown }).payload
            : undefined;
        state.isLoading = false;
        state.error = (typeof payload === 'string' ? payload : null) ?? 'Jobs request failed';
      }
    );
  },
});

export const { clearJobsError } = jobsSlice.actions;
export default jobsSlice.reducer;
