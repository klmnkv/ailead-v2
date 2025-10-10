'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  MessageSquare,
  CheckCircle,
  Loader,
  Zap,
  Users,
} from 'lucide-react';

interface DailyStats {
  processed_leads: number;
  processed_leads_change: number;
  messages_sent: number;
  messages_sent_change: number;
  successful_dialogs: number;
  successful_dialogs_change: number;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dailyStats'],
    queryFn: api.getDailyStats,
    refetchInterval: 30000, // Обновление каждые 30 секунд
  });

  const { data: queueStats } = useQuery({
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
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Обзор системы и статистика в реальном времени
        </p>
      </div>

      {/* 📊 Статистика за сегодня */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Activity className="w-6 h-6 text-blue-600" />
          <span>Статистика за сегодня</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TrendCard
            title="ОБРАБОТАНО ЛИДОВ"
            value={stats?.processed_leads || 0}
            change={stats?.processed_leads_change || 0}
            changeLabel="от вчера"
            icon={Users}
            color="blue"
          />

          <TrendCard
            title="ОТПРАВЛЕНО СООБЩЕНИЙ"
            value={stats?.messages_sent || 0}
            change={stats?.messages_sent_change || 0}
            icon={MessageSquare}
            color="purple"
          />

          <TrendCard
            title="УСПЕШНЫХ ДИАЛОГОВ"
            value={stats?.successful_dialogs || 0}
            change={stats?.successful_dialogs_change || 0}
            icon={CheckCircle}
            color="green"
          />
        </div>
      </div>

      {/* Статистика очередей */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Zap className="w-6 h-6 text-blue-600" />
          <span>Очереди задач</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="В очереди"
            value={queueStats?.waiting || 0}
            icon={Activity}
            color="blue"
          />
          <StatCard
            title="В работе"
            value={queueStats?.active || 0}
            icon={Loader}
            color="yellow"
          />
          <StatCard
            title="Выполнено"
            value={queueStats?.completed || 0}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Ошибки"
            value={queueStats?.failed || 0}
            icon={Activity}
            color="red"
          />
        </div>
      </div>

      {/* Производительность */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Zap className="w-6 h-6 text-blue-600" />
          <span>Производительность</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PerformanceMetric
            label="Среднее время"
            value={`${queueStats?.performance?.avg_processing_time || 0} сек`}
            subtitle="На обработку задачи"
          />
          <PerformanceMetric
            label="Скорость"
            value={`${queueStats?.performance?.jobs_per_minute?.toFixed(1) || 0} задач/мин`}
            subtitle="Обработано за минуту"
          />
          <PerformanceMetric
            label="Success Rate"
            value={`${queueStats?.performance?.success_rate?.toFixed(1) || 0}%`}
            subtitle="Успешных операций"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// КОМПОНЕНТЫ
// ============================================

function TrendCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  change: number;
  changeLabel?: string;
  icon: any;
  color: 'blue' | 'purple' | 'green' | 'red';
}) {
  const isPositive = change >= 0;
  const colorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    red: 'text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </span>
        <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
      </div>

      <div className="space-y-2">
        <div className={`text-4xl font-bold ${colorClasses[color]}`}>
          {value}
        </div>

        {change !== 0 && (
          <div
            className={`flex items-center space-x-1 text-sm font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {change}%
            </span>
            {changeLabel && (
              <span className="text-gray-500 font-normal">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
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
    </div>
  );
}

function PerformanceMetric({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-600 mb-2">{label}</span>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
      <div className="mt-2 text-sm text-gray-500">{subtitle}</div>
    </div>
  );
}