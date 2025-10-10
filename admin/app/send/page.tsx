'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, type SendMessageRequest } from '../../lib/api-client';  // Исправлено
import { Send, Loader, CheckCircle, AlertCircle } from 'lucide-react';

export default function SendMessagePage() {
  const [formData, setFormData] = useState<SendMessageRequest>({
    account_id: 0,
    lead_id: 0,
    message_text: '',
    note_text: '',
    task_text: '',
    priority: 'normal',
  });

  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const sendMutation = useMutation({
    mutationFn: api.sendMessage,
    onSuccess: (data) => {
      setResult({
        type: 'success',
        message: `✅ Сообщение добавлено в очередь! Job ID: ${data.job_id}. Позиция: ${data.position_in_queue || 'N/A'}`,
      });

      setFormData({
        account_id: 0,
        lead_id: 0,
        message_text: '',
        note_text: '',
        task_text: '',
        priority: 'normal',
      });
    },
    onError: (error: any) => {
      setResult({
        type: 'error',
        message: `❌ Ошибка: ${error.response?.data?.message || error.message}`,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    sendMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'account_id' || name === 'lead_id' ? Number(value) : value,
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Отправить сообщение</h1>
        <p className="text-gray-600 mt-2">
          Добавьте новую задачу на отправку сообщения в amoCRM
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account ID *
            </label>
            <input
              type="number"
              name="account_id"
              value={formData.account_id || ''}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите Account ID из amoCRM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead ID *
            </label>
            <input
              type="number"
              name="lead_id"
              value={formData.lead_id || ''}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите Lead ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст сообщения *
            </label>
            <textarea
              name="message_text"
              value={formData.message_text}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Введите текст сообщения для отправки лиду..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Примечание (опционально)
            </label>
            <input
              type="text"
              name="note_text"
              value={formData.note_text}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Текст примечания к лиду..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Задача (опционально)
            </label>
            <input
              type="text"
              name="task_text"
              value={formData.task_text}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Текст задачи..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Приоритет
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Низкий</option>
              <option value="normal">Обычный</option>
              <option value="high">Высокий</option>
            </select>
          </div>

          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {result.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    result.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {result.message}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {sendMutation.isPending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Отправка...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Отправить в очередь</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          ℹ️ Информация
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Сообщение будет добавлено в очередь и обработано Worker'ом</li>
          <li>• Вы можете указать приоритет для ускорения обработки</li>
          <li>• Примечание и задача создаются автоматически, если указаны</li>
          <li>• Проверьте Dashboard для отслеживания статуса</li>
        </ul>
      </div>
    </div>
  );
}