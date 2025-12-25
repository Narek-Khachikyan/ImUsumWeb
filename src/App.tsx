import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainTemplate from './templates/MainTemplate';
import { ProtectedRoute, GuestRoute } from './components/auth';

// Lazy load page components
const Home = lazy(() => import('./pages/Home/Home'));
const Documentation = lazy(() => import('./pages/Documentation/Documentation'));

// Auth pages
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'));

// Dashboard pages
const DashboardLayout = lazy(() => import('./pages/Dashboard/DashboardLayout'));
const DashboardHome = lazy(() => import('./pages/Dashboard/DashboardHome'));
const SchedulePage = lazy(() => import('./pages/Dashboard/SchedulePage'));
const AssignmentsPage = lazy(() => import('./pages/Dashboard/AssignmentsPage'));
const GradesPage = lazy(() => import('./pages/Dashboard/GradesPage'));
const ProfilePage = lazy(() => import('./pages/Dashboard/ProfilePage'));
const UsersPage = lazy(() => import('./pages/Dashboard/UsersPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-main"></div>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Public routes with MainTemplate */}
      <Route path="/" element={<MainTemplate />}>
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <Home />
            </Suspense>
          }
        />
        <Route
          path="documentation"
          element={
            <Suspense fallback={<PageLoader />}>
              <Documentation />
            </Suspense>
          }
        />
      </Route>

      {/* Auth routes (guest only) */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Suspense fallback={<PageLoader />}>
              <RegisterPage />
            </Suspense>
          </GuestRoute>
        }
      />

      {/* Protected Dashboard routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <DashboardLayout />
            </Suspense>
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <DashboardHome />
            </Suspense>
          }
        />
        <Route
          path="schedule"
          element={
            <Suspense fallback={<PageLoader />}>
              <SchedulePage />
            </Suspense>
          }
        />
        <Route
          path="assignments"
          element={
            <Suspense fallback={<PageLoader />}>
              <AssignmentsPage />
            </Suspense>
          }
        />
        <Route
          path="grades"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Suspense fallback={<PageLoader />}>
                <GradesPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['director', 'admin']}>
              <Suspense fallback={<PageLoader />}>
                <UsersPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<PageLoader />}>
              <ProfilePage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
