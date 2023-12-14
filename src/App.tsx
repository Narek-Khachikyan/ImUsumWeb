import { Route, Routes } from 'react-router-dom';
import MainTemplate from './templates/MainTemplate';
import Home from './pages/Home/Home';
import Documentation from './pages/Documentation/Documentation';

function App() {
   return (
      <Routes>
         <Route path="/" element={<MainTemplate />}>
            <Route path="/" element={<Home />} />
            <Route path="/documentation" element={<Documentation />} />
         </Route>
      </Routes>
   );
}

export default App;
