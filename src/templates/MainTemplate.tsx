import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout';

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
