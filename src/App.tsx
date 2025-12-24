import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainTemplate from './templates/MainTemplate';

// Lazy load page components
const Home = lazy(() => import('./pages/Home/Home'));
const Documentation = lazy(() => import('./pages/Documentation/Documentation'));

function App() {
   return (
      <Routes>
         <Route path="/" element={<MainTemplate />}>
            <Route
               path="/"
               element={
                  <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                     <Home />
                  </Suspense>
               }
            />
            <Route
               path="/documentation"
               element={
                  <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                     <Documentation />
                  </Suspense>
               }
            />
         </Route>
      </Routes>
   );
}

export default App;
