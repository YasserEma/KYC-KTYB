import { X, User, Building, MapPin, FileText, Calendar, Shield, Download } from "lucide-react";
import { Entity } from "./page";
import { getStatusBadge, getTypeBadge } from "./database-table";

interface props {
  data: Entity;
  closeDrawer: () => void,
  handelDownload: () => void
}
const Drawer = ({ data, closeDrawer, handelDownload }: props) => {
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity duration-300 overflow-hidden" onClick={closeDrawer} />
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 translate-x-0"><div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Entity Details</h2>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {data.type === 'INDIVIDUAL' ? (
                  <User className="h-8 w-8 text-blue-600" />
                ) : (
                  <Building className="h-8 w-8 text-purple-600" />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{data.legal_name ?? (data.first_name && data.last_name)}</h3>
                  <p className="text-sm text-gray-500">ID: {data.id}</p>
                </div>
              </div>
            </div>

            {/* Status and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <span className={getStatusBadge('ACTIVE')}>active</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <span className={getTypeBadge(data.type)}>{data.type}</span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nationality</label>
                  <p className="text-sm text-gray-900 mt-1">{data.countries?.name ?? data.incorporation_countries?.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Government ID</label>
                  <p className="text-sm text-gray-900 mt-1">{data.reference_id}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(data.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {data.created_by && (
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created By</label>
                    <p className="text-sm text-gray-900 mt-1">{data.created_by}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={handelDownload}
                  className="px-3 py-2 border rounded-lg flex items-center gap-2"
                >
                  <Download size={16} /> Export
                  CSV
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  View History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div></div></>);
}

export default Drawer;