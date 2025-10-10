'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api-client';  // Относительный путь
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  TrendingUp,
  Activity,
  Users,
  Zap
} from 'lucide-react';
import { formatNumber } from '../lib/utils';  // Относительный путь

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['queueStats'],
    queryFn: api.getQueueStats,
    refetchInterval: 5000,
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Обзор системы и статистика в реальном времени
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="В очереди"
          value={stats?.waiting || 0}
          icon={Clock}
          color="blue"
          description="Ожидают обработки"
        />

        <StatCard
          title="В работе"
          value={stats?.active || 0}
          icon={Activity}
          color="yellow"
          description="Обрабатываются сейчас"
        />

        <StatCard
          title="Выполнено"
          value={stats?.completed || 0}
          icon={CheckCircle}
          color="green"
          description="Успешно завершено"
        />

        <StatCard
          title="Ошибки"
          value={stats?.failed || 0}
          icon={XCircle}
          color="red"
          description="Не удалось выполнить"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Zap className="w-6 h-6 text-blue-600" />
          <span>Производительность</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col">
            <span className="text-sm text-gray-600 mb-2">Среднее время</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">
                {stats?.performance?.avg_processing_time || 0}
              </span>
              <span className="text-gray-500">сек</span>
            </div>
            <div className="mt-2 flex items-center space-x-1 text-green-600 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>На обработку задачи</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-gray-600 mb-2">Скорость</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">
                {stats?.performance?.jobs_per_minute.toFixed(1) || 0}
              </span>
              <span className="text-gray-500">задач/мин</span>
            </div>
            <div className="mt-2 flex items-center space-x-1 text-blue-600 text-sm">
              <Users className="w-4 h-4" />
              <span>Обработано за минуту</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-gray-600 mb-2">Success Rate</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">
                {stats?.performance?.success_rate.toFixed(1) || 0}
              </span>
              <span className="text-gray-500">%</span>
            </div>
            <div className="mt-2 flex items-center space-x-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Успешных задач</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          ℹ️ Информация о системе
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li>• Статистика обновляется автоматически каждые 5 секунд</li>
          <li>• Worker обрабатывает до 5 задач одновременно</li>
          <li>• Задачи выполняются в порядке приоритета</li>
          <li>• При ошибках происходит автоматический retry</li>
        </ul>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'yellow' | 'green' | 'red';
  description: string;
}

function StatCard({ title, value, icon: Icon, color, description }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{formatNumber(value)}</p>
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      </div>
    </div>
  );
}