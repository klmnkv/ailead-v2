'use client';

import { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Zap,
  Database,
  Key,
  Save,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

type TabType = 'profile' | 'integrations' | 'notifications' | 'security' | 'advanced';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Профиль', icon: User },
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
// ТАБЫ
// ============================================

function ProfileTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Профиль</h2>
        <p className="text-gray-600">Управление личными данными и настройками аккаунта</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Имя
          </label>
          <input
            type="text"
            defaultValue="Иван Иванов"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            defaultValue="ivan@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Компания
          </label>
          <input
            type="text"
            defaultValue="ООО «Рога и Копыта»"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Часовой пояс
          </label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Europe/Moscow (UTC+3)</option>
            <option>Europe/London (UTC+0)</option>
            <option>America/New_York (UTC-5)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Интеграции</h2>
        <p className="text-gray-600">Подключенные сервисы и API</p>
      </div>

      <div className="space-y-4">
        {/* amoCRM */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">amoCRM</h3>
                <p className="text-sm text-gray-500">CRM система</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Подключено
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Account ID:</span>
              <span className="font-medium">31650448</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subdomain:</span>
              <span className="font-medium">pomkatest</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Последнее обновление:</span>
              <span className="font-medium">2 часа назад</span>
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Обновить токен</span>
            </button>
            <button className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition">
              Отключить
            </button>
          </div>
        </div>

        {/* Webhook */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Webhook URL</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              readOnly
              value="https://api.voicelead.com/webhook/amocrm"
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
            <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              Копировать
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Используйте этот URL для настройки webhooks в amoCRM
          </p>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Уведомления</h2>
        <p className="text-gray-600">Настройка уведомлений о событиях системы</p>
      </div>

      <div className="space-y-4">
        <NotificationToggle
          title="Email уведомления"
          description="Получать уведомления на почту о важных событиях"
          defaultChecked={true}
        />
        <NotificationToggle
          title="Ошибки отправки"
          description="Уведомлять при ошибках отправки сообщений"
          defaultChecked={true}
        />
        <NotificationToggle
          title="Еженедельный отчет"
          description="Получать сводку по активности каждую неделю"
          defaultChecked={false}
        />
        <NotificationToggle
          title="Низкий баланс"
          description="Предупреждение когда заканчиваются лимиты"
          defaultChecked={true}
        />
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Безопасность</h2>
        <p className="text-gray-600">Управление паролем и доступом</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Текущий пароль
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Новый пароль
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Подтверждение пароля
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Активные сессии</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Chrome на Windows</p>
                <p className="text-gray-500">Москва • Активна сейчас</p>
              </div>
              <button className="text-red-600 hover:text-red-700">
                Завершить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdvancedTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Дополнительно</h2>
        <p className="text-gray-600">API ключи и расширенные настройки</p>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">API ключ</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Создать новый
            </button>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              readOnly
              value="vl_sk_test_51234567890abcdef"
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
            />
            <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              <Key className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Используйте этот ключ для доступа к API
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Лимиты</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Запросов в минуту:</span>
              <span className="font-medium">60</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Сообщений в день:</span>
              <span className="font-medium">1000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// КОМПОНЕНТЫ
// ============================================

function NotificationToggle({
  title,
  description,
  defaultChecked,
}: {
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
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
    </div>
  );
}
