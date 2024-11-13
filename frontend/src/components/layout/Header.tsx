import { Button } from '../common/Button';
import useAuth from '../../hooks/useAuth';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="h-16 px-4 flex items-center justify-between">
        {/* Logo / Titolo */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Rubrica Contatti
          </h1>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-gray-500">
                {user.username}
              </span>
              <Button 
                variant="secondary" 
                onClick={logout}
              >
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;