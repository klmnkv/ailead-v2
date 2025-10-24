'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Search, AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function CompanyAdminPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['company-admin-integrations', search, statusFilter],
    queryFn: () => api.companyAdmin.getAllIntegrations({
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    refetchInterval: 30000,
  });

  const integrations = data?.integrations || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Все интеграции</h1>
        <p className="text-gray-600 mt-2">Управление подключениями клиентов к amoCRM</p>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Поиск */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по домену..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Фильтр по статусу */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="error">С ошибками</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Найдено интеграций: <span className="font-semibold">{integrations.length}</span>
        </div>
      </div>

      {/* Список интеграций */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      )}

      {!isLoading && integrations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Интеграции не найдены</p>
          <p className="text-gray-400 text-sm mt-2">Попробуйте изменить фильтры поиска</p>
        </div>
      )}

      {!isLoading && integrations.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {integration.domain}
                    </h3>
                    <StatusBadge status={integration.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <InfoBlock
                      label="Account ID"
                      value={integration.amocrm_account_id.toString()}
                    />
                    <InfoBlock
                      label="Компания"
                      value={integration.account?.company_name || 'Не указано'}
                    />
                    <InfoBlock
                      label="Email"
                      value={integration.account?.email || 'Не указано'}
                    />
                    <InfoBlock
                      label="Дата подключения"
                      value={new Date(integration.created_at).toLocaleDateString('ru-RU')}
                    />
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Сообщений:</span>
                      <span className="font-semibold text-gray-900">
                        {integration.message_count}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Ошибок:</span>
                      <span className={`font-semibold ${integration.error_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {integration.error_count}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <Link
                    href={`/company-admin/${integration.id}`}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium text-center"
                  >
                    Управление
                  </Link>
                  <a
                    href={integration.base_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    amoCRM
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; icon: any; className: string }> = {
    active: {
      label: 'Активен',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800',
    },
    error: {
      label: 'Ошибка',
      icon: AlertCircle,
      className: 'bg-red-100 text-red-800',
    },
    inactive: {
      label: 'Неактивен',
      icon: Clock,
      className: 'bg-gray-100 text-gray-800',
    },
  };

  const { label, icon: Icon, className } = config[status] || config.inactive;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </span>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-1">{value}</p>
    </div>
  );
}
