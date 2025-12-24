import cn from 'classnames';
import styles from './header.module.css';
import logo from '../../assets/logo.svg';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
   const location = useLocation();
   return (
      <header className={cn(styles.header, 'bg-blue-main')}>
         <div className={cn(styles.container)}>
            <div
               className={cn(styles.content, 'flex justify-between items-center py-6 font-medium')}>
               <img src={logo} alt="header-logo" />
               <nav className={cn(styles.navigation)}>
                  <ul className={cn(styles.navList, 'flex items-center gap-4 text-white ')}>
                     <li className={cn(styles.navItem)}>
                        <Link
                           className={location.pathname === '/' ? styles.activeLink : styles.link}
                           to={'/'}>
                           Home
                        </Link>
                     </li>
                     <li className={cn(styles.navItem)}>
                        <Link
                           className={
                              location.pathname === '/documentation' ? styles.activeLink : styles.link
                           }
                           to={'/documentation'}>
                           Documentation
                        </Link>
                     </li>
                  </ul>
               </nav>
               <button
                  className={cn(styles.button, 'py-1 px-7 text-blue-main bg-white rounded-xl')}>
                  Sign In
               </button>
            </div>
         </div>
      </header>
   );
};

export default Header;
