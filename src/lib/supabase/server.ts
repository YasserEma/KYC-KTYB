import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Helper function to get tenant context from headers
export async function getTenantContext() {
  const headersList = await headers();
  
  return {
    tenantSlug: headersList.get('x-tenant-slug'),
    tenantId: headersList.get('x-tenant-id'),
    userRole: headersList.get('x-user-role') as 'ADMIN' | 'ANALYST' | 'REVIEWER' | null,
    isSuperAdmin: headersList.get('x-is-super-admin') === 'true',
    locale: headersList.get('x-locale') || 'en',
  };
}

// Helper function to create a client with tenant context
export async function createClientWithTenant() {
  const client = await createClient();
  const context = await getTenantContext();
  
  // For server-side operations, we'll use the tenant context from headers
  // set by middleware rather than RLS config functions
  return { client, context };
}