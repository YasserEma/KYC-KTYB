'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BusinessTable from '@/components/ui/BusinessTable';
import EntityDetailsDrawer from './EntityDetailsDrawer';
import { createClientWithTenant } from '@/lib/supabase/client';

type EntitiesClientProps = {
  entitiesPromise: Promise<{
    data: any[];
    totalCount: number;
  }>;
  statusOptions: { key: string; label: string }[];
  typeOptions: { key: string; label: string }[];
  initialParams: {
    page: number;
    pageSize: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    search: string;
    status: string;
    type: string;
  };
  viewEntityId?: string;
};

export default function EntitiesClient({
  entitiesPromise,
  statusOptions,
  typeOptions,
  initialParams,
  viewEntityId,
}: EntitiesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entities, setEntities] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(!!viewEntityId);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(viewEntityId || null);
  
  // Initialize data from promise
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, totalCount } = await entitiesPromise;
        setEntities(data);
        setTotalCount(totalCount);
      } catch (error) {
        console.error('Error fetching entities:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [entitiesPromise]);
  
  // Update URL when drawer state changes
  useEffect(() => {
    if (selectedEntity && isDrawerOpen) {
      updateUrl({ view: selectedEntity });
    } else if (!isDrawerOpen && searchParams.get('view')) {
      updateUrl({ view: null });
    }
  }, [selectedEntity, isDrawerOpen, searchParams]);
  
  // Listen for Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);
  
  // Table columns configuration
  const columns = [
    {
      id: 'id',
      label: '#',
      sortable: false,
      renderCell: (row: any) => row.id.substring(0, 8),
    },
    {
      id: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      renderCell: (row: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
          row.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          row.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      sortable: true,
      renderCell: (row: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
          {row.type}
        </span>
      ),
    },
    {
      id: 'nationality',
      label: 'Nationality',
      sortable: false,
    },
    {
      id: 'government_id',
      label: 'Government ID',
      sortable: false,
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
    },
    {
      id: 'created_by',
      label: 'Created By',
      sortable: false,
    },
  ];
  
  // Filter options for the table
  const filterOptions = {
    status: {
      label: 'Status',
      options: statusOptions.map(option => ({
        value: option.key,
        label: option.label,
      })),
    },
    type: {
      label: 'Type',
      options: typeOptions.map(option => ({
        value: option.key,
        label: option.label,
      })),
    },
  };
  
  // Update URL with current state
  const updateUrl = (params: Record<string, string | number | null>) => {
    const url = new URL(window.location.href);
    
    // Update existing params
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
    });
    
    router.push(url.pathname + url.search);
  };
  
  // Table event handlers
  const handlePageChange = (page: number) => {
    updateUrl({ page });
    refreshData();
  };
  
  const handlePageSizeChange = (pageSize: number) => {
    updateUrl({ pageSize, page: 1 });
    refreshData();
  };
  
  const handleSortChange = (sortBy: string, sortDirection: 'asc' | 'desc') => {
    updateUrl({ sortBy, sortDirection });
    refreshData();
  };
  
  const handleSearch = (query: string) => {
    updateUrl({ search: query, page: 1 });
    refreshData();
  };
  
  const handleFilterChange = (filters: Record<string, string>) => {
    // Update all filters at once
    const newParams: Record<string, string | number | null> = { page: 1 };
    Object.entries(filters).forEach(([key, value]) => {
      newParams[key] = value || null;
    });
    
    updateUrl(newParams);
    refreshData();
  };
  
  const handleExport = async () => {
    try {
      // Get current filters from URL
      const currentParams = Object.fromEntries(searchParams.entries());
      
      // Build query string for export
      const queryParams = new URLSearchParams(currentParams);
      
      // Log the export action to audit_logs
      const supabase = await createClientWithTenant();
      await supabase.client.from('audit_logs').insert({
        action: 'EXPORT_ENTITIES',
        details: {
          filters: {
            search: searchParams.get('search') || '',
            status: searchParams.get('status') || '',
            type: searchParams.get('type') || '',
          }
        }
      });
      
      // Trigger download
      window.location.href = `/api/entities/export?${queryParams.toString()}`;
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };
  
  const handleRowClick = (row: any) => {
    setSelectedEntity(row.id);
    setIsDrawerOpen(true);
  };
  
  // Refresh data from server
  const refreshData = async () => {
    setLoading(true);
    
    // Get current params from URL
    const page = Number(searchParams.get('page') || initialParams.page);
    const pageSize = Number(searchParams.get('pageSize') || initialParams.pageSize);
    const sortBy = searchParams.get('sortBy') || initialParams.sortBy;
    const sortDirection = (searchParams.get('sortDirection') || initialParams.sortDirection) as 'asc' | 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    
    // Fetch data from API
    const supabase = await createClientWithTenant();
    
    // Build query
      let query = supabase.client
        .from('entities')
        .select('*, profiles!created_by(full_name)', { count: 'exact' });
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,government_id.ilike.%${search}%`);
    }
    
    if (status) {
      query = query.eq('status', status as "ACTIVE" | "INACTIVE");
    }
    
    if (type) {
      query = query.eq('type', type as "INDIVIDUAL" | "ORGANIZATION");
    }
    
    // Apply pagination and sorting
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Execute query
    const { data, count, error }: { data: any[]; count: number | null; error: any } = await query
      .order(sortBy, { ascending: sortDirection === 'asc' })
      .range(from, to);
      
    if (error) {
      console.error('Error fetching entities:', error);
      setEntities([]);
      setTotalCount(0);
      setLoading(false);
      return;
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
    
    setEntities(formattedData);
    setTotalCount(count || 0);
    setLoading(false);
  };
  
  return (
    <div className="relative">
      <BusinessTable
        data={entities}
        columns={columns}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        onRowClick={handleRowClick}
        loading={loading}
        filterOptions={filterOptions}
        createNewPath="/entities/new"
      />
      
      {isDrawerOpen && selectedEntity && (
        <EntityDetailsDrawer
          entityId={selectedEntity}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
    </div>
  );
}