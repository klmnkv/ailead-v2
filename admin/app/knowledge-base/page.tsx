'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Save,
  Trash2,
  Upload,
  FileText,
  Folder,
  Search,
  Edit2,
  X,
  Loader2,
  BookOpen,
  Link as LinkIcon,
  File,
  CheckCircle,
} from 'lucide-react';
import { api, KnowledgeBase, KnowledgeBaseItem } from '@/lib/api-client';

export default function KnowledgeBasePage() {
  const searchParams = useSearchParams();
  const accountId = parseInt(searchParams.get('account_id') || '1');
  const queryClient = useQueryClient();

  const [selectedKBId, setSelectedKBId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch knowledge bases
  const { data: knowledgeBases = [], isLoading } = useQuery({
    queryKey: ['knowledgeBases', accountId],
    queryFn: () => api.getKnowledgeBases(accountId),
  });

  // Fetch items for selected KB
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['knowledgeBaseItems', selectedKBId],
    queryFn: () => api.getKnowledgeBaseItems(selectedKBId!),
    enabled: !!selectedKBId,
  });

  // Select first KB if none selected
  const selectedKB = knowledgeBases.find(kb => kb.id === selectedKBId) || knowledgeBases[0];

  // Create KB mutation
  const createKBMutation = useMutation({
    mutationFn: api.createKnowledgeBase,
    onSuccess: (newKB) => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases', accountId] });
      setSelectedKBId(newKB.id);
      setShowCreateModal(false);
    },
  });

  // Delete KB mutation
  const deleteKBMutation = useMutation({
    mutationFn: api.deleteKnowledgeBase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases', accountId] });
      setSelectedKBId(null);
    },
  });

  // Create Item mutation
  const createItemMutation = useMutation({
    mutationFn: api.createKnowledgeBaseItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBaseItems', selectedKBId] });
      setShowAddItemModal(false);
    },
  });

  // Delete Item mutation
  const deleteItemMutation = useMutation({
    mutationFn: api.deleteKnowledgeBaseItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBaseItems', selectedKBId] });
    },
  });

  // Filter items by search
  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">База знаний</h1>
          <p className="text-gray-600 mt-2">
            Управление информацией для AI-ботов
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={createKBMutation.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {createKBMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          <span>Создать базу знаний</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - KB List */}
        <div className="col-span-3 space-y-4">
          {knowledgeBases.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">Нет баз знаний</p>
              <p className="text-sm mt-2">Создайте первую базу знаний</p>
            </div>
          ) : (
            knowledgeBases.map((kb) => (
              <div
                key={kb.id}
                onClick={() => setSelectedKBId(kb.id)}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition ${
                  selectedKB?.id === kb.id ? 'border-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Folder className="w-5 h-5 text-blue-600" />
                    <div className="font-semibold text-gray-900">{kb.name}</div>
                  </div>
                  {kb.is_default && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      По умолчанию
                    </span>
                  )}
                </div>
                {kb.description && (
                  <div className="text-sm text-gray-600 mb-2">{kb.description}</div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{kb.items_count || 0} элементов</span>
                  <span className={kb.is_active ? 'text-green-600' : 'text-gray-400'}>
                    ● {kb.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Content - KB Items */}
        <div className="col-span-9 space-y-6">
          {!selectedKB ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">Выберите базу знаний из списка или создайте новую</p>
            </div>
          ) : (
            <>
              {/* KB Header */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedKB.name}</h2>
                    <p className="text-gray-600 mb-4">{selectedKB.description || 'Нет описания'}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Создано: {new Date(selectedKB.created_at!).toLocaleDateString('ru')}</span>
                      <span>•</span>
                      <span>{items.length} элементов</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Вы уверены, что хотите удалить эту базу знаний?')) {
                        deleteKBMutation.mutate(selectedKB.id);
                      }
                    }}
                    disabled={deleteKBMutation.isPending}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {deleteKBMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Удалить</span>
                  </button>
                </div>
              </div>

              {/* Search and Add */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск в базе знаний..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Добавить элемент</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {isLoadingItems ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg">
                      {searchQuery ? 'Ничего не найдено' : 'Нет элементов'}
                    </p>
                    <p className="text-sm mt-2">
                      {searchQuery ? 'Попробуйте изменить запрос' : 'Добавьте первый элемент в базу знаний'}
                    </p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {item.type === 'text' && <FileText className="w-5 h-5 text-blue-600" />}
                            {item.type === 'file' && <File className="w-5 h-5 text-green-600" />}
                            {item.type === 'url' && <LinkIcon className="w-5 h-5 text-purple-600" />}
                            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">{item.content}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Тип: {item.type === 'text' ? 'Текст' : item.type === 'file' ? 'Файл' : 'Ссылка'}</span>
                            {item.metadata?.source && (
                              <>
                                <span>•</span>
                                <span>Источник: {item.metadata.source}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>Добавлено: {new Date(item.created_at!).toLocaleDateString('ru')}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Удалить этот элемент?')) {
                              deleteItemMutation.mutate(item.id);
                            }
                          }}
                          disabled={deleteItemMutation.isPending}
                          className="ml-4 p-2 text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create KB Modal */}
      {showCreateModal && (
        <CreateKBModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => createKBMutation.mutate({ ...data, account_id: accountId })}
          isLoading={createKBMutation.isPending}
        />
      )}

      {/* Add Item Modal */}
      {showAddItemModal && selectedKB && (
        <AddItemModal
          knowledgeBaseId={selectedKB.id}
          onClose={() => setShowAddItemModal(false)}
          onCreate={(data) => createItemMutation.mutate(data)}
          isLoading={createItemMutation.isPending}
        />
      )}
    </div>
  );
}

// Create KB Modal Component
function CreateKBModal({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void;
  onCreate: (data: Partial<KnowledgeBase>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_default: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Создать базу знаний</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Например: Каталог товаров"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Краткое описание содержимого базы знаний"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Активна
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_default" className="text-sm text-gray-700">
              Использовать по умолчанию
            </label>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Отменить
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Создать</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Item Modal Component
function AddItemModal({
  knowledgeBaseId,
  onClose,
  onCreate,
  isLoading,
}: {
  knowledgeBaseId: number;
  onClose: () => void;
  onCreate: (data: Partial<KnowledgeBaseItem>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    knowledge_base_id: knowledgeBaseId,
    title: '',
    content: '',
    type: 'text' as 'text' | 'file' | 'url',
    metadata: {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Добавить элемент в базу знаний</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип элемента
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['text', 'file', 'url'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`p-3 border-2 rounded-lg transition ${
                    formData.type === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {type === 'text' && <FileText className="w-6 h-6 mx-auto mb-1" />}
                  {type === 'file' && <File className="w-6 h-6 mx-auto mb-1" />}
                  {type === 'url' && <LinkIcon className="w-6 h-6 mx-auto mb-1" />}
                  <div className="text-sm font-medium">
                    {type === 'text' ? 'Текст' : type === 'file' ? 'Файл' : 'Ссылка'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Краткое название элемента"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Содержимое *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder={
                formData.type === 'text'
                  ? 'Введите текст информации...'
                  : formData.type === 'url'
                  ? 'https://example.com/page'
                  : 'Путь к файлу или содержимое'
              }
            />
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Отменить
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Добавить</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
