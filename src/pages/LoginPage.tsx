import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { User, Shield, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../asserts/skillconnect.png';

const LoginPage: React.FC = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
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
      const success = await login(mobileNumber || email|| username, password);
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
        setError(t('error.invalid_credentials'));
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 mx-auto">
        <div className="bg-blue rounded-2xl shadow-hard border border-gray-100 p-6 sm:p-8 animate-scale-in">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center bg-primary-100">
              <img className="h-14 w-14 sm:h-16 sm:w-16" src={Logo} alt="skillconnect Logo" />
            </div>
            <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-primary-900">
              {t('auth.welcome')}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 font-medium">
              {t('auth.connect')}
            </p>
          </div>

        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="mobileNumber" className="sr-only">
                Mobile Number
              </label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                required
                className="appearance-none rounded-none relative block w-full px-3 sm:px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:z-10 text-base sm:text-sm transition-all duration-200"
                placeholder="Mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit mobile number"
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
                className="appearance-none rounded-none relative block w-full px-3 sm:px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:z-10 text-base sm:text-sm transition-all duration-200"
                placeholder={t('auth.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-danger-50 border border-danger-200 p-4">
              <div className="text-sm text-danger-700 font-medium">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm sm:text-base font-bold rounded-xl text-white bg-gradient-to-r from-primary-500 via-accent-400 to-accent-500 hover:from-primary-600 hover:via-accent-500 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 min-h-12"
            >
                {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
                className="font-medium text-accent-600 hover:text-accent-500"
              >
                {t('auth.sign_up_here')}
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
