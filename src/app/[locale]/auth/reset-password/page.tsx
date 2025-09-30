'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { EmailOtpType } from '@supabase/supabase-js';

interface TenantBrand {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  company_name?: string;
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tenantBrand, setTenantBrand] = useState<TenantBrand | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const t = useTranslations('auth');
  const tError = useTranslations('errors');
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;

  // Handle client-side mounting to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side after component is mounted
    if (!isMounted) return;
    
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
  }, [isMounted]);

  useEffect(() => {
    // Only run on client side after component is mounted
    if (!isMounted) return;
    
    // Check if user has a valid password reset session
    const checkResetSession = async () => {
      try {
        const supabase = createClient();
        
        // Log all URL parameters for debugging
        console.log('=== RESET PASSWORD DEBUG ===');
        console.log('All search params:', Object.fromEntries(searchParams.entries()));
        
        // Check for token_hash and type parameters from password reset link (new format)
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        // Also check for legacy code parameter (old format)
        const code = searchParams.get('code');
        
        console.log('Extracted parameters:', { token_hash, type, code });
        
        if (token_hash && type) {
          console.log('Using NEW format: verifyOtp with token_hash and type');
          // New format: Verify the OTP token for password reset
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as EmailOtpType,
          });
          
          console.log('verifyOtp result:', { data, error });
          
          if (error) {
            console.error('Token verification error details:', {
              message: error.message,
              status: error.status,
              code: error.code || 'no_code',
              details: error
            });
            setError(tError('general'));
            setIsValidSession(false);
          } else if (data.session) {
            console.log('Successfully verified token and got session');
            setIsValidSession(true);
          } else {
            console.log('No session returned from verifyOtp');
            setError(tError('general'));
            setIsValidSession(false);
          }
        } else if (code) {
          console.log('Using LEGACY format: exchangeCodeForSession with code');
          console.log('WARNING: This is a legacy format that may not work with current Supabase versions');
          
          // Legacy format: Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          console.log('exchangeCodeForSession result:', { data, error });
          
          if (error) {
            console.error('Code exchange error details:', {
              message: error.message,
              status: error.status,
              code: error.code || 'no_code',
              details: error
            });
            
            // Check if this is the common PKCE error
            if (error.message?.includes('code verifier') || error.message?.includes('invalid request')) {
              console.error('LEGACY FORMAT ERROR: The email template is using an outdated format.');
              console.error('Please update your Supabase email template to use the new format:');
              console.error('{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery');
              setError('This reset link is using an outdated format. Please request a new password reset link.');
            } else {
              setError(tError('general'));
            }
            setIsValidSession(false);
           } else if (data.session) {
             console.log('Successfully exchanged code for session');
             setIsValidSession(true);
           } else {
             console.log('No session returned from exchangeCodeForSession');
             setError(tError('general'));
             setIsValidSession(false);
          }
        } else {
          console.log('No token_hash/type or code found, checking existing session');
          // Check if there's already a valid session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          console.log('Existing session check:', { session: !!session, error });
          
          if (error) {
            console.error('Session check error details:', {
              message: error.message,
              status: error.status,
              code: error.code || 'no_code',
              details: error
            });
            setError(tError('general'));
            setIsValidSession(false);
          } else if (session) {
            console.log('Found existing session, checking user');
            // Check if this is a password recovery session by checking user metadata
            const { data: { user } } = await supabase.auth.getUser();
            console.log('User check result:', { user: !!user });
            if (user) {
              console.log('Valid session and user found');
              setIsValidSession(true);
            } else {
              console.log('Session found but no user');
              setError(tError('general'));
              setIsValidSession(false);
            }
          } else {
            console.log('No existing session found and no reset parameters');
            setError(tError('general'));
            setIsValidSession(false);
          }
        }
      } catch (err) {
        console.error('Reset session check error:', err);
        setError(tError('general'));
        setIsValidSession(false);
      } finally {
        setCheckingSession(false);
      }
    };

    checkResetSession();
  }, [searchParams, t, tError, isMounted]);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    
    if (pwd.length < 8) {
      errors.push(t('passwordMinLength'));
    }
    
    if (!/(?=.*[a-z])/.test(pwd)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(pwd)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. '));
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Log successful password reset
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('audit_logs').insert({
            action: 'AUTH_PASSWORD_RESET_SUCCESS',
            actor_user_id: user.id,
            actor_ip: null,
            tenant_id: null,
            metadata: { 
              email: user.email,
              reset_timestamp: new Date().toISOString()
            }
          });
        }
      } catch (auditError) {
        console.error('Failed to log password reset success:', auditError);
      }

      setSuccess(true);
      
      // Sign out the user and redirect to login after a short delay
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push(`/${locale}/auth/login`);
        router.refresh();
      }, 3000);

    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = tenantBrand?.primary_color || '#4F46E5';

  // Show loading during hydration to prevent mismatches
  if (!isMounted || checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
          </div>
          
          <div className="mt-8">
            <a
              href={`/${locale}/auth/forgot-password`}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Request New Reset Link
            </a>
          </div>
        </div>
      </div>
    );
  }

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
              {t('resetPassword')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {t('enterNewPassword')}
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
                  {t('passwordUpdated')}
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    {t('passwordUpdatedSuccessfully')}
                  </p>
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
            
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('newPassword')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t('newPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  {t('confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t('confirmPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
              </ul>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: loading || !password || !confirmPassword ? '#9CA3AF' : primaryColor,
                  borderColor: loading || !password || !confirmPassword ? '#9CA3AF' : primaryColor
                }}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading ? 'Updating Password...' : t('updatePassword')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}