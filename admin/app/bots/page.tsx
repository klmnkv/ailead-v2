'use client';

import { useState } from 'react';
import {
  Menu,
  Plus,
  Save,
  Trash2,
  TestTube,
  HelpCircle,
  Upload,
  X,
  Send
} from 'lucide-react';

interface Bot {
  id: number;
  name: string;
  description: string;
  stage: string;
  funnel: string;
  is_active: boolean;
  stats: string;
  prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  deactivation_conditions: string;
  deactivation_message: string;
  files: Array<{ name: string; size: string }>;
  actions: {
    move_stage: boolean;
    assign_manager: boolean;
    create_task: boolean;
    send_notification: boolean;
    add_tag: boolean;
    add_note: boolean;
  };
}

const initialBot: Bot = {
  id: 1,
  name: 'Консультант магазина',
  description: 'Бот для первичного контакта с клиентами интернет-магазина',
  stage: 'Первичный контакт',
  funnel: 'Продажи',
  is_active: true,
  stats: '5 лидов обработано сегодня',
  prompt: 'Ты - консультант интернет-магазина электроники. Твоя задача - помочь клиенту выбрать подходящий товар, ответить на вопросы о характеристиках и довести до покупки. Веди себя дружелюбно, но профессионально.',
  model: 'GPT-4',
  temperature: 0.5,
  max_tokens: 500,
  deactivation_conditions: 'Отключайся, если клиент просит поговорить с менеджером, хочет сделать заказ, задает сложные технические вопросы про интеграцию, или если я не могу ответить на вопрос после 2-3 попыток.',
  deactivation_message: 'Спасибо за общение! Сейчас к вам присоединится наш менеджер.',
  files: [
    { name: 'Каталог товаров.pdf', size: '2.1 МБ' },
    { name: 'FAQ.docx', size: '0.5 МБ' }
  ],
  actions: {
    move_stage: true,
    assign_manager: true,
    create_task: false,
    send_notification: true,
    add_tag: false,
    add_note: false
  }
};

