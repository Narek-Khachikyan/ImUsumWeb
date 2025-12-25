import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import SEO from '@/components/ui/SEO';

export default function LoginPage() {
   const navigate = useNavigate();
   const { login, isLoading, error, clearAuthError } = useAuth();
   const [formData, setFormData] = useState({
      email: '',
      password: '',
   });

   const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      clearAuthError();

      const result = await login(formData);
      if (result.meta.requestStatus === 'fulfilled') {
         navigate('/dashboard');
      }
   };

   return (
      <>
         <SEO title="Մուտք | ImUsum" description="Մուտք գործեք ձեր ImUsum հաշիվ" />
         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
               <div>
                  <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                     Մուտք դեպի հաշիվ
                  </h2>
                  <p className="mt-2 text-center text-sm text-gray-600">
                     Կամ{' '}
                     <Link
                        to="/register"
                        className="font-medium text-blue-main hover:text-blue-dark"
                     >
                        ստեղծեք նոր հաշիվ
                     </Link>
                  </p>
               </div>

               <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                  {error && (
                     <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                     </div>
                  )}

                  <div className="space-y-4">
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
                           value={formData.email}
                           onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                           className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-main focus:border-transparent"
                           placeholder="your@email.com"
                        />
                     </div>

                     <div>
                        <label
                           htmlFor="password"
                           className="block text-sm font-medium text-gray-700"
                        >
                           Գաղտնաբառ
                        </label>
                        <input
                           id="password"
                           name="password"
                           type="password"
                           autoComplete="current-password"
                           required
                           value={formData.password}
                           onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                           className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-main focus:border-transparent"
                           placeholder="••••••••"
                        />
                     </div>
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center">
                        <input
                           id="remember-me"
                           name="remember-me"
                           type="checkbox"
                           className="h-4 w-4 text-blue-main focus:ring-blue-main border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                           Հիշել ինձ
                        </label>
                     </div>

                     <div className="text-sm">
                        <Link
                           to="/forgot-password"
                           className="font-medium text-blue-main hover:text-blue-dark"
                        >
                           Մոռացե՞լ եք գաղտնաբառը
                        </Link>
                     </div>
                  </div>

                  <button
                     type="submit"
                     disabled={isLoading}
                     className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-main hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-main disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                     {isLoading ? (
                        <svg
                           className="animate-spin h-5 w-5 text-white"
                           xmlns="http://www.w3.org/2000/svg"
                           fill="none"
                           viewBox="0 0 24 24"
                        >
                           <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                           />
                           <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                           />
                        </svg>
                     ) : (
                        'Մուտք'
                     )}
                  </button>
               </form>

               <div className="text-center">
                  <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
                     ← Վերադառնալ գլխավոր էջ
                  </Link>
               </div>
            </div>
         </div>
      </>
   );
}
