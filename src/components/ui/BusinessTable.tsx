'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Column = {
  id: string;
  label: string;
  sortable?: boolean;
  visible?: boolean;
  renderCell?: (row: any) => React.ReactNode;
};

type BusinessTableProps = {
  data: any[];
  columns: Column[];
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  onSearch: (query: string) => void;
  onFilterChange: (filters: Record<string, string>) => void;
  onExport: () => void;
  onRowClick?: (row: any) => void;
  loading?: boolean;
  baseUrl?: string;
  createNewPath?: string;
  filterOptions?: Record<string, { label: string; options: { value: string; label: string }[] }>;
  resourceName?: string;
};

export default function BusinessTable({
  data,
  columns: initialColumns,
  totalCount,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSearch,
  onFilterChange,
  onExport,
  onRowClick,
  loading = false,
  baseUrl = '',
  createNewPath,
  filterOptions = {},
  resourceName = 'data',
}: BusinessTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parse URL params
  const currentPage = Number(searchParams.get('page') || '1');
  const currentPageSize = Number(searchParams.get('pageSize') || '10');
  const currentSortBy = searchParams.get('sortBy') || '';
  const currentSortDirection = (searchParams.get('sortDirection') || 'asc') as 'asc' | 'desc';
  const currentSearchQuery = searchParams.get('search') || '';
  
  // State for columns visibility
  const [columns, setColumns] = useState(initialColumns.map(col => ({
    ...col,
    visible: col.visible !== false
  })));
  
  // State for filters
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState(currentSearchQuery);
  
  // Initialize filters from URL
  useEffect(() => {
    const newFilters: Record<string, string> = {};
    Object.keys(filterOptions).forEach(key => {
      const value = searchParams.get(key);
      if (value) {
        newFilters[key] = value;
      }
    });
    setFilters(newFilters);
  }, [searchParams, filterOptions]);

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
    
    // Keep existing filters in URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !params.hasOwnProperty(key)) {
        url.searchParams.set(key, value);
      }
    });
    
    router.push(url.pathname + url.search);
  };

  // Handlers
  const handlePageChange = (page: number) => {
    updateUrl({ page });
    onPageChange(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = Number(e.target.value);
    updateUrl({ pageSize: size, page: 1 });
    onPageSizeChange(size);
  };

  const handleSortChange = (columnId: string) => {
    const sortable = columns.find(col => col.id === columnId)?.sortable;
    if (!sortable) return;
    
    const direction = 
      currentSortBy === columnId && currentSortDirection === 'asc' ? 'desc' : 'asc';
    
    updateUrl({ sortBy: columnId, sortDirection: direction });
    onSortChange(columnId, direction);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ search: searchQuery || null, page: 1 });
    onSearch(searchQuery);
  };

  const handleFilterChange = (filterName: string, value: string) => {
    const newFilters = { ...filters, [filterName]: value };
    if (!value) {
      delete newFilters[filterName];
    }
    
    setFilters(newFilters);
    updateUrl({ [filterName]: value || null, page: 1 });
    onFilterChange(newFilters);
  };

  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible } : col
    ));
  };

  const handleExport = () => {
    // Build export URL with current search parameters
    const url = new URL(window.location.href);
    const exportUrl = `/api/${resourceName}/export?${url.searchParams.toString()}`;
    
    // Open in new tab/window or trigger download
    window.open(exportUrl, '_blank');
    
    // Also call the provided export handler
    onExport();
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / currentPageSize);
  const startItem = (currentPage - 1) * currentPageSize + 1;
  const endItem = Math.min(startItem + currentPageSize - 1, totalCount);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex">
            <input
              type="text"
              placeholder="Search name or ID..."
              className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(filterOptions).map(([filterName, { label, options }]) => (
              <select
                key={filterName}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters[filterName] || ''}
                onChange={(e) => handleFilterChange(filterName, e.target.value)}
              >
                <option value="">{label}</option>
                {options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          {/* Column Visibility */}
          <div className="relative group">
            <button
              type="button"
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Columns
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
              <div className="p-2">
                {initialColumns.map(column => (
                  <div key={column.id} className="flex items-center p-2">
                    <input
                      type="checkbox"
                      id={`col-${column.id}`}
                      checked={columns.find(col => col.id === column.id)?.visible}
                      onChange={(e) => handleColumnVisibilityChange(column.id, e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`col-${column.id}`}>{column.label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Export CSV
          </button>

          {/* Create New Button */}
          {createNewPath && (
            <Link
              href={createNewPath}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create New
            </Link>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns
                .filter(column => column.visible)
                .map(column => (
                  <th
                    key={column.id}
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    onClick={() => column.sortable && handleSortChange(column.id)}
                  >
                    <div className="flex items-center">
                      {column.label}
                      {column.sortable && currentSortBy === column.id && (
                        <span className="ml-1">
                          {currentSortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.filter(col => col.visible).length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.filter(col => col.visible).length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No results found
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns
                    .filter(column => column.visible)
                    .map(column => (
                      <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {column.renderCell ? column.renderCell(row) : row[column.id]}
                      </td>
                    ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalCount}</span> results
            </p>
          </div>
          <div className="flex items-center">
            <select
              value={currentPageSize}
              onChange={handlePageSizeChange}
              className="mr-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">First</span>
                «
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                ‹
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                ›
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Last</span>
                »
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}