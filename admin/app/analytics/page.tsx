'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  Loader,
  Download,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Загрузка аналитики
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => api.getAnalytics(period),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Аналитика</h1>
          <p className="text-gray-600 mt-2">
            Статистика и метрики работы системы
          </p>
        </div>

        {/* Переключатель периода */}
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-4 py-2 rounded-lg transition ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {p === '7d' ? '7 дней' : p === '30d' ? '30 дней' : '90 дней'}
            </button>
          ))}
        </div>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Всего сообщений"
          value={data?.total_messages || 0}
          icon={Activity}
          color="blue"
          change="+12%"
        />
        <StatCard
          title="Success Rate"
          value={`${data?.success_rate || 0}%`}
          icon={TrendingUp}
          color="green"
          change="+2.1%"
        />
        <StatCard
          title="Среднее время"
          value={`${data?.avg_time || 0}s`}
          icon={BarChart3}
          color="yellow"
          change="-0.5s"
        />
        <StatCard
          title="Активных лидов"
          value={data?.active_leads || 0}
          icon={Users}
          color="purple"
          change="+45"
        />
      </div>

      {/* Графики - заглушка */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Динамика сообщений</h3>
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded">
            График будет здесь<br />(используйте recharts)
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Success Rate</h3>
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded">
            График будет здесь<br />(используйте recharts)
          </div>
        </div>
      </div>

      {/* Кнопка экспорта */}
      <div className="flex justify-end">
        <button className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Download className="w-4 h-4" />
          <span>Экспортировать данные</span>
        </button>
      </div>
    </div>
  );
}

// Компонент карточки метрики
function StatCard({ title, value, icon: Icon, color, change }: any) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <div className="flex items-baseline space-x-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {change && (
          <span className="text-sm text-green-600 font-medium">
            {change}
          </span>
        )}
      </div>
    </div>
  );
}