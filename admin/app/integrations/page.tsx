'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  Bot,
  Settings
} from 'lucide-react';
import { api, Integration } from '@/lib/api-client';

export default function IntegrationsPage() {
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.getIntegrations(),
  });

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'inactive':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusText = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return 'Активна';
      case 'inactive':
        return 'Неактивна';
      case 'error':
        return 'Ошибка';
    }
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'inactive':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Интеграции amoCRM</h1>
          <p className="text-gray-600 mt-2">
            Управление подключенными аккаунтами amoCRM
          </p>
        </div>
      </div>

      {/* Integrations Grid */}
      {integrations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Нет подключенных интеграций
          </h3>
          <p className="text-gray-600 mb-6">
            Подключите ваш аккаунт amoCRM через виджет
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <Link
              key={integration.id}
              href={`/integrations/${integration.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 overflow-hidden group"
            >
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                        {integration.domain}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: {integration.amocrm_account_id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-4 space-y-3">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Статус</span>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(integration.status)}`}>
                    {getStatusIcon(integration.status)}
                    <span className="text-sm font-medium">
                      {getStatusText(integration.status)}
                    </span>
                  </div>
                </div>

                {/* Last Sync */}
                {integration.last_sync_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Последняя синхронизация</span>
                    <span className="text-sm text-gray-900">
                      {new Date(integration.last_sync_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                )}

                {/* Base URL */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">URL</span>
                  <a
                    href={integration.base_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition"
                  >
                    <span>Открыть</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Bot className="w-4 h-4" />
                    <span>Боты</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Settings className="w-4 h-4" />
                    <span>Настройки</span>
                  </div>
                </div>
                <div className="text-purple-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Перейти →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
