'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  Activity,
  AlertCircle,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader,
  Bot,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const integrationId = parseInt(params.id as string);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['integration-details', integrationId],
    queryFn: () => api.getIntegrationDetails(integrationId),
    refetchInterval: 30000,
  });

  const { data: responseTimesData } = useQuery({
    queryKey: ['integration-response-times', integrationId],
    queryFn: () => api.getIntegrationResponseTimes(integrationId),
    refetchInterval: 60000,
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

  const { integration, scenarios, daily_stats, recent_errors, overall_stats } =
    data?.data || {};

  if (!integration) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Интеграция не найдена
          </h2>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700"
          >
            Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Шапка с кнопкой назад */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {integration.company_name || integration.email}
            </h1>
            <p className="text-gray-600 mt-2">{integration.domain}</p>
          </div>
          <StatusBadge status={integration.status} />
        </div>
      </div>

      {/* Основная информация */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard title="Информация о клиенте">
          <InfoRow label="Email" value={integration.email} />
          <InfoRow label="Компания" value={integration.company_name || 'N/A'} />
          <InfoRow
            label="План подписки"
            value={integration.subscription_plan}
          />
          <InfoRow
            label="Баланс токенов"
            value={integration.token_balance?.toLocaleString() || 'N/A'}
          />
        </InfoCard>

        <InfoCard title="Информация об интеграции">
          <InfoRow label="ID аккаунта amoCRM" value={integration.amocrm_account_id} />
          <InfoRow label="Домен" value={integration.domain} />
          <InfoRow label="Статус" value={integration.status} />
          <InfoRow
            label="Создана"
            value={new Date(integration.created_at).toLocaleDateString('ru-RU')}
          />
        </InfoCard>
      </div>

      {/* Общая статистика */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Общая статистика
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Всего сообщений"
            value={overall_stats?.total_messages || 0}
            icon={MessageSquare}
            color="blue"
          />
          <StatCard
            title="Успешных"
            value={overall_stats?.successful_messages || 0}
            icon={CheckCircle}
            color="green"
            subtitle={`${
              overall_stats?.total_messages > 0
                ? Math.round(
                    (overall_stats.successful_messages /
                      overall_stats.total_messages) *
                      100
                  )
                : 0
            }%`}
          />
          <StatCard
            title="Ошибок"
            value={overall_stats?.failed_messages || 0}
            icon={AlertCircle}
            color="red"
          />
          <StatCard
            title="Уникальных лидов"
            value={overall_stats?.unique_leads || 0}
            icon={Users}
            color="purple"
          />
        </div>
      </div>

      {/* Среднее время обработки */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Время обработки
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TimeCard
            label="Среднее"
            value={overall_stats?.avg_processing_time}
          />
          <TimeCard
            label="Минимальное"
            value={overall_stats?.min_processing_time}
          />
          <TimeCard
            label="Максимальное"
            value={overall_stats?.max_processing_time}
          />
        </div>
      </div>

      {/* Боты (Сценарии) */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Bot className="w-6 h-6 mr-2 text-blue-600" />
          Боты и сценарии ({scenarios?.length || 0})
        </h2>

        {scenarios && scenarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scenario: any) => (
              <ScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Нет настроенных сценариев</p>
          </div>
        )}
      </div>

      {/* График активности по дням */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
          Активность за последние 30 дней
        </h2>

        <div className="bg-white rounded-lg shadow p-6">
          {daily_stats && daily_stats.length > 0 ? (
            <div className="space-y-2">
              {daily_stats.slice(0, 10).map((stat: any) => (
                <DailyStatBar key={stat.date} stat={stat} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              Нет данных за последние 30 дней
            </p>
          )}
        </div>
      </div>

      {/* Последние ошибки */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
          Последние ошибки ({recent_errors?.length || 0})
        </h2>

        {recent_errors && recent_errors.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Дата
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Lead ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ошибка
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recent_errors.slice(0, 10).map((error: any) => (
                    <tr key={error.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(error.created_at).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {error.lead_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600">
                        {error.error_message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Ошибок не обнаружено</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Вспомогательные компоненты
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
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {config.label}
    </span>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
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

function TimeCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-2">
        <Clock className="w-5 h-5 text-blue-600 mr-2" />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">
        {value ? `${Math.round(value / 1000)}s` : 'N/A'}
      </p>
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: any }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{scenario.name}</h4>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            scenario.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {scenario.is_active ? 'Активен' : 'Неактивен'}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">
        {scenario.description || 'Описание отсутствует'}
      </p>
      <div className="flex items-center text-xs text-gray-500">
        <span>Приоритет: {scenario.priority}</span>
        <span className="mx-2">•</span>
        <span>
          Создан: {new Date(scenario.created_at).toLocaleDateString('ru-RU')}
        </span>
      </div>
    </div>
  );
}

function DailyStatBar({ stat }: { stat: any }) {
  const total = stat.total_messages || 0;
  const successful = stat.successful || 0;
  const failed = stat.failed || 0;
  const successRate = total > 0 ? (successful / total) * 100 : 0;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">
          {new Date(stat.date).toLocaleDateString('ru-RU')}
        </span>
        <span className="text-sm text-gray-900">{total} сообщений</span>
      </div>
      <div className="flex h-6 rounded overflow-hidden bg-gray-200">
        {successful > 0 && (
          <div
            className="bg-green-500 flex items-center justify-center text-xs text-white"
            style={{ width: `${successRate}%` }}
          >
            {successful}
          </div>
        )}
        {failed > 0 && (
          <div
            className="bg-red-500 flex items-center justify-center text-xs text-white"
            style={{ width: `${((failed / total) * 100)}%` }}
          >
            {failed}
          </div>
        )}
      </div>
    </div>
  );
}
