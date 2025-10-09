import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, QueueStats } from '../api/client';
import { useQueueStats, useTaskEvents } from '../hooks/useWebSocket';
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  TrendingUp,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';

function Dashboard() {
  const [liveStats, setLiveStats] = useState<QueueStats | null>(null);

  // Получаем начальную статистику через REST API
  const { data: initialStats, isLoading } = useQuery({
    queryKey: ['queueStats'],
    queryFn: () => api.getQueueStats().then(res => res.data),
    refetchInterval: 5000 // Fallback если WebSocket не работает
  });

  // WebSocket real-time обновления
  const handleStatsUpdate = useCallback((stats: QueueStats) => {
    setLiveStats(stats);
  }, []);

  const { connected: wsConnected } = useQueueStats(handleStatsUpdate);
  const { lastCreated, lastCompleted, lastFailed } = useTaskEvents();

  // Используем live статистику если доступна, иначе из REST API
  const stats = liveStats || initialStats;

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* WebSocket Status */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Dashboard
        </h2>
        <div className="flex items-center space-x-2">
          {wsConnected ? (
            <>
              <Wifi className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-600 font-medium">
                Real-time подключен
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">
                Polling режим
              </span>
            </>
          )}
        </div>
      </div>

      {/* Queue Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Waiting */}
        <StatCard
          title="В очереди"
          value={stats?.waiting || 0}
          icon={<Clock className="w-8 h-8" />}
          color="blue"
        />

        {/* Active */}
        <StatCard
          title="В обработке"
          value={stats?.active || 0}
          icon={<Activity className="w-8 h-8" />}
          color="purple"
          pulse={stats && stats.active > 0}
        />

        {/* Completed */}
        <StatCard
          title="Завершено"
          value={stats?.completed || 0}
          icon={<CheckCircle className="w-8 h-8" />}
          color="green"
        />

        {/* Failed */}
        <StatCard
          title="Ошибки"
          value={stats?.failed || 0}
          icon={<XCircle className="w-8 h-8" />}
          color="red"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PerformanceCard
          title="Среднее время"
          value={`${Math.round((stats?.performance.avg_processing_time || 0) / 1000)}s`}
          icon={<Clock className="w-6 h-6" />}
        />
        <PerformanceCard
          title="Задач в минуту"
          value={stats?.performance.jobs_per_minute.toFixed(1) || '0.0'}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <PerformanceCard
          title="Success Rate"
          value={`${stats?.performance.success_rate.toFixed(1) || '0.0'}%`}
          icon={<Users className="w-6 h-6" />}
          highlight={stats && stats.performance.success_rate >= 95}
        />
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Последние события
          </h3>
        </div>
        <div className="p-6 space-y-3">
          {lastCreated && (
            <EventItem
              type="created"
              message={`Новая задача #${lastCreated.job_id} создана`}
              timestamp={new Date()}
            />
          )}
          {lastCompleted && (
            <EventItem
              type="completed"
              message={`Задача #${lastCompleted.job_id} завершена`}
              timestamp={new Date()}
            />
          )}
          {lastFailed && (
            <EventItem
              type="failed"
              message={`Задача #${lastFailed.job_id} завершилась ошибкой`}
              timestamp={new Date()}
            />
          )}
          {!lastCreated && !lastCompleted && !lastFailed && (
            <p className="text-gray-500 text-center py-8">
              Ожидание событий...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Компоненты
function StatCard({
  title,
  value,
  icon,
  color,
  pulse
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  pulse?: boolean;
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colors[color as keyof typeof colors]} ${pulse ? 'animate-pulse' : ''}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function PerformanceCard({
  title,
  value,
  icon,
  highlight
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${highlight ? 'ring-2 ring-green-500' : ''}`}>
      <div className="flex items-center space-x-3">
        <div className="text-gray-600">{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EventItem({
  type,
  message,
  timestamp
}: {
  type: 'created' | 'completed' | 'failed';
  message: string;
  timestamp: Date;
}) {
  const colors = {
    created: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type]}`}>
          {type === 'created' ? '📝' : type === 'completed' ? '✅' : '❌'}
        </span>
        <span className="text-sm text-gray-900">{message}</span>
      </div>
      <span className="text-xs text-gray-500">
        {timestamp.toLocaleTimeString()}
      </span>
    </div>
  );
}

export default Dashboard;