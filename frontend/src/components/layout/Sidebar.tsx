import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Send,
  ListChecks,
  Link2,
  BarChart3,
  Settings
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/send', icon: Send, label: 'Send Message' },
  { path: '/queue', icon: ListChecks, label: 'Queue Monitor' },
  { path: '/integrations', icon: Link2, label: 'Integrations' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-400">AI.LEAD v2</h1>
        <p className="text-gray-400 text-sm">Admin Dashboard</p>
      </div>

      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};