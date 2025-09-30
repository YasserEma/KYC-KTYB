'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientWithTenant } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  interface TenantBrand {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    name?: string;
  }
  
  const [tenantBrand, setTenantBrand] = useState<TenantBrand | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  const router = useRouter();
  const t = useTranslations('auth');

  useEffect(() => {
    const fetchTenantBranding = async () => {
      try {
        const { client: supabase } = await createClientWithTenant();
        
        // Get tenant slug from hostname
        const hostname = window.location.hostname;
        const tenantSlug = hostname.split('.')[0];
        
        // For local development, use 'acme' as default tenant
        const effectiveSlug = hostname === 'localhost' ? 'acme' : tenantSlug;
        
        if (effectiveSlug) {
          // Fetch tenant data including brand information
          const { data, error } = await supabase
            .from('tenants')
            .select('id, name, brand')
            .eq('slug', effectiveSlug)
            .single();
            
          if (data && !error) {
            setTenantId(data.id);
            const brandData = data.brand as any;
            setTenantBrand({
              logo: brandData?.logo,
              primaryColor: brandData?.primaryColor || '#4f46e5', // Default to indigo if not set
              secondaryColor: brandData?.secondaryColor || '#818cf8',
              name: data.name
            });
          }
        }
      } catch (err) {
        console.error('Error fetching tenant branding:', err);
      }
    };
    
    fetchTenantBranding();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { client: supabase } = await createClientWithTenant();
      
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        setError(error.message);
        
        // Log failed signup attempt to audit_logs
        try {
          await supabase.from('audit_logs').insert({
            action: 'AUTH_SIGNUP_FAILED',
            actor_user_id: null,
            actor_ip: null,
            tenant_id: tenantId,
            metadata: { email, error: error.message }
          }).select();
        } catch (auditError) {
          console.error('Failed to log auth error:', auditError);
        }
        
        return;
      }

      if (data.user) {
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            display_name: displayName,
            email: email
          });

        if (profileError) {
          setError('Error creating user profile');
          console.error('Profile creation error:', profileError);
          return;
        }

        // Associate user with tenant (user_tenants table)
        if (tenantId) {
          const { error: tenantError } = await supabase
            .from('user_tenants')
            .insert({
              user_id: data.user.id,
              tenant_id: tenantId,
              role: 'ANALYST' // Default role
            }).select();

          if (tenantError) {
            setError('Error associating user with tenant');
            console.error('Tenant association error:', tenantError);
            return;
          }
        }

        // Log successful signup to audit_logs
        try {
          await supabase.from('audit_logs').insert({
            action: 'AUTH_SIGNUP_SUCCESS',
            actor_user_id: data.user.id,
            actor_ip: null,
            tenant_id: tenantId,
            metadata: { email, display_name: displayName }
          }).select();
        } catch (auditError) {
          console.error('Failed to log successful signup:', auditError);
        }
        
        // Show success message
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic styles based on tenant branding
  const buttonStyle = {
    backgroundColor: tenantBrand?.primaryColor || '#4f46e5',
    borderColor: tenantBrand?.primaryColor || '#4f46e5',
    ':hover': {
      backgroundColor: tenantBrand?.secondaryColor || '#818cf8',
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {tenantBrand?.logo ? (
            <div className="flex justify-center">
              <img 
                src={tenantBrand.logo} 
                alt={`${tenantBrand.name || 'Company'} Logo`}
                className="h-16 w-auto"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-500">KYC</span>
              </div>
            </div>
          )}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {tenantBrand?.name ? `Sign up for ${tenantBrand.name}` : 'Create your account'}
          </h2>
        </div>
        
        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded text-center">
            <p className="font-medium">Success! Please check your email to confirm your account.</p>
            <p className="mt-2">
              <Link href="/auth/login" className="text-green-700 underline">
                Return to login
              </Link>
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="displayName" className="sr-only">
                  Display Name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                style={buttonStyle}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Signing up...' : 'Sign up'}
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}