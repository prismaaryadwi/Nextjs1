'use client';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, isLoading, error: authError, user } = useAuth();
  const router = useRouter();

  // Auto redirect jika sudah login
  useEffect(() => {
    if (user) {
      console.log('✅ User detected, redirecting to home...');
      // Use window.location for reliable redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLocalError('');
    setLoginSuccess(false);
    
    if (!email || !password) {
      setLocalError('Email and password are required');
      return;
    }

    console.log('🔄 Login form submitted');
    const success = await login(email, password);
    
    if (success) {
      console.log('✅ Login function returned success');
      setLoginSuccess(true);
      // The useEffect above will handle redirect when user state updates
    } else {
      console.log('❌ Login function returned false');
    }
  };

  // Gabungkan local error dan auth error
  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-300 py-4">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold text-gray-900">SEIJA MAGAZINE</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
              Log in to your account
            </h2>
            <p className="text-gray-600">
              Enter your email and password to continue
            </p>
          </div>

          {loginSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 text-sm">
              ✅ Login successful! Redirecting...
            </div>
          )}

          {displayError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black focus:border-black transition-all duration-200 outline-none text-gray-900 placeholder-gray-500 disabled:opacity-50"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black focus:border-black transition-all duration-200 outline-none text-gray-900 placeholder-gray-500 disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  disabled={isLoading}
                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 disabled:opacity-50"
              >
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white py-4 px-4 rounded-sm font-medium transition-all duration-200 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Continue'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-600 mb-6">
              By continuing, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>, 
              and acknowledge that you have read our <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-4">
                Don't have an account?
              </p>
              <Link 
                href="/auth/register" 
                className="inline-block w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 py-3 px-4 rounded-sm font-medium transition-all duration-200 text-center"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-300 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600 text-sm">
            <p>© 2025 SEIJA MAGAZINE</p>
            <div className="mt-2 space-x-4">
              <a href="#" className="hover:text-gray-900">Contact Us</a>
              <a href="#" className="hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}