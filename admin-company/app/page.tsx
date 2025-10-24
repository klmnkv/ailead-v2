'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import Link from 'next/link';
import {
  Building2,
  Activity,
  AlertCircle,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader,
  TrendingUp,
  Server,
} from 'lucide-react';

interface Integration {
  id: number;
  account_id: number;
  amocrm_account_id: number;
  domain: string;
  base_url: string;
  status: string;
  created_at: string;
  updated_at: string;
  email: string;
  company_name: string;
  subscription_plan: string;
  messages_last_7_days: number;
  errors_last_24h: number;
  avg_response_time: number;
  unique_leads_30d: number;
}

export default function AdminCompanyPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-integrations'],
    queryFn: api.getIntegrations,
    refetchInterval: 30000,
  });

  const { data: overviewData } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: api.getAdminOverview,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Ошибка загрузки данных
          </h2>
          <p className="text-gray-600 mb-4">{(error as Error).message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const integrations: Integration[] = data?.data || [];
  const overview = overviewData?.data || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Управление интеграциями
        </h1>
        <p className="text-gray-600 mt-2">
          Мониторинг и управление интеграциями клиентов
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Всего интеграций"
          value={overview.total_integrations || 0}
          icon={Server}
          color="blue"
          subtitle={`${overview.active_integrations || 0} активных`}
        />
        <StatCard
          title="Клиентов"
          value={overview.total_accounts || 0}
          icon={Building2}
          color="purple"
        />
        <StatCard
          title="Сообщений за 24ч"
          value={overview.messages_24h || 0}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Ошибок за 24ч"
          value={overview.errors_24h || 0}
          icon={AlertCircle}
          color={overview.errors_24h > 0 ? 'red' : 'gray'}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Список интеграций ({integrations.length})
          </h2>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Обновить
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Компания
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Домен amoCRM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сообщения (7д)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ошибки (24ч)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Время ответа
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Лиды (30д)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {integrations.map((integration) => (
                  <tr
                    key={integration.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {integration.company_name || integration.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {integration.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {integration.domain}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {integration.amocrm_account_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={integration.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {integration.messages_last_7_days || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${
                          integration.errors_last_24h > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {integration.errors_last_24h || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        {integration.avg_response_time
                          ? `${Math.round(integration.avg_response_time / 1000)}s`
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="w-4 h-4 mr-1 text-gray-400" />
                        {integration.unique_leads_30d || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/${integration.id}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-900"
                      >
                        Подробнее
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {integrations.length === 0 && (
            <div className="text-center py-12">
              <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Нет интеграций
              </h3>
              <p className="text-gray-600">
                Пока не создано ни одной интеграции
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  subtitle?: string;
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    active: {
      label: 'Активна',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
    },
    inactive: {
      label: 'Неактивна',
      icon: XCircle,
      color: 'bg-gray-100 text-gray-800',
    },
    error: {
      label: 'Ошибка',
      icon: AlertCircle,
      color: 'bg-red-100 text-red-800',
    },
  };

  const config = statusConfig[status] || statusConfig.inactive;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="w-4 h-4 mr-1" />
      {config.label}
    </span>
  );
}
