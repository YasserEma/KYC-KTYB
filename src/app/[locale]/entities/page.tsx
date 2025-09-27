import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getTenantContext } from '@/lib/supabase/server';
import EntitiesClient from './EntitiesClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Types for entity data
type Entity = {
  id: string;
  name: string;
  status: string;
  type: string;
  nationality_codes: string[] | null;
  government_id: string | null;
  created_at: string;
  created_by: string;
};

// Server component to fetch entities data
async function EntitiesData({
  page = 1,
  pageSize = 10,
  sortBy = 'created_at',
  sortDirection = 'desc',
  search = '',
  status = '',
  type = '',
}: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  status?: string;
  type?: string;
}) {
  const tenantContext = await getTenantContext();
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context not available');
  }

  const supabase = createServerClient();
  
  // Build query
  let query = supabase.client
    .from('entities')
    .select('*, profiles!created_by(full_name)', { count: 'exact' });
  
  // Apply filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,government_id.ilike.%${search}%`);
  }
  
  if (status) {
    query = query.eq('status', status);
  }
  
  if (type) {
    query = query.eq('type', type);
  }
  
  // Apply pagination and sorting
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, count, error } = await query
    .order(sortBy, { ascending: sortDirection === 'asc' })
    .range(from, to);
  
  if (error) {
    console.error('Error fetching entities:', error);
    throw new Error('Failed to fetch entities');
  }
  
  // Format data for the table
  const formattedData = data?.map((entity: any) => ({
    id: entity.id,
    name: entity.name,
    status: entity.status,
    type: entity.type,
    nationality: entity.nationality_codes ? entity.nationality_codes.join(', ') : '',
    government_id: entity.government_id || '',
    created_at: new Date(entity.created_at).toLocaleString(),
    created_by: entity.profiles?.full_name || '',
  })) || [];
  
  return {
    data: formattedData,
    totalCount: count || 0,
  };
}

export default async function EntitiesPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    status?: string;
    type?: string;
    view?: string;
  };
}) {
  const t = await getTranslations('entities');
  const tenantContext = await getTenantContext();
  
  // Parse search params - using await to fix dynamic API usage
  const page = searchParams?.page ? parseInt(await searchParams.page) : 1;
  const pageSize = searchParams?.pageSize ? parseInt(await searchParams.pageSize) : 10;
  const sortBy = (await searchParams?.sortBy) || 'created_at';
  const sortDirection = (await searchParams?.sortDirection) || 'desc';
  const search = (await searchParams?.search) || '';
  const status = (await searchParams?.status) || '';
  const type = (await searchParams?.type) || '';
  const viewEntityId = await searchParams?.view;
  
  // Get entity status and type options for filters
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          return cookieStore.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll: (cookies: { name: string; value: string; options?: any }[]) => {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );
  const { data: statusOptions } = await supabase
    .from('list_values')
    .select('key, label')
    .eq('list_id', 'entity_status_list')
    .eq('status', 'ACTIVE')
    .order('order');
  
  const { data: typeOptions } = await supabase
    .from('list_values')
    .select('key, label')
    .eq('list_id', 'entity_type_list')
    .eq('status', 'ACTIVE')
    .order('order');
  
  // Fetch entities data
  const entitiesPromise = EntitiesData({
    page,
    pageSize,
    sortBy,
    sortDirection: sortDirection as 'asc' | 'desc',
    search,
    status,
    type,
  });
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('description')}</p>
      </div>
      
      <Suspense fallback={<div className="text-center py-10">Loading entities...</div>}>
        <EntitiesClient
          entitiesPromise={entitiesPromise}
          statusOptions={statusOptions || []}
          typeOptions={typeOptions || []}
          initialParams={{
            page,
            pageSize,
            sortBy,
            sortDirection: sortDirection as 'asc' | 'desc',
            search,
            status,
            type,
          }}
          viewEntityId={viewEntityId}
        />
      </Suspense>
    </div>
  );
}