export const metadata = {
  title: 'VoiceLead AI - Company Admin',
  description: 'Управление всеми интеграциями',
};

export default function CompanyAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                VoiceLead AI
              </h1>
              <p className="text-sm text-gray-600">Company Admin Panel</p>
            </div>
          </div>
        </div>
      </header>
      <main className="pb-8">{children}</main>
    </div>
  );
}
