'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Send,
  History,
  BarChart3,
  Workflow,
  Settings,
  Activity,
  Menu,
  X,
  Bot,
  BookOpen
} from 'lucide-react';
import { useState } from 'react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Боты', href: '/bots', icon: Bot },
  { name: 'База знаний', href: '/knowledge-base', icon: BookOpen },
  { name: 'Отправить', href: '/send', icon: Send },
  { name: 'История', href: '/history', icon: History },
  { name: 'Аналитика', href: '/analytics', icon: BarChart3 },
  { name: 'Сценарии', href: '/scenarios', icon: Workflow },
  { name: 'Настройки', href: '/settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Сохраняем account_id из query параметров для передачи между страницами
  const accountId = searchParams.get('account_id');
  const queryString = accountId ? `?account_id=${accountId}` : '';

  return (
    <>
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link
              href={`/${queryString}`}
              className="flex items-center space-x-3 hover:opacity-80 transition group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition"></div>
                <Activity className="relative w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  AI.LEAD V2
                </h1>
                <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={`${item.href}${queryString}`}
                    className={cn(
                      'relative flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                      isActive
                        ? 'text-purple-600'
                        : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                    )}
                  >
                    {isActive && (
                      <span className="absolute inset-0 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg"></span>
                    )}
                    <Icon className={cn("relative w-4 h-4", isActive && "animate-pulse")} />
                    <span className="relative">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white animate-slideIn">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={`${item.href}${queryString}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition',
                      isActive
                        ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>
    </>
  );
}