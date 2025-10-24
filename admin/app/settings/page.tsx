'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Bell,
  Shield,
  Zap,
  Database,
  Save,
  CheckCircle,
  Bot,
  TestTube,
  Key,
  Mail,
  Lock,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api-client';

type TabType = 'profile' | 'bot' | 'integrations' | 'notifications' | 'security' | 'advanced';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('bot');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'bot', label: 'Настройки бота', icon: Bot },
    { id: 'integrations', label: 'Интеграции', icon: Zap },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'advanced', label: 'Дополнительно', icon: Database },
  ];

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-600 mt-2">
          Управление профилем, интеграциями и настройками системы
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar с табами */}
        <div className="w-64 flex-shrink-0">
          <nav className="bg-white rounded-lg shadow p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition text-left',
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Контент */}
        <div className="flex-1 bg-white rounded-lg shadow">
          <div className="p-6">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'bot' && <BotTab />}
            {activeTab === 'integrations' && <IntegrationsTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'advanced' && <AdvancedTab />}
          </div>

          {/* Сохранить */}
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            {saved && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Изменения сохранены</span>
              </div>
            )}
            <div className="ml-auto flex space-x-3">
              <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Отменить
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Save className="w-4 h-4" />
                <span>Сохранить</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PROFILE TAB
// ============================================
function ProfileTab() {
  const [profile, setProfile] = useState({
    name: 'Admin',
    email: 'admin@example.com',
    company: 'AI.LEAD',
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Профиль пользователя</h2>
        <p className="text-gray-600">Управление информацией о вашем аккаунте</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
        <input
          type="text"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          type="email"
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Компания</label>
        <input
          type="text"
          value={profile.company}
          onChange={(e) => setProfile({ ...profile, company: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

// ============================================
// BOT TAB
// ============================================
function BotTab() {
  const queryClient = useQueryClient();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['botConfig'],
    queryFn: api.getBotConfig,
  });

  const { data: knowledgeItems = [] } = useQuery({
    queryKey: ['knowledge'],
    queryFn: api.getKnowledgeBase,
  });

  const saveMutation = useMutation({
    mutationFn: api.saveBotConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botConfig'] });
      setLastSaved(new Date());
    },
  });

  const testMutation = useMutation({
    mutationFn: api.testBotPrompt,
  });

  const [formData, setFormData] = useState({
    auto_process: config?.auto_process || false,
    prompt: config?.prompt || '',
    knowledge_base_ids: config?.knowledge_base_ids || [],
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleTest = () => {
    testMutation.mutate({ prompt: formData.prompt });
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Настройки бота</h2>
        <p className="text-gray-600">Управление AI-ботом для обработки лидов</p>
      </div>

      {/* Toggle автообработки */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-900">
            Автоматическая обработка новых лидов
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Бот будет автоматически начинать диалог с новыми лидами
          </p>
        </div>
        <Toggle
          checked={formData.auto_process}
          onChange={(checked) =>
            setFormData({ ...formData, auto_process: checked })
          }
        />
      </div>

      {/* Промпт для бота */}
      <div>
        <label className="block font-medium text-gray-900 mb-2">
          Промпт для AI-бота
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder="Ты - профессиональный менеджер по продажам. Твоя задача - помочь клиенту с выбором товара..."
        />
        <p className="text-xs text-gray-500 mt-2">
          Опишите, как должен вести себя бот при общении с клиентами
        </p>
      </div>

      {/* База знаний */}
      <div>
        <label className="block font-medium text-gray-900 mb-2">
          База знаний
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Выберите записи из базы знаний, которые бот будет использовать при ответах
        </p>

        {knowledgeItems.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-gray-500 mb-3">База знаний пуста</p>
            <a
              href="/knowledge"
              className="inline-flex items-center px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Добавить записи
            </a>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {knowledgeItems.filter(item => item.is_active).map(item => (
              <label
                key={item.id}
                className="flex items-start p-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={formData.knowledge_base_ids?.includes(item.id)}
                  onChange={(e) => {
                    const newIds = e.target.checked
                      ? [...(formData.knowledge_base_ids || []), item.id]
                      : (formData.knowledge_base_ids || []).filter(id => id !== item.id);
                    setFormData({ ...formData, knowledge_base_ids: newIds });
                  }}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">{item.title}</div>
                  {item.category && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                      {item.category}
                    </span>
                  )}
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {item.content}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-2">
          Выбрано: {formData.knowledge_base_ids?.length || 0} из {knowledgeItems.filter(i => i.is_active).length}
        </p>
      </div>

      {/* Статус сохранения */}
      {lastSaved && (
        <div className="flex items-center space-x-2 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Сохранено в {lastSaved.toLocaleTimeString('ru-RU')}</span>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex space-x-3">
        <button
          onClick={handleTest}
          disabled={testMutation.isPending}
          className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        >
          <TestTube className="w-4 h-4" />
          <span>{testMutation.isPending ? 'Тестирование...' : 'Тестировать'}</span>
        </button>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}</span>
        </button>
      </div>

      {/* Результат тестирования */}
      {testMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">✅ Тест пройден</h4>
          <p className="text-sm text-green-800">
            Промпт работает корректно и готов к использованию
          </p>
        </div>
      )}

      {testMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">❌ Ошибка теста</h4>
          <p className="text-sm text-red-800">
            {(testMutation.error as Error).message}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// INTEGRATIONS TAB
// ============================================
function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Интеграции</h2>
        <p className="text-gray-600">Подключение внешних сервисов</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          ℹ️ Функционал интеграций находится в разработке
        </p>
      </div>
    </div>
  );
}

// ============================================
// NOTIFICATIONS TAB
// ============================================
function NotificationsTab() {
  const [notifications, setNotifications] = useState({
    email_on_error: true,
    email_on_success: false,
    daily_report: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Уведомления</h2>
        <p className="text-gray-600">Настройка email и push уведомлений</p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={notifications.email_on_error}
            onChange={(e) =>
              setNotifications({
                ...notifications,
                email_on_error: e.target.checked,
              })
            }
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Отправлять email при ошибках
          </span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={notifications.email_on_success}
            onChange={(e) =>
              setNotifications({
                ...notifications,
                email_on_success: e.target.checked,
              })
            }
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Отправлять email при успешной отправке
          </span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={notifications.daily_report}
            onChange={(e) =>
              setNotifications({
                ...notifications,
                daily_report: e.target.checked,
              })
            }
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Ежедневный отчёт о работе системы
          </span>
        </label>
      </div>
    </div>
  );
}

// ============================================
// SECURITY TAB
// ============================================
function SecurityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Безопасность</h2>
        <p className="text-gray-600">Настройки безопасности аккаунта</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Функционал безопасности находится в разработке
        </p>
      </div>
    </div>
  );
}

// ============================================
// ADVANCED TAB
// ============================================
function AdvancedTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Дополнительно</h2>
        <p className="text-gray-600">Расширенные настройки системы</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          ℹ️ Дополнительные настройки находятся в разработке
        </p>
      </div>
    </div>
  );
}

// ============================================
// TOGGLE COMPONENT
// ============================================
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition',
        checked ? 'bg-blue-600' : 'bg-gray-300'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}