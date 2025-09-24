import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/database';

export function createClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  return { supabase, response };
}

// Helper function to get tenant context from request headers
export function getTenantContextFromRequest(request: NextRequest) {
  return {
    tenantSlug: request.headers.get('x-tenant-slug'),
    tenantId: request.headers.get('x-tenant-id'),
    userRole: request.headers.get('x-user-role') as 'ADMIN' | 'ANALYST' | 'REVIEWER' | null,
    isSuperAdmin: request.headers.get('x-is-super-admin') === 'true',
    locale: request.headers.get('x-locale') || 'en',
  };
}

// Helper function to create a client with tenant context for route handlers
export function createClientWithTenant(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const context = getTenantContextFromRequest(request);
  
  // For route handlers, we'll use the tenant context from headers
  // set by middleware rather than RLS config functions
  return { supabase, response, context };
}