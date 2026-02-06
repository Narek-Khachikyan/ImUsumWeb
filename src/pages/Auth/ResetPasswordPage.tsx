import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '@/components/ui/SEO';
import { authService } from '@/services/authService';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef<number | null>(null);
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!token) {
      setError('Վերականգնման հղումը անվավեր է։');
      return;
    }

    if (password.length < 6) {
      setError('Գաղտնաբառը պետք է պարունակի առնվազն 6 նիշ');
      return;
    }

    if (password !== confirmPassword) {
      setError('Գաղտնաբառերը չեն համընկնում');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword({
        token,
        new_password: password,
      });
      setSuccessMessage(response.message || 'Գաղտնաբառը հաջողությամբ փոխվեց։');
      redirectTimeoutRef.current = window.setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Չհաջողվեց փոխել գաղտնաբառը։ Փորձեք կրկին։');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO title="Նոր գաղտնաբառ | ImUsum" description="Սահմանեք նոր գաղտնաբառ" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Սահմանել նոր գաղտնաբառ
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Մուտքագրեք նոր գաղտնաբառը ձեր հաշվի համար։
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {successMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Նոր գաղտնաբառ
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Հաստատեք նոր գաղտնաբառը
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-main focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-main hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-main disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Պահպանվում է...' : 'Պահպանել նոր գաղտնաբառը'}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-main hover:text-blue-dark">
              ← Վերադառնալ մուտք
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
