'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Workflow,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Copy,
  Loader,
  AlertCircle,
} from 'lucide-react';

// Mock API для сценариев (замените на реальный API)
interface Scenario {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  steps: number;
  created_at: string;
  last_run?: string;
  runs_count: number;
}

export default function ScenariosPage() {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  // Загрузка сценариев (заглушка)
  const { data: scenarios, isLoading } = useQuery({
    queryKey: ['scenarios'],
    queryFn: async () => {
      // TODO: Заменить на реальный API
      return mockScenarios;
    },
  });

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Сценарии</h1>
          <p className="text-gray-600 mt-2">
            Создавайте и управляйте автоматическими сценариями отправки сообщений
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Создать сценарий</span>
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Всего сценариев"
          value={scenarios?.length || 0}
          icon={Workflow}
          color="blue"
        />
        <StatCard
          title="Активных"
          value={scenarios?.filter((s) => s.is_active).length || 0}
          icon={Play}
          color="green"
        />
        <StatCard
          title="Неактивных"
          value={scenarios?.filter((s) => !s.is_active).length || 0}
          icon={Pause}
          color="gray"
        />
        <StatCard
          title="Всего запусков"
          value={scenarios?.reduce((sum, s) => sum + s.runs_count, 0) || 0}
          icon={Workflow}
          color="purple"
        />
      </div>

      {/* Список сценариев */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : scenarios && scenarios.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Нет сценариев
          </h3>
          <p className="text-gray-600 mb-4">
            Создайте свой первый сценарий для автоматизации отправки сообщений
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Создать первый сценарий</span>
          </button>
        </div>
      )}

      {/* Модалка создания (заглушка) */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Создание сценария
            </h2>
            <p className="text-gray-600 mb-6">
              🚧 Визуальный конструктор сценариев в разработке
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsCreating(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// КОМПОНЕНТЫ
// ============================================

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    gray: 'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
      {/* Заголовок и статус */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {scenario.name}
          </h3>
          <p className="text-sm text-gray-600">{scenario.description}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            scenario.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {scenario.is_active ? 'Активен' : 'Неактивен'}
        </span>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-t border-b border-gray-200">
        <div>
          <p className="text-xs text-gray-500 mb-1">Шагов</p>
          <p className="text-lg font-semibold text-gray-900">{scenario.steps}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Запусков</p>
          <p className="text-lg font-semibold text-gray-900">
            {scenario.runs_count}
          </p>
        </div>
      </div>

      {/* Действия */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Редактировать"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
            title="Дублировать"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
            scenario.is_active
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {scenario.is_active ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Деактивировать</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Активировать</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// MOCK DATA
// ============================================

const mockScenarios: Scenario[] = [
  {
    id: 1,
    name: 'Приветствие новых лидов',
    description: 'Автоматическая отправка приветственного сообщения новым лидам',
    is_active: true,
    steps: 3,
    created_at: '2024-01-15T10:00:00Z',
    last_run: '2024-01-20T14:30:00Z',
    runs_count: 127,
  },
  {
    id: 2,
    name: 'Напоминание о встрече',
    description: 'Отправка напоминания за 1 час до запланированной встречи',
    is_active: true,
    steps: 5,
    created_at: '2024-01-10T09:00:00Z',
    last_run: '2024-01-20T11:00:00Z',
    runs_count: 89,
  },
  {
    id: 3,
    name: 'Реактивация холодных лидов',
    description: 'Попытка вернуть внимание лидов без активности более 30 дней',
    is_active: false,
    steps: 7,
    created_at: '2024-01-05T15:30:00Z',
    runs_count: 45,
  },
  {
    id: 4,
    name: 'Опрос после покупки',
    description: 'Автоматический опрос клиентов через 3 дня после покупки',
    is_active: true,
    steps: 4,
    created_at: '2024-01-18T12:00:00Z',
    last_run: '2024-01-20T16:45:00Z',
    runs_count: 56,
  },
];
