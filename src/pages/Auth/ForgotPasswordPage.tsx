import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/ui/SEO';
import { authService } from '@/services/authService';

const GENERIC_SUCCESS_MESSAGE = 'Եթե տվյալ էլ․ փոստը գոյություն ունի, ուղեցույցը ուղարկվել է։';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword({ email });
      setSuccessMessage(response.message || GENERIC_SUCCESS_MESSAGE);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Հարցումը ձախողվեց։ Փորձեք կրկին։');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO title="Վերականգնել գաղտնաբառը | ImUsum" description="Վերականգնեք ձեր գաղտնաբառը" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Վերականգնել գաղտնաբառը
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Մուտքագրեք ձեր էլ․ փոստը, և մենք կուղարկենք վերականգնման հղումը։
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

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Էլ․ փոստ
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-main focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-main hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-main disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Ուղարկվում է...' : 'Ուղարկել վերականգնման հղում'}
            </button>
          </form>

          <div className="text-center space-y-2">
            <div>
              <Link to="/login" className="text-sm text-blue-main hover:text-blue-dark">
                ← Վերադառնալ մուտք
              </Link>
            </div>
            <div>
              <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
                ← Վերադառնալ գլխավոր էջ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
