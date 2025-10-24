'use client';

import { useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ArrowLeft, Bot, History, AlertTriangle, Loader, Save } from 'lucide-react';
import Link from 'next/link';

export default function IntegrationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<'bot' | 'messages' | 'errors'>('bot');

  const { data, isLoading } = useQuery({
    queryKey: ['integration-details', id],
    queryFn: () => api.companyAdmin.getIntegrationDetails(parseInt(id)),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">Интеграция не найдена</div>
      </div>
    );
  }

  const { integration, stats } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/company-admin"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{integration.domain}</h1>
        <p className="text-gray-600">Account ID: {integration.amocrm_account_id}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Всего сообщений" value={stats.total_messages} />
        <StatsCard label="Завершено" value={stats.completed} color="green" />
        <StatsCard label="Ошибки" value={stats.failed} color="red" />
        <StatsCard label="В очереди" value={stats.pending} color="blue" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <TabButton
              active={activeTab === 'bot'}
              onClick={() => setActiveTab('bot')}
              icon={Bot}
              label="Настройки GPT"
            />
            <TabButton
              active={activeTab === 'messages'}
              onClick={() => setActiveTab('messages')}
              icon={History}
              label="История сообщений"
            />
            <TabButton
              active={activeTab === 'errors'}
              onClick={() => setActiveTab('errors')}
              icon={AlertTriangle}
              label="Ошибки"
              badge={stats.failed}
            />
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'bot' && <BotConfigTab integrationId={parseInt(id)} />}
          {activeTab === 'messages' && <MessagesTab integrationId={parseInt(id)} />}
          {activeTab === 'errors' && <ErrorsTab integrationId={parseInt(id)} />}
        </div>
      </div>
    </div>
  );
}

// Вкладка настроек бота/GPT
function BotConfigTab({ integrationId }: { integrationId: number }) {
  const [config, setConfig] = useState({
    bot_enabled: true,
    gpt_model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 500,
    system_prompt: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['bot-config', integrationId],
    queryFn: () => api.companyAdmin.getBotConfig(integrationId),
    onSuccess: (data) => setConfig(data as any),
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.companyAdmin.updateBotConfig(integrationId, config);
      alert('Настройки сохранены');
    } catch (error) {
      alert('Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8"><Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <input
            type="checkbox"
            checked={config.bot_enabled}
            onChange={(e) => setConfig({ ...config, bot_enabled: e.target.checked })}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          Включить бота для этой интеграции
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Модель GPT</label>
        <select
          value={config.gpt_model}
          onChange={(e) => setConfig({ ...config, gpt_model: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature (0-1)
          </label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={config.temperature}
            onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Tokens</label>
          <input
            type="number"
            value={config.max_tokens}
            onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
        <textarea
          rows={8}
          value={config.system_prompt}
          onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
          placeholder="Введите промпт для GPT..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
      </button>
    </div>
  );
}

// Вкладка истории сообщений
function MessagesTab({ integrationId }: { integrationId: number }) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['integration-messages', integrationId, page, statusFilter],
    queryFn: () => api.companyAdmin.getIntegrationMessages(
      integrationId,
      page,
      20,
      statusFilter !== 'all' ? statusFilter : undefined
    ),
  });

  if (isLoading) {
    return <div className="text-center py-8"><Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></div>;
  }

  const messages = data?.messages || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Все статусы</option>
          <option value="completed">Завершено</option>
          <option value="failed">Ошибка</option>
          <option value="pending">В очереди</option>
        </select>

        <div className="text-sm text-gray-600">
          Всего: {pagination?.total || 0} сообщений
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Сообщения не найдены</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сообщение</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {messages.map((msg: any) => (
                <tr key={msg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{msg.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{msg.lead_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate">{msg.message_text}</td>
                  <td className="px-6 py-4"><MessageStatus status={msg.status} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(msg.created_at).toLocaleString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Назад
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Страница {page} из {pagination.total_pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
            disabled={page === pagination.total_pages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
}

// Вкладка ошибок
function ErrorsTab({ integrationId }: { integrationId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['integration-errors', integrationId],
    queryFn: () => api.companyAdmin.getIntegrationErrors(integrationId),
  });

  if (isLoading) {
    return <div className="text-center py-8"><Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></div>;
  }

  const errors = data?.errors || [];

  if (errors.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <p className="text-green-700 font-medium">Отлично! Ошибок нет</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errors.map((error: any) => (
        <div key={error.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-sm font-medium text-red-900">Сообщение #{error.id}</span>
              <span className="text-sm text-red-700 ml-3">Lead ID: {error.lead_id}</span>
            </div>
            <span className="text-xs text-red-600">
              {new Date(error.created_at).toLocaleString('ru-RU')}
            </span>
          </div>
          <p className="text-sm text-red-900 font-mono bg-red-100 p-2 rounded">
            {error.error_message || 'Нет описания ошибки'}
          </p>
          <p className="text-sm text-red-700 mt-2 line-clamp-2">
            Текст: {error.message_text}
          </p>
        </div>
      ))}
    </div>
  );
}

// Компоненты UI
function TabButton({ active, onClick, icon: Icon, label, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
        active
          ? 'border-purple-600 text-purple-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatsCard({ label, value, color = 'gray' }: any) {
  const colors: Record<string, string> = {
    gray: 'text-gray-900',
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}

function MessageStatus({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    completed: { label: 'Завершено', className: 'bg-green-100 text-green-800' },
    failed: { label: 'Ошибка', className: 'bg-red-100 text-red-800' },
    pending: { label: 'В очереди', className: 'bg-yellow-100 text-yellow-800' },
    active: { label: 'В работе', className: 'bg-blue-100 text-blue-800' },
  };

  const { label, className } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
