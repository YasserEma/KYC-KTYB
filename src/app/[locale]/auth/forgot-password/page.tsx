'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface TenantBrand {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  company_name?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tenantBrand, setTenantBrand] = useState<TenantBrand | null>(null);
  
  const t = useTranslations('auth');
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    // Fetch tenant branding information
    const fetchTenantBranding = async () => {
      try {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        
        if (isLocalhost) {
          // For localhost, use default branding
          setTenantBrand({
            company_name: 'KYC Platform',
            primary_color: '#4F46E5',
            secondary_color: '#6366F1'
          });
          return;
        }

        // For production, fetch tenant branding based on subdomain
        const subdomain = hostname.split('.')[0];
        const response = await fetch(`/api/tenant/branding?slug=${subdomain}`);
        
        if (response.ok) {
          const data = await response.json();
          setTenantBrand(data);
        } else {
          // Fallback to default branding
          setTenantBrand({
            company_name: 'KYC Platform',
            primary_color: '#4F46E5',
            secondary_color: '#6366F1'
          });
        }
      } catch (error) {
        console.error('Error fetching tenant branding:', error);
        setTenantBrand({
          company_name: 'KYC Platform',
          primary_color: '#4F46E5',
          secondary_color: '#6366F1'
        });
      }
    };

    fetchTenantBranding();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error cases with internationalized messages
        setError(data.error || t('errors.general'));
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = tenantBrand?.primary_color || '#4F46E5';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            {tenantBrand?.logo_url ? (
              <img
                className="h-12 w-auto"
                src={tenantBrand.logo_url}
                alt={tenantBrand.company_name || 'Company Logo'}
              />
            ) : (
              <div 
                className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: primaryColor }}
              >
                {(tenantBrand?.company_name || 'KYC').charAt(0)}
              </div>
            )}
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {t('forgotPassword')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  {t('resetLinkSentSuccess')}
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    {t('resetLinkSent')} <strong>{email}</strong>
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/${locale}/auth/login`}
                    className="text-green-700 underline hover:text-green-600"
                  >
                    Return to login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="sr-only">
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !email}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: loading || !email ? '#9CA3AF' : primaryColor,
                  borderColor: loading || !email ? '#9CA3AF' : primaryColor
                }}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading ? 'Sending...' : t('sendResetLink')}
              </button>
            </div>

            <div className="text-center">
              <Link
                href={`/${locale}/auth/login`}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}