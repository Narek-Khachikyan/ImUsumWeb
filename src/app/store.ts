import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import scheduleReducer from './slices/scheduleSlice';
import assignmentReducer from './slices/assignmentSlice';
import gradeReducer from './slices/gradeSlice';
import offersReducer from './slices/offersSlice';
import testReducer from './slices/testSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    schedule: scheduleReducer,
    assignment: assignmentReducer,
    grade: gradeReducer,
    offers: offersReducer,
    test: testReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
