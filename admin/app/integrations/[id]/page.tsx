'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:invoke>
<parameter name="useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  TestTube,
  HelpCircle,
  X,
  Send,
  Loader2,
  Building2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { api, Bot, Integration } from '@/lib/api-client';

export default function IntegrationDetailPage() {
  const params = useParams();
  const integrationId = parseInt(params.id as string);
  const queryClient = useQueryClient();

  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testHistory, setTestHistory] = useState<Array<{text: string, isUser: boolean, time: string}>>([]);
  const [editedBot, setEditedBot] = useState<Partial<Bot>>({});

  // Fetch integration
  const { data: integration, isLoading: isLoadingIntegration } = useQuery({
    queryKey: ['integration', integrationId],
    queryFn: () => api.getIntegration(integrationId),
  });

  // Fetch bots
  const { data: bots = [], isLoading: isLoadingBots } = useQuery({
    queryKey: ['bots', integration?.amocrm_account_id],
    queryFn: () => api.getBots(integration!.amocrm_account_id),
    enabled: !!integration,
  });

  // Fetch pipelines
  const { data: pipelines = [], isLoading: isPipelinesLoading, error: pipelinesError } = useQuery({
    queryKey: ['pipelines', integration?.amocrm_account_id],
    queryFn: () => api.getPipelines(integration!.amocrm_account_id),
    enabled: !!integration,
    retry: false,
  });

  // Select first bot if none selected
  const selectedBot = bots.find(b => b.id === selectedBotId) || bots[0];

  // Helper functions
  const getPipelineName = (pipelineId?: number) => {
    if (!pipelineId) return 'Не указана';
    return pipelines.find(p => p.id === pipelineId)?.name || 'Не найдена';
  };

  const getStageName = (stageId?: number) => {
    if (!stageId) return 'Не указан';
    for (const pipeline of pipelines) {
      const stage = pipeline.stages.find(s => s.id === stageId);
      if (stage) return stage.name;
    }
    return 'Не найден';
  };

  // Get stages for selected pipeline
  const selectedPipelineId = editedBot.pipeline_id !== undefined
    ? editedBot.pipeline_id
    : selectedBot?.pipeline_id;

  const availableStages = useMemo(() => {
    if (!selectedPipelineId) return [];
    const pipeline = pipelines.find(p => p.id === selectedPipelineId);
    return pipeline?.stages || [];
  }, [selectedPipelineId, pipelines]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Bot> }) => api.updateBot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots', integration?.amocrm_account_id] });
      alert('Настройки бота сохранены!');
      setEditedBot({});
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteBot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots', integration?.amocrm_account_id] });
      setSelectedBotId(null);
    },
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.toggleBot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots', integration?.amocrm_account_id] });
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Bot>) => api.createBot({ ...data, account_id: integration!.amocrm_account_id }),
    onSuccess: (newBot) => {
      queryClient.invalidateQueries({ queryKey: ['bots', integration?.amocrm_account_id] });
      setSelectedBotId(newBot.id);
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: number) => api.duplicateBot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots', integration?.amocrm_account_id] });
    },
  });

  const handleSave = () => {
    if (!selectedBot) return;
    updateMutation.mutate({ id: selectedBot.id, data: editedBot });
  };

  const handleDelete = () => {
    if (!selectedBot) return;
    if (confirm('Вы уверены, что хотите удалить этого бота? Это действие нельзя отменить.')) {
      deleteMutation.mutate(selectedBot.id);
    }
  };

  const handleTest = () => {
    setShowTestModal(true);
  };

  const handleCreateBot = () => {
    if (!integration) return;
    createMutation.mutate({
      name: 'Новый бот',
      description: 'Описание бота',
      prompt: 'Ты - AI-помощник. Помогай пользователям с их вопросами.',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 500,
      is_active: false,
    });
  };

  const updateBotField = <K extends keyof Bot>(field: K, value: Bot[K]) => {
    setEditedBot(prev => ({ ...prev, [field]: value }));
  };

  const getBotValue = <K extends keyof Bot>(field: K): Bot[K] | undefined => {
    return (editedBot[field] !== undefined ? editedBot[field] : selectedBot?.[field]) as Bot[K] | undefined;
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
        botResponse = 'Здравствуйте! Я AI-помощник. Чем могу помочь?';
      }

      setTestHistory(prev => [...prev, { text: botResponse, isUser: false, time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1000);

    setTestMessage('');
  };

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'inactive':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusText = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return 'Активна';
      case 'inactive':
        return 'Неактивна';
      case 'error':
        return 'Ошибка';
    }
  };

  if (isLoadingIntegration) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Интеграция не найдена</h2>
        <Link href="/integrations" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Вернуться к списку
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/integrations"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{integration.domain}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-gray-600">ID: {integration.amocrm_account_id}</p>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(integration.status)}
                    <span className="text-sm font-medium text-gray-700">
                      {getStatusText(integration.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleCreateBot}
          disabled={createMutation.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          <span>Создать бота</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Bot List */}
        <div className="col-span-3 space-y-4">
          {isLoadingBots ? (
            <div className="bg-white rounded-lg shadow p-6 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : bots.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              <p>Нет ботов</p>
              <p className="text-sm mt-2">Создайте первого бота</p>
            </div>
          ) : (
            bots.map((bot) => (
              <div
                key={bot.id}
                onClick={() => {
                  setSelectedBotId(bot.id);
                  setEditedBot({});
                }}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition ${
                  selectedBot?.id === bot.id ? 'border-2 border-blue-500' : ''
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">{bot.name}</div>
                <div className="text-sm text-gray-600 mb-2">{getStageName(bot.stage_id)}</div>
                <div className="text-xs text-gray-500 mb-3 line-clamp-2">{bot.description || 'Без описания'}</div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${bot.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                    ● {bot.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMutation.mutate(bot.id);
                    }}
                    disabled={toggleMutation.isPending}
                    className={`w-10 h-5 rounded-full transition ${bot.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition transform ${bot.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Content - Bot Settings */}
        <div className="col-span-9 space-y-6">
          {!selectedBot ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              <p className="text-lg">Выберите бота из списка или создайте нового</p>
            </div>
          ) : (
            <>
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
                      value={getBotValue('name') || ''}
                      onChange={(e) => updateBotField('name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                    <textarea
                      value={getBotValue('description') || ''}
                      onChange={(e) => updateBotField('description', e.target.value)}
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
                  {pipelinesError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="text-red-600">⚠️</div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-red-900 mb-1">
                            Требуется переподключение интеграции
                          </h4>
                          <p className="text-sm text-red-700 mb-2">
                            Токен доступа к amoCRM устарел. Переподключите интеграцию в настройках виджета в amoCRM.
                          </p>
                          <p className="text-xs text-red-600">
                            Откройте amoCRM → Настройки → Интеграции → VoiceLead AI → Настроить
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Воронка</label>
                    {isPipelinesLoading ? (
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Загрузка воронок...</span>
                      </div>
                    ) : pipelinesError ? (
                      <div className="w-full px-4 py-2 border border-red-300 bg-red-50 rounded-lg flex items-center gap-2 text-red-600">
                        <span>Ошибка загрузки воронок</span>
                      </div>
                    ) : (
                      <select
                        value={getBotValue('pipeline_id') || ''}
                        onChange={(e) => {
                          const pipelineId = e.target.value ? parseInt(e.target.value) : null;
                          updateBotField('pipeline_id', pipelineId as any);
                          updateBotField('stage_id', null as any);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Выберите воронку</option>
                        {pipelines.map((pipeline) => (
                          <option key={pipeline.id} value={pipeline.id}>
                            {pipeline.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Этап</label>
                    {isPipelinesLoading ? (
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Загрузка этапов...</span>
                      </div>
                    ) : pipelinesError ? (
                      <div className="w-full px-4 py-2 border border-red-300 bg-red-50 rounded-lg flex items-center gap-2 text-red-600">
                        <span>Ошибка загрузки этапов</span>
                      </div>
                    ) : (
                      <select
                        value={getBotValue('stage_id') || ''}
                        onChange={(e) => {
                          const stageId = e.target.value ? parseInt(e.target.value) : null;
                          updateBotField('stage_id', stageId as any);
                        }}
                        disabled={!selectedPipelineId}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!selectedPipelineId ? 'Сначала выберите воронку' : 'Выберите этап'}
                        </option>
                        {availableStages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.name}
                          </option>
                        ))}
                      </select>
                    )}
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
                    value={getBotValue('prompt') || ''}
                    onChange={(e) => updateBotField('prompt', e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>

              {/* Параметры AI */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">Параметры AI</h3>
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" title="Настройки для OpenAI/ChatGPT интеграции" />
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Провайдер</label>
                    <select
                      value={getBotValue('ai_provider') || 'openai'}
                      onChange={(e) => updateBotField('ai_provider' as keyof Bot, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="openai">OpenAI (GPT)</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Ключ</label>
                    <input
                      type="password"
                      value={getBotValue('api_key' as keyof Bot) || ''}
                      onChange={(e) => updateBotField('api_key' as keyof Bot, e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ваш API ключ хранится безопасно и используется только для генерации ответов
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Модель</label>
                    <select
                      value={getBotValue('model') || 'gpt-3.5-turbo'}
                      onChange={(e) => updateBotField('model', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <optgroup label="OpenAI">
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (быстрее, дешевле)</option>
                        <option value="gpt-4">GPT-4 (лучше качество)</option>
                        <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                      </optgroup>
                      <optgroup label="Anthropic">
                        <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                        <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                        <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature (креативность): {getBotValue('temperature') || 0.7}
                    </label>
                    <input
                      type="range"
                      step="0.1"
                      min="0"
                      max="2"
                      value={getBotValue('temperature') || 0.7}
                      onChange={(e) => updateBotField('temperature', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0 (точные)</span>
                      <span>1 (сбалансированные)</span>
                      <span>2 (креативные)</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Максимум токенов на ответ</label>
                    <input
                      type="number"
                      min="50"
                      max="4000"
                      value={getBotValue('max_tokens') || 500}
                      onChange={(e) => updateBotField('max_tokens', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      1 токен ≈ 4 символа. 500 токенов ≈ 2000 символов
                    </p>
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
                      value={getBotValue('deactivation_conditions') || ''}
                      onChange={(e) => updateBotField('deactivation_conditions', e.target.value)}
                      rows={4}
                      placeholder="Опишите условия, когда бот должен прекратить работу..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Сообщение при отключении</label>
                    <input
                      type="text"
                      value={getBotValue('deactivation_message') || ''}
                      onChange={(e) => updateBotField('deactivation_message', e.target.value)}
                      placeholder="Сообщение, которое увидит клиент"
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
                  {Object.keys(editedBot).length === 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      <span>Нет несохраненных изменений</span>
                    </div>
                  )}
                  {Object.keys(editedBot).length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-orange-600">
                      <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
                      <span>Есть несохраненные изменения</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Удалить бота</span>
                  </button>
                  <button
                    onClick={() => setEditedBot({})}
                    disabled={Object.keys(editedBot).length === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Отменить
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending || Object.keys(editedBot).length === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Сохранить изменения</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Test Modal */}
      {showTestModal && selectedBot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Тестирование бота: {selectedBot.name}</h3>
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
