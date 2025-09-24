export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Super Admin Header */}
      <header className="bg-red-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">
                Super Admin Console
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-red-100 text-sm">
                Platform Administration
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-red-700 border-b border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <a
              href="/super-admin"
              className="text-red-100 hover:text-white px-3 py-2 text-sm font-medium"
            >
              Dashboard
            </a>
            <a
              href="/super-admin/tenants"
                  className="text-red-100 hover:text-white px-3 py-2 text-sm font-medium"
                >
                  Tenants
                </a>
                <a
                  href="/super-admin/users"
                  className="text-red-100 hover:text-white px-3 py-2 text-sm font-medium"
                >
                  Users
                </a>
                <a
                  href="/super-admin/system"
                  className="text-red-100 hover:text-white px-3 py-2 text-sm font-medium"
                >
                  System
                </a>
              </div>
            </div>
          </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}