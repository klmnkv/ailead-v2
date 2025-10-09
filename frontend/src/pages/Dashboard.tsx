import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queueApi } from '../api/queue';
import { socket } from '../api/client';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data: stats, refetch } = useQuery({
    queryKey: ['queueStats'],
    queryFn: queueApi.getStats,
    refetchInterval: 5000 // Обновление каждые 5 секунд
  });

  useEffect(() => {
    socket.connect();
    socket.emit('subscribe:queue');

    socket.on('queue:stats', () => {
      refetch();
    });

    return () => {
      socket.disconnect();
    };
  }, [refetch]);

  const statCards = [
    {
      title: 'Active Jobs',
      value: stats?.active || 0,
      icon: Activity,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Completed Today',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Failed',
      value: stats?.failed || 0,
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      title: 'Waiting',
      value: stats?.waiting || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Real-time overview of your chatbot system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Performance Metrics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Avg Processing Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats?.performance.avg_processing_time
                ? `${(stats.performance.avg_processing_time / 1000).toFixed(2)}s`
                : 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Jobs per Minute</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats?.performance.jobs_per_minute?.toFixed(1) || '0'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats?.performance.success_rate || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Live Updates */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Live Queue Status
          </h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-700">Queue Status</span>
            <span className={`font-semibold ${
              stats?.paused ? 'text-red-600' : 'text-green-600'
            }`}>
              {stats?.paused ? 'Paused' : 'Running'}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-700">Total Jobs in Queue</span>
            <span className="font-semibold text-gray-900">
              {(stats?.waiting || 0) + (stats?.active || 0) + (stats?.delayed || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};