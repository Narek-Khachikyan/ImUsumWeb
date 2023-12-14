import { Outlet } from 'react-router-dom';
import '../styles/globalStyles.css';
import Header from '../components/Header/Header';

const MainTemplate = () => {
   return (
      <>
         <Header />
         <div className="container">
            <Outlet />
         </div>
      </>
   );
};

export default MainTemplate;
