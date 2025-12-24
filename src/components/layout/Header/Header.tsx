import cn from 'classnames';
import logo from '../../../assets/logo.svg';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
   const location = useLocation();
   return (
      <header className="bg-blue-main">
         <div className="max-w-[1240px] mx-auto px-[15px]">
            <div className="flex justify-between items-center py-6 font-medium">
               <img src={logo} alt="header-logo" />
               <nav>
                  <ul className="flex items-center gap-4 text-white">
                     <li>
                        <Link
                           className={cn(
                              'py-3 px-3 rounded-[10px] transition-all duration-300 ease-in-out font-medium',
                              location.pathname === '/'
                                 ? 'bg-white text-blue-main'
                                 : 'hover:bg-white hover:text-blue-main'
                           )}
                           to={'/'}>
                           Home
                        </Link>
                     </li>
                     <li>
                        <Link
                           className={cn(
                              'py-3 px-3 rounded-[10px] transition-all duration-300 ease-in-out font-medium',
                              location.pathname === '/documentation'
                                 ? 'bg-white text-blue-main'
                                 : 'hover:bg-white hover:text-blue-main'
                           )}
                           to={'/documentation'}>
                           Documentation
                        </Link>
                     </li>
                  </ul>
               </nav>
               <button className="py-1 px-7 text-blue-main bg-white rounded-xl">
                  Sign In
               </button>
            </div>
         </div>
      </header>
   );
};

export default Header;
