import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Message } from '../api/client';
import {
  Search,
  Loader,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

function MessageHistory() {
  const [accountId, setAccountId] = useState<number>(0);
  const [leadId, setLeadId] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['messageHistory', accountId, leadId, page],
    queryFn: () => api.getMessageHistory({
      account_id: accountId,
      lead_id: leadId,
      limit: 20,
      page
    }).then(res => res.data),
    enabled: hasSearched && accountId > 0 && leadId > 0
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountId > 0 && leadId > 0) {
      setPage(1);
      setHasSearched(true);
      refetch();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          История сообщений
        </h2>

        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="number"
              value={accountId || ''}
              onChange={(e) => setAccountId(parseInt(e.target.value) || 0)}
              placeholder="Account ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex-1">
            <input
              type="number"
              value={leadId || ''}
              onChange={(e) => setLeadId(parseInt(e.target.value) || 0)}
              placeholder="Lead ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Results */}
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
          {/* Messages Table */}
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
          <div className="bg-white rounded-lg shadow p-4 mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Показано {data.messages.length} из {data.total} сообщений
              <span className="ml-2 text-gray-400">
                (Страница {data.page} из {data.total_pages})
              </span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>

              <button
                onClick={() => setPage(p => p + 1)}
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

function MessageRow({ message }: { message: Message }) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-gray-600 bg-gray-100', label: 'Ожидание' },
    queued: { icon: Clock, color: 'text-blue-600 bg-blue-100', label: 'В очереди' },
    processing: { icon: Loader, color: 'text-purple-600 bg-purple-100', label: 'Обработка' },
    sent: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Отправлено' },
    failed: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Ошибка' }
  };

  const status = statusConfig[message.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        #{message.id}
      </td>

      <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
        <div className="truncate" title={message.message_text}>
          {message.message_text}
        </div>
        {message.error_message && (
          <div className="text-xs text-red-600 mt-1 truncate" title={message.error_message}>
            ⚠️ {message.error_message}
          </div>
        )}
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
          <StatusIcon className="w-3 h-3" />
          <span>{status.label}</span>
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        <div>{format(new Date(message.created_at), 'dd.MM.yyyy')}</div>
        <div className="text-xs text-gray-400">
          {format(new Date(message.created_at), 'HH:mm:ss')}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {message.processing_time ? (
          <span>{(message.processing_time / 1000).toFixed(2)}s</span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}

export default MessageHistory;