'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, type SendMessageRequest } from '../../lib/api-client';
import { Send, Loader, CheckCircle, AlertCircle, Info } from 'lucide-react';

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
        message: `✅ Сообщение добавлено в очередь! Job ID: ${data.job_id}`,
      });

      // Очищаем форму, но оставляем Account ID и Lead ID
      setFormData({
        account_id: formData.account_id,
        lead_id: formData.lead_id,
        message_text: '',
        note_text: '',
        task_text: '',
        priority: 'normal',
      });

      // Скрываем сообщение через 5 секунд
      setTimeout(() => setResult(null), 5000);
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

    // Валидация
    if (!formData.account_id || !formData.lead_id || !formData.message_text) {
      setResult({
        type: 'error',
        message: '⚠️ Заполните обязательные поля: Account ID, Lead ID и текст сообщения',
      });
      return;
    }

    setResult(null);
    sendMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'account_id' || name === 'lead_id'
        ? parseInt(value) || 0
        : value,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Отправить сообщение</h1>
        <p className="text-gray-600 mt-2">
          Добавьте новую задачу на отправку сообщения в amoCRM
        </p>
      </div>

      {/* Форма */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Параметры сообщения
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Account ID & Lead ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account ID <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="account_id"
                value={formData.account_id || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите Account ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lead ID <span className="text-red-500">*</span>
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
          </div>

          {/* Message Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст сообщения <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message_text"
              value={formData.message_text}
              onChange={handleChange}
              rows={4}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите текст сообщения для отправки в чат..."
            />
          </div>

          {/* Note Text (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Примечание (опционально)
            </label>
            <textarea
              name="note_text"
              value={formData.note_text}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Текст примечания к лиду..."
            />
          </div>

          {/* Task Text (optional) */}
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

          {/* Priority */}
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

          {/* Result Message */}
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

          {/* Submit Button */}
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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              ℹ️ Информация о работе системы
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Сообщение будет добавлено в очередь и обработано Worker'ом</li>
              <li>• Вы можете указать приоритет для ускорения обработки</li>
              <li>• Примечание и задача создаются автоматически, если указаны</li>
              <li>• Проверьте Dashboard для отслеживания статуса выполнения</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}