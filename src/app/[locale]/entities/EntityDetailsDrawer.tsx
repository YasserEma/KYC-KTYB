'use client';

import { useState, useEffect } from 'react';
import { createClientWithTenant } from '@/lib/supabase/client';

type EntityDetailsDrawerProps = {
  entityId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function EntityDetailsDrawer({
  entityId,
  isOpen,
  onClose,
}: EntityDetailsDrawerProps) {
  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [screeningHistory, setScreeningHistory] = useState<any[]>([]);
  const [riskHistory, setRiskHistory] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingScreening, setLoadingScreening] = useState(false);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Fetch entity details
  useEffect(() => {
    if (!entityId) return;

    const fetchEntity = async () => {
      setLoading(true);
      const supabase = await createClientWithTenant();
      
      const { data, error }: { data: any; error: any } = await supabase.client
        .from('entities')
        .select(`
          *,
          profiles!created_by(full_name)
        `)
        .eq('id', entityId)
        .single();
      
      if (error) {
        console.error('Error fetching entity:', error);
      } else {
        setEntity(data);
      }
      
      setLoading(false);
    };
    
    fetchEntity();
  }, [entityId]);

  // Fetch tab data when tab changes
  useEffect(() => {
    if (!entityId) return;
    
    if (activeTab === 'screening') {
      fetchScreeningHistory();
    } else if (activeTab === 'risk') {
      fetchRiskHistory();
    } else if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab, entityId]);

  const fetchScreeningHistory = async () => {
    setLoadingScreening(true);
    const supabase = await createClientWithTenant();
    
    const { data, error }: { data: any[]; error: any } = await supabase
      .from('screening_runs')
      .select(`
        *,
        profiles!created_by(full_name)
      `)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching screening history:', error);
    } else {
      setScreeningHistory(data || []);
    }
    
    setLoadingScreening(false);
  };

  const fetchRiskHistory = async () => {
    setLoadingRisk(true);
    const supabase = await createClientWithTenant();
    
    const { data, error } = await supabase.client
      .from('risk_runs')
      .select(`
        *,
        risk_decisions(*),
        profiles!created_by(full_name)
      `)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching risk history:', error);
    } else {
      setRiskHistory(data || []);
    }
    
    setLoadingRisk(false);
  };

  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    const supabase = await createClientWithTenant();
    
    const { data, error }: { data: any[]; error: any } = await supabase.client
      .from('documents')
      .select(`
        *,
        profiles!created_by(full_name)
      `)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setDocuments(data || []);
    }
    
    setLoadingDocuments(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        />
        
        {/* Drawer */}
        <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="relative w-screen max-w-2xl">
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              {/* Header */}
              <div className="px-4 py-6 sm:px-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    {loading ? 'Loading...' : entity?.name || 'Entity Details'}
                  </h2>
                  <div className="ml-3 h-7 flex items-center">
                    <button
                      type="button"
                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close panel</span>
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Entity ID */}
                {!loading && entity && (
                  <p className="mt-1 text-sm text-gray-500">
                    ID: {entity.id}
                  </p>
                )}
              </div>
              
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex px-6 space-x-8">
                  <button
                    className={`${
                      activeTab === 'details'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('details')}
                  >
                    Details
                  </button>
                  <button
                    className={`${
                      activeTab === 'screening'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('screening')}
                  >
                    Screening History
                  </button>
                  <button
                    className={`${
                      activeTab === 'risk'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('risk')}
                  >
                    Risk History
                  </button>
                  <button
                    className={`${
                      activeTab === 'documents'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('documents')}
                  >
                    Documents
                  </button>
                </nav>
              </div>
              
              {/* Content */}
              <div className="flex-1 relative overflow-y-auto focus:outline-none p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <>
                    {/* Details Tab */}
                    {activeTab === 'details' && entity && (
                      <div className="space-y-6">
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                          <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Entity Information</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and application.</p>
                          </div>
                          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                            <dl className="sm:divide-y sm:divide-gray-200">
                              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Name</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{entity.name}</dd>
                              </div>
                              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    entity.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                    entity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    entity.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {entity.status}
                                  </span>
                                </dd>
                              </div>
                              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Type</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                                    {entity.type}
                                  </span>
                                </dd>
                              </div>
                              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Government ID</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{entity.government_id || 'N/A'}</dd>
                              </div>
                              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Nationality</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{entity.nationality_codes ? entity.nationality_codes.join(', ') : 'N/A'}</dd>
                              </div>
                              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{new Date(entity.created_at).toLocaleString()}</dd>
                              </div>
                              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{entity.profiles?.full_name || 'N/A'}</dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Screening History Tab */}
                    {activeTab === 'screening' && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Screening History</h3>
                        {loadingScreening ? (
                          <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                          </div>
                        ) : screeningHistory.length > 0 ? (
                          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Matches</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Initiated By</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {screeningHistory.map((run) => (
                                  <tr key={run.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                      {new Date(run.created_at).toLocaleString()}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        run.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                        run.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {run.status}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {run.match_count || 0}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {run.profiles?.full_name || 'System'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No screening history available</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Risk History Tab */}
                    {activeTab === 'risk' && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Risk History</h3>
                        {loadingRisk ? (
                          <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                          </div>
                        ) : riskHistory.length > 0 ? (
                          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Risk Level</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Initiated By</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {riskHistory.map((run) => (
                                  <tr key={run.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                      {new Date(run.created_at).toLocaleString()}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        run.risk_level === 'HIGH' ? 'bg-red-100 text-red-800' :
                                        run.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                        run.risk_level === 'LOW' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {run.risk_level || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        run.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                        run.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {run.status}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {run.profiles?.full_name || 'System'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No risk history available</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Documents Tab */}
                    {activeTab === 'documents' && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
                        {loadingDocuments ? (
                          <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                          </div>
                        ) : documents.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {documents.map((doc) => (
                              <div key={doc.id} className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400">
                                <div className="flex-shrink-0">
                                  <svg className="h-10 w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <a href="#" className="focus:outline-none">
                                    <span className="absolute inset-0" aria-hidden="true" />
                                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{doc.type}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(doc.created_at).toLocaleString()}</p>
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No documents available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}