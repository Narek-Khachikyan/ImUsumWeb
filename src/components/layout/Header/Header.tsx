import cn from 'classnames';
import logo from '../../../assets/logo.svg';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { path: '/', label: 'Главная' },
  { path: '/documentation', label: 'Документация' },
] as const;

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-blue-main">
      <div className="max-w-[1240px] mx-auto px-[15px]">
        <div className="flex justify-between items-center py-6 font-medium">
          <Link to="/">
            <img src={logo} alt="ImUsum logo" />
          </Link>
          <nav>
            <ul className="flex items-center gap-4">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      className={cn(
                        'py-3 px-3 rounded-[10px] transition-all duration-300 ease-in-out font-medium',
                        isActive
                          ? 'bg-white text-blue-main'
                          : 'text-white hover:bg-white hover:text-blue-main'
                      )}
                      to={item.path}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="py-2 px-4 text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  {user?.first_name} {user?.last_name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="py-2 px-4 text-blue-main bg-white rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="py-2 px-4 text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="py-2 px-6 text-blue-main bg-white rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
