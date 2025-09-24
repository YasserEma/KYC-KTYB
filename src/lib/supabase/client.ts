import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton pattern for client-side Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

// Helper function to create a client with tenant context for client-side operations
export function createClientWithTenant(tenantId?: string) {
  const client = getSupabaseClient();
  
  // For client-side operations, we'll rely on middleware to set proper headers
  // and use the tenant context from the URL/headers rather than RLS config
  return {
    client,
    tenantId
  };
}