export default function BotsPage() {
  const [selectedBot, setSelectedBot] = useState<Bot>(initialBot);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testHistory, setTestHistory] = useState<Array<{text: string, isUser: boolean, time: string}>>([]);

  const handleSave = () => {
    alert('Настройки бота сохранены!');
  };

  const handleDelete = () => {
    if (confirm('Вы уверены, что хотите удалить этого бота? Это действие нельзя отменить.')) {
      alert('Бот удален');
    }
  };

  const handleTest = () => {
    setShowTestModal(true);
  };

  const sendTestMessage = () => {
    if (!testMessage.trim()) return;

    const time = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    setTestHistory([...testHistory, { text: testMessage, isUser: true, time }]);

    // Симуляция ответа бота
    setTimeout(() => {
      let botResponse = 'Спасибо за ваше сообщение! Не совсем понял ваш запрос. Можете уточнить, что именно вас интересует?';

      const msg = testMessage.toLowerCase();
      if (msg.includes('привет') || msg.includes('здравствуй')) {
        botResponse = 'Здравствуйте! Я консультант интернет-магазина электроники. Чем могу помочь?';
      } else if (msg.includes('телефон') || msg.includes('смартфон')) {
        botResponse = 'У нас широкий выбор смартфонов! Какой бюджет вас интересует? Есть ли предпочтения по бренду?';
      }

      setTestHistory(prev => [...prev, { text: botResponse, isUser: false, time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1000);

    setTestMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Настройка ботов</h1>
          <p className="text-gray-600 mt-2">
            Управление AI-ботами для автоматизации работы с лидами
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-5 h-5" />
          <span>Создать нового бота</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Bot List */}
        <div className="col-span-3 space-y-4">
          <div className="bg-white rounded-lg shadow p-4 border border-blue-200 cursor-pointer hover:shadow-lg transition">
            <div className="font-semibold text-gray-900 mb-1">{selectedBot.name}</div>
            <div className="text-sm text-gray-600 mb-2">{selectedBot.stage}</div>
            <div className="text-xs text-gray-500 mb-3">{selectedBot.stats}</div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${selectedBot.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                ● {selectedBot.is_active ? 'Активен' : 'Неактивен'}
              </span>
              <button
                onClick={() => setSelectedBot({...selectedBot, is_active: !selectedBot.is_active})}
                className={`w-10 h-5 rounded-full transition ${selectedBot.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition transform ${selectedBot.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 opacity-50 cursor-pointer hover:opacity-70 transition">
            <div className="font-semibold text-gray-900 mb-1">Квалификатор B2B</div>
            <div className="text-sm text-gray-600 mb-2">Переговоры</div>
            <div className="text-xs text-gray-500 mb-3">2 лида обработано сегодня</div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">● Неактивен</span>
            </div>
          </div>
        </div>

        {/* Right Content - Bot Settings */}
        <div className="col-span-9 space-y-6">
          {/* Основная информация */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Основная информация</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название бота</label>
                <input
                  type="text"
                  value={selectedBot.name}
                  onChange={(e) => setSelectedBot({...selectedBot, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                <textarea
                  value={selectedBot.description}
                  onChange={(e) => setSelectedBot({...selectedBot, description: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Область работы */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Область работы</h3>
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Воронка</label>
                <select
                  value={selectedBot.funnel}
                  onChange={(e) => setSelectedBot({...selectedBot, funnel: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Продажи</option>
                  <option>Лиды с сайта</option>
                  <option>Партнеры</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Этап</label>
                <select
                  value={selectedBot.stage}
                  onChange={(e) => setSelectedBot({...selectedBot, stage: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Первичный контакт</option>
                  <option>Квалификация</option>
                  <option>Переговоры</option>
                </select>
              </div>
            </div>
          </div>

          {/* Инструкции для бота */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Инструкции для бота</h3>
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Промпт</label>
              <textarea
                value={selectedBot.prompt}
                onChange={(e) => setSelectedBot({...selectedBot, prompt: e.target.value})}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>

          {/* Параметры AI */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Параметры AI</h3>
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Модель</label>
                <select
                  value={selectedBot.model}
                  onChange={(e) => setSelectedBot({...selectedBot, model: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>GPT-4 (рекомендуется)</option>
                  <option>GPT-3.5 (быстрее, дешевле)</option>
                  <option>Claude 3.5 Sonnet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Максимум токенов на ответ</label>
                <input
                  type="number"
                  value={selectedBot.max_tokens}
                  onChange={(e) => setSelectedBot({...selectedBot, max_tokens: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Условия отключения */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Условия отключения</h3>
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Когда бот прекращает работу?</label>
                <textarea
                  value={selectedBot.deactivation_conditions}
                  onChange={(e) => setSelectedBot({...selectedBot, deactivation_conditions: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Сообщение при отключении</label>
                <input
                  type="text"
                  value={selectedBot.deactivation_message}
                  onChange={(e) => setSelectedBot({...selectedBot, deactivation_message: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between sticky bottom-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleTest}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <TestTube className="w-4 h-4" />
                <span>Тестировать</span>
              </button>
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full" />
                <span>Сохранено в 14:25</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Удалить бота</span>
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Отменить
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Save className="w-4 h-4" />
                <span>Сохранить изменения</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">🤖 Тестирование бота: {selectedBot.name}</h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {testHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="text-5xl mb-4">💬</div>
                  <div className="text-lg font-medium mb-2">Начните тестирование</div>
                  <div className="text-sm text-center max-w-md">
                    Отправьте сообщение боту, чтобы начать диалог и проверить его работу
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {testHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${msg.isUser ? 'order-2' : 'order-1'}`}>
                        <div className={`px-4 py-3 rounded-2xl ${msg.isUser ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm'}`}>
                          {msg.text}
                        </div>
                        <div className={`text-xs text-gray-500 mt-1 ${msg.isUser ? 'text-right' : 'text-left'}`}>
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
                  placeholder="Напишите сообщение боту..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendTestMessage}
                  disabled={!testMessage.trim()}
                  className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
