'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClientWithTenant } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  interface TenantBrand {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    name?: string;
  }

  const [tenantBrand, setTenantBrand] = useState<TenantBrand | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/entities';
  const t = useTranslations('auth');

  useEffect(() => {
    const fetchTenantBranding = async () => {
      try {
        const { client: supabase } = createClientWithTenant();
        
        // Get tenant slug from hostname
        const hostname = window.location.hostname;
        const tenantSlug = hostname.split('.')[0];
        
        if (tenantSlug) {
          // Fetch tenant data including brand information
          const { data, error } = await supabase
            .from('tenants')
            .select('name, brand')
            .eq('slug', tenantSlug)
            .single();
            
          if (data && !error) {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { client: supabase } = createClientWithTenant();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        
        // Log failed login attempt to audit_logs
        try {
          await supabase.from('audit_logs').insert({
            action: 'AUTH_LOGIN_FAILED',
            actor_user_id: null,
            actor_ip: null,
            tenant_id: null,
            metadata: { email, error: error.message }
          });
        } catch (auditError) {
          console.error('Failed to log auth error:', auditError);
        }
        
        return;
      }

      if (data.user) {
        // Log successful login to audit_logs
        try {
          await supabase.from('audit_logs').insert({
            action: 'AUTH_LOGIN_SUCCESS',
            actor_user_id: data.user.id,
            actor_ip: null,
            tenant_id: null,
            metadata: { email }
          });
        } catch (auditError) {
          console.error('Failed to log successful auth:', auditError);
        }
        
        // Redirect to entities page after login
        router.push('/entities');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
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
            {tenantBrand?.name ? `Sign in to ${tenantBrand.name}` : 'Sign in to your account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </a>
            </div>
            <div className="text-sm">
              <a href="/en/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Create an account
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              style={buttonStyle}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}