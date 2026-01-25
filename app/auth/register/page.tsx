'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage(): JSX.Element {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');
  const { register, isLoading, error: authError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLocalError('');
    
    // Client-side validation
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setLocalError('Username must be at least 3 characters');
      return;
    }

    const success = await register(username, email, password);
    
    if (success) {
      alert('Account created successfully! Please login.');
      router.push('/auth/login');
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
            <h1 className="text-3xl font-serif font-bold text-gray-900">SEIJA'S MAGAZINE</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
              Create your account
            </h2>
            <p className="text-gray-600">
              Join our community of readers and writers
            </p>
          </div>

          {displayError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                minLength={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black focus:border-black transition-all duration-200 outline-none text-gray-900 placeholder-gray-500"
              />
            </div>

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
                className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black focus:border-black transition-all duration-200 outline-none text-gray-900 placeholder-gray-500"
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
                placeholder="Create a password (min. 6 characters)"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black focus:border-black transition-all duration-200 outline-none text-gray-900 placeholder-gray-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black focus:border-black transition-all duration-200 outline-none text-gray-900 placeholder-gray-500"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white py-4 px-4 rounded-sm font-medium transition-all duration-200 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-600 mb-6">
              By creating an account, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>, 
              and acknowledge that you have read our <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-4">
                Already have an account?
              </p>
              <Link 
                href="/auth/login" 
                className="inline-block w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 py-3 px-4 rounded-sm font-medium transition-all duration-200 text-center"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-300 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600 text-sm">
            <p>© 2025 SEIJA'S MAGAZINE</p>
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