'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type Message } from '../../lib/api-client';
import {
  Search,
  Loader,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

export default function HistoryPage() {
  const [accountId, setAccountId] = useState<number>(0);
  const [leadId, setLeadId] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // Загрузка истории
  const { data, isLoading, error } = useQuery({
    queryKey: ['messageHistory', accountId, leadId, page],
    queryFn: () => api.getMessageHistory(accountId, leadId, page, 20),
    enabled: hasSearched && accountId > 0 && leadId > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountId > 0 && leadId > 0) {
      setPage(1);
      setHasSearched(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">История сообщений</h1>
        <p className="text-gray-600 mt-2">
          Просмотр истории отправленных сообщений по Account ID и Lead ID
        </p>
      </div>

      {/* Форма поиска */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account ID
            </label>
            <input
              type="number"
              value={accountId || ''}
              onChange={(e) => setAccountId(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите Account ID"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead ID
            </label>
            <input
              type="number"
              value={leadId || ''}
              onChange={(e) => setLeadId(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите Lead ID"
            />
          </div>

          <button
            type="submit"
            disabled={!accountId || !leadId}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 transition"
          >
            <Search className="w-5 h-5" />
            <span>Поиск</span>
          </button>
        </form>
      </div>

      {/* Результаты */}
      {!hasSearched && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Введите Account ID и Lead ID для поиска истории сообщений
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>Ошибка загрузки: {(error as Error).message}</span>
          </div>
        </div>
      )}

      {data && data.messages.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">
            Сообщений не найдено для указанного Account ID и Lead ID
          </p>
        </div>
      )}

      {data && data.messages.length > 0 && (
        <>
          {/* Таблица сообщений */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сообщение
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Время
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Обработка
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.messages.map((message) => (
                  <MessageRow key={message.id} message={message} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Показано {data.messages.length} из {data.total} сообщений
              <span className="ml-2 text-gray-400">
                (Страница {data.page} из {data.total_pages})
              </span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.total_pages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <span>Вперёд</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// КОМПОНЕНТ СТРОКИ СООБЩЕНИЯ
// ============================================

function MessageRow({ message }: { message: Message }) {
  const statusConfig = {
    completed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      label: 'Выполнено',
    },
    failed: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      label: 'Ошибка',
    },
    waiting: {
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      label: 'В очереди',
    },
    active: {
      icon: Loader,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      label: 'В работе',
    },
  };

  const status =
    statusConfig[message.status as keyof typeof statusConfig] ||
    statusConfig.waiting;
  const StatusIcon = status.icon;

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        #{message.id}
      </td>

      <td className="px-6 py-4 text-sm text-gray-900">
        <div className="max-w-md">
          <p className="line-clamp-2">{message.message_text}</p>
          {message.note_text && (
            <p className="text-xs text-gray-500 mt-1">
              Примечание: {message.note_text}
            </p>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={cn(
            'inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium',
            status.bg,
            status.color
          )}
        >
          <StatusIcon className="w-3 h-3" />
          <span>{status.label}</span>
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        <div className="flex flex-col">
          <span>{formatDate(message.created_at)}</span>
          {message.completed_at && (
            <span className="text-xs text-gray-400">
              Завершено: {formatDate(message.completed_at)}
            </span>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {message.processing_time ? (
          <span>{message.processing_time.toFixed(2)}s</span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}
