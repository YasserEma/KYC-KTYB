import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Supported locales
const locales = ['en', 'ar'] as const;
type Locale = typeof locales[number];

// Default locale
const defaultLocale: Locale = 'en';

// Super admin domains (can be configured via environment variables)
const SUPER_ADMIN_DOMAINS = process.env.SUPER_ADMIN_DOMAINS?.split(',') || ['admin.localhost:3000'];

// Main app domain (for tenant routing)
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000';

function getLocaleFromRequest(request: NextRequest): Locale {
  // 1. Check URL pathname for locale
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  if (pathnameLocale) return pathnameLocale;

  // 2. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = locales.find(locale => 
      acceptLanguage.toLowerCase().includes(locale)
    );
    if (preferredLocale) return preferredLocale;
  }

  // 3. Default to English
  return defaultLocale;
}

function getTenantFromDomain(hostname: string): string | null {
  // Check if it's a super admin domain
  if (SUPER_ADMIN_DOMAINS.includes(hostname)) {
    return null; // Super admin, no tenant
  }

  // Check if it's the main domain
  if (hostname === MAIN_DOMAIN) {
    return null; // Main domain, tenant will be determined by path or other means
  }

  // Extract tenant from subdomain
  // Format: tenant.domain.com or tenant.localhost:3000
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts[0]; // First part is the tenant slug
  }

  return null;
}

function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    '/auth',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/unauthorized',
    '/tenant-suspended',
    '/error'
  ];

  // Remove locale prefix for checking (e.g., /en/auth/login -> /auth/login)
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');
  
  // Check if the path (with or without locale) starts with any public path
  return publicPaths.some(path => {
    return pathname.startsWith(path) || 
           pathWithoutLocale.startsWith(path) ||
           pathname === path ||
           pathWithoutLocale === path;
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Skip middleware for static files and API routes (except auth)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') && !pathname.startsWith('/api/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Create Supabase client for middleware
  const response = NextResponse.next();
  
  // Check if Supabase environment variables are properly configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  let session = null;
  
  if (supabaseUrl && supabaseAnonKey && 
      supabaseUrl !== 'your_supabase_project_url' && 
      supabaseAnonKey !== 'your_supabase_anon_key') {
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    );

    // Get session
    try {
      const { data } = await supabase.auth.getSession();
      session = data.session;
    } catch (error) {
      console.warn('Failed to get session:', error);
    }
  }

  // Determine tenant from domain
  const tenantSlug = getTenantFromDomain(hostname);
  const isSuperAdmin = SUPER_ADMIN_DOMAINS.includes(hostname);

  // Get locale
  const locale = getLocaleFromRequest(request);

  // Handle locale redirection
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Only redirect to add locale if path doesn't have locale and it's not a static/API path
  // Also check if it's not already a public path to avoid redirect loops
  if (!pathnameHasLocale && 
      !pathname.startsWith('/_next') && 
      !pathname.startsWith('/api') && 
      !pathname.includes('.') &&
      !isPublicPath(pathname)) {
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Set tenant context in headers for the application
  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) {
    requestHeaders.set('x-tenant-slug', tenantSlug);
  }
  if (isSuperAdmin) {
    requestHeaders.set('x-is-super-admin', 'true');
  }
  requestHeaders.set('x-locale', locale);

  // Authentication checks (only if Supabase is configured)
  if (supabaseUrl && supabaseAnonKey && 
      supabaseUrl !== 'your_supabase_project_url' && 
      supabaseAnonKey !== 'your_supabase_anon_key') {
    
    if (!session && !isPublicPath(pathname)) {
      // Redirect to login with locale
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If user is authenticated, check tenant access (for non-super-admin domains)
    if (session && tenantSlug && !isSuperAdmin) {
      try {
        const supabase = createServerClient(
          supabaseUrl,
          supabaseAnonKey,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll()
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                  response.cookies.set(name, value, options)
                })
              },
            },
          }
        );

        // Check if user has access to this tenant
        const { data: userTenant, error } = await supabase
          .from('user_tenants')
          .select('role, tenant:tenants(id, slug, status)')
          .eq('user_id', session.user.id)
          .eq('tenant.slug', tenantSlug)
          .single();

        if (error || !userTenant) {
          // User doesn't have access to this tenant
          const unauthorizedUrl = new URL(`/${locale}/unauthorized`, request.url);
          return NextResponse.redirect(unauthorizedUrl);
        }

        // Type the tenant data properly - Supabase joins return arrays
        const tenant = Array.isArray(userTenant.tenant) 
          ? userTenant.tenant[0] as { id: string; slug: string; status: string } | undefined
          : userTenant.tenant as { id: string; slug: string; status: string } | null;

        // Check if tenant is active
        if (tenant?.status !== 'ACTIVE') {
          const suspendedUrl = new URL(`/${locale}/tenant-suspended`, request.url);
          return NextResponse.redirect(suspendedUrl);
        }

        // Set user role in tenant context
        requestHeaders.set('x-user-role', userTenant.role);
        requestHeaders.set('x-tenant-id', tenant?.id || '');
      } catch (error) {
        console.error('Error checking tenant access:', error);
        const errorUrl = new URL(`/${locale}/error`, request.url);
        return NextResponse.redirect(errorUrl);
      }
    }

    // For super admin domains, check if user is actually a super admin
    if (session && isSuperAdmin) {
      try {
        const supabase = createServerClient(
          supabaseUrl,
          supabaseAnonKey,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll()
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                  response.cookies.set(name, value, options)
                })
              },
            },
          }
        );

        const { data: superAdmin, error } = await supabase
          .from('super_admins')
          .select('user_id')
          .eq('user_id', session.user.id)
          .single();

        if (error || !superAdmin) {
          // User is not a super admin
          const unauthorizedUrl = new URL(`/${locale}/unauthorized`, request.url);
          return NextResponse.redirect(unauthorizedUrl);
        }
      } catch (error) {
        console.error('Error checking super admin status:', error);
        const errorUrl = new URL(`/${locale}/error`, request.url);
        return NextResponse.redirect(errorUrl);
      }
    }
  } else {
    // Development mode: Skip authentication when Supabase is not configured
    console.warn('Supabase not configured - running in development mode without authentication');
    requestHeaders.set('x-dev-mode', 'true');
  }

  // Return response with updated headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};