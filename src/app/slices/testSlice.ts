import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  testService,
  type TestAnalytics,
  type TestAttempt,
  type TestAttemptResponse,
  type TestBase,
  type TestDetail,
  type TestListItem,
  type TestQuestionCreate,
  type TestQuestionUpdate,
  type TestSubmit,
  type TestCreate,
  type TestUpdate,
} from '@/services/testService';

interface TestState {
  myTests: TestListItem[];
  currentTest: TestDetail | null;
  attempt: TestAttemptResponse | null;
  results: TestAttempt[];
  analytics: TestAnalytics | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TestState = {
  myTests: [],
  currentTest: null,
  attempt: null,
  results: [],
  analytics: null,
  isLoading: false,
  error: null,
};

function toListItem(base: TestBase, existing?: TestListItem): TestListItem {
  return {
    ...base,
    questions_count: existing?.questions_count ?? 0,
    attempts_count: existing?.attempts_count,
    is_closed: new Date(base.due_date) < new Date(),
    attempt: existing?.attempt ?? null,
  };
}

export const fetchMyTests = createAsyncThunk('test/fetchMy', async (_, { rejectWithValue }) => {
  try {
    return await testService.getMy();
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to fetch tests');
  }
});

export const fetchTestById = createAsyncThunk('test/fetchById', async (testId: number, { rejectWithValue }) => {
  try {
    return await testService.getById(testId);
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to fetch test');
  }
});

export const createTest = createAsyncThunk('test/create', async (data: TestCreate, { rejectWithValue }) => {
  try {
    return await testService.create(data);
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to create test');
  }
});

export const updateTest = createAsyncThunk(
  'test/update',
  async ({ testId, data }: { testId: number; data: TestUpdate }, { rejectWithValue }) => {
    try {
      return await testService.update(testId, data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update test');
    }
  }
);

export const deleteTest = createAsyncThunk('test/delete', async (testId: number, { rejectWithValue }) => {
  try {
    await testService.delete(testId);
    return testId;
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to delete test');
  }
});

export const publishTest = createAsyncThunk('test/publish', async (testId: number, { rejectWithValue }) => {
  try {
    return await testService.publish(testId);
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to publish test');
  }
});

export const unpublishTest = createAsyncThunk('test/unpublish', async (testId: number, { rejectWithValue }) => {
  try {
    return await testService.unpublish(testId);
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to unpublish test');
  }
});

export const createTestQuestions = createAsyncThunk(
  'test/createQuestions',
  async (
    { testId, questions }: { testId: number; questions: TestQuestionCreate[] },
    { rejectWithValue }
  ) => {
    try {
      return await testService.createQuestions(testId, questions);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create questions');
    }
  }
);

export const updateTestQuestion = createAsyncThunk(
  'test/updateQuestion',
  async (
    { testId, questionId, data }: { testId: number; questionId: number; data: TestQuestionUpdate },
    { rejectWithValue }
  ) => {
    try {
      return await testService.updateQuestion(testId, questionId, data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update question');
    }
  }
);

export const deleteTestQuestion = createAsyncThunk(
  'test/deleteQuestion',
  async ({ testId, questionId }: { testId: number; questionId: number }, { rejectWithValue }) => {
    try {
      await testService.deleteQuestion(testId, questionId);
      return questionId;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to delete question');
    }
  }
);

export const submitTest = createAsyncThunk(
  'test/submit',
  async ({ testId, data }: { testId: number; data: TestSubmit }, { rejectWithValue }) => {
    try {
      return await testService.submit(testId, data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to submit test');
    }
  }
);

export const fetchMyTestAttempt = createAsyncThunk(
  'test/fetchAttempt',
  async (testId: number, { rejectWithValue }) => {
    try {
      return await testService.getAttempt(testId);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch attempt');
    }
  }
);

export const fetchTestResults = createAsyncThunk(
  'test/fetchResults',
  async (testId: number, { rejectWithValue }) => {
    try {
      return await testService.getResults(testId);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch results');
    }
  }
);

export const fetchTestAnalytics = createAsyncThunk(
  'test/fetchAnalytics',
  async (testId: number, { rejectWithValue }) => {
    try {
      return await testService.getAnalytics(testId);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch analytics');
    }
  }
);

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    clearTestError: (state) => {
      state.error = null;
    },
    clearCurrentTest: (state) => {
      state.currentTest = null;
      state.attempt = null;
      state.results = [];
      state.analytics = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyTests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myTests = action.payload;
      })
      .addCase(fetchMyTests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTestById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTestById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTest = action.payload;
      })
      .addCase(fetchTestById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createTest.fulfilled, (state, action) => {
        state.myTests.unshift(toListItem(action.payload));
      })
      .addCase(updateTest.fulfilled, (state, action) => {
        const index = state.myTests.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.myTests[index] = toListItem(action.payload, state.myTests[index]);
        }
        if (state.currentTest?.id === action.payload.id) {
          state.currentTest = {
            ...state.currentTest,
            ...action.payload,
          };
        }
      })
      .addCase(deleteTest.fulfilled, (state, action) => {
        state.myTests = state.myTests.filter((item) => item.id !== action.payload);
        if (state.currentTest?.id === action.payload) {
          state.currentTest = null;
        }
      })
      .addCase(publishTest.fulfilled, (state, action) => {
        const index = state.myTests.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.myTests[index] = toListItem(action.payload, state.myTests[index]);
        }
      })
      .addCase(unpublishTest.fulfilled, (state, action) => {
        const index = state.myTests.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.myTests[index] = toListItem(action.payload, state.myTests[index]);
        }
      })
      .addCase(createTestQuestions.fulfilled, (state, action) => {
        if (!state.currentTest) {
          return;
        }
        state.currentTest.questions = [...state.currentTest.questions, ...action.payload].sort(
          (left, right) => left.order_index - right.order_index
        );
      })
      .addCase(updateTestQuestion.fulfilled, (state, action) => {
        if (!state.currentTest) {
          return;
        }
        const index = state.currentTest.questions.findIndex((question) => question.id === action.payload.id);
        if (index !== -1) {
          state.currentTest.questions[index] = action.payload;
        }
      })
      .addCase(deleteTestQuestion.fulfilled, (state, action) => {
        if (!state.currentTest) {
          return;
        }
        state.currentTest.questions = state.currentTest.questions.filter(
          (question) => question.id !== action.payload
        );
      })
      .addCase(submitTest.fulfilled, (state, action) => {
        state.attempt = action.payload;
        const testIndex = state.myTests.findIndex((item) => item.id === action.payload.attempt.test_id);
        if (testIndex !== -1) {
          const existing = state.myTests[testIndex];
          if (!existing) {
            return;
          }
          state.myTests[testIndex] = {
            ...existing,
            attempt: action.payload.attempt,
          };
        }
      })
      .addCase(fetchMyTestAttempt.fulfilled, (state, action) => {
        state.attempt = action.payload;
      })
      .addCase(fetchTestResults.fulfilled, (state, action) => {
        state.results = action.payload;
      })
      .addCase(fetchTestAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      .addMatcher(
        (action) => action.type.startsWith('test/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.error = ((action as { payload?: unknown }).payload as string) ?? 'Test request failed';
          state.isLoading = false;
        }
      )
      .addMatcher(
        (action) =>
          action.type.startsWith('test/') &&
          action.type.endsWith('/pending') &&
          !action.type.includes('fetchMy') &&
          !action.type.includes('fetchById'),
        (state) => {
          state.error = null;
        }
      );
  },
});

export const { clearTestError, clearCurrentTest } = testSlice.actions;
export default testSlice.reducer;
