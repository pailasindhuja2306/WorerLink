import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { User, Shield, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../asserts/skillconnect.png';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        // Redirect to the correct dashboard based on user type
        const current = storage.getCurrentUser();
        if (current?.type === 'worker') {
          navigate('/worker');
        } else if (current?.type === 'admin') {
          navigate('/admin');
        } else {
          navigate('/customer');
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center">
            <img className="h-16 w-16" src={Logo} alt="WorkerLink Logo" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('auth.welcome')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.connect')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                {t('auth.email_placeholder')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth.password_placeholder')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                t('auth.sign_in')
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('auth.no_account')}{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {t('auth.sign_up_here')}
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
                <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('auth.demo_accounts')}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-xs text-blue-800 font-medium">{t('auth.demo_customer')}</p>
                <Link to="/customer" className="text-xs text-blue-600">{t('auth.demo_cred_customer')}</Link>
              </div>
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-xs text-green-800 font-medium">{t('auth.demo_worker')}</p>
                <Link to="/worker" className="text-xs text-green-600">{t('auth.demo_cred_worker')}</Link>
              </div>
              <div className="bg-purple-50 p-3 rounded-md">
                <p className="text-xs text-purple-800 font-medium">{t('auth.demo_admin')}</p>
                <p className="text-xs text-purple-600">{t('auth.demo_cred_admin')}</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
