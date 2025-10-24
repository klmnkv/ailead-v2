import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Link from 'next/link';
import { Building2, Activity } from 'lucide-react';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Admin Company - Management Panel',
  description: 'Панель управления интеграциями клиентов',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <Link
                    href="/"
                    className="flex items-center space-x-3 hover:opacity-80 transition group"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition"></div>
                      <Building2 className="relative w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Admin Company
                      </h1>
                      <p className="text-xs text-gray-500 font-medium">Management Panel</p>
                    </div>
                  </Link>
                </div>
              </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <p className="text-center text-gray-500 text-sm">
                  Admin Company - Управление интеграциями клиентов
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
