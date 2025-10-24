'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Save,
  Trash2,
  X,
  Loader2,
  Search,
  Tag,
  FileText
} from 'lucide-react';
import { api, KnowledgeBase } from '@/lib/api-client';

export default function KnowledgeBasePage() {
  const searchParams = useSearchParams();
  const accountId = parseInt(searchParams.get('account_id') || '1');
  const queryClient = useQueryClient();

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [editedItem, setEditedItem] = useState<Partial<KnowledgeBase>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Fetch knowledge base items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['knowledge-base', accountId],
    queryFn: () => api.getKnowledgeBase(accountId),
  });

  // Select first item if none selected
  const selectedItem = items.find(item => item.id === selectedItemId) || items[0];

  // Get unique categories
  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[];

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<KnowledgeBase> }) =>
      api.updateKnowledgeBase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', accountId] });
      alert('Запись обновлена!');
      setEditedItem({});
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteKnowledgeBase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', accountId] });
      setSelectedItemId(null);
    },
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.toggleKnowledgeBase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', accountId] });
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<KnowledgeBase>) =>
      api.createKnowledgeBase({ ...data, account_id: accountId }),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', accountId] });
      setSelectedItemId(newItem.id);
    },
  });

  const handleSave = () => {
    if (!selectedItem) return;
    updateMutation.mutate({ id: selectedItem.id, data: editedItem });
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    if (confirm('Вы уверены, что хотите удалить эту запись? Это действие нельзя отменить.')) {
      deleteMutation.mutate(selectedItem.id);
    }
  };

  const handleCreateItem = () => {
    createMutation.mutate({
      name: 'Новая запись',
      description: 'Описание записи',
      content: 'Содержимое базы знаний...',
      category: 'Общее',
      is_active: true,
    });
  };

  const updateItemField = <K extends keyof KnowledgeBase>(field: K, value: KnowledgeBase[K]) => {
    setEditedItem(prev => ({ ...prev, [field]: value }));
  };

  const getItemValue = <K extends keyof KnowledgeBase>(field: K): KnowledgeBase[K] | undefined => {
    return (editedItem[field] !== undefined ? editedItem[field] : selectedItem?.[field]) as KnowledgeBase[K] | undefined;
  };

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
          onClick={handleCreateItem}
          disabled={createMutation.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          <span>Добавить запись</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Items List */}
        <div className="col-span-3 space-y-4">
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все категории</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Items List */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              <p>Нет записей</p>
              <p className="text-sm mt-2">Создайте первую запись</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItemId(item.id);
                  setEditedItem({});
                }}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition ${
                  selectedItem?.id === item.id ? 'border-2 border-blue-500' : ''
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">{item.name}</div>
                {item.category && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                    <Tag className="w-3 h-3" />
                    <span>{item.category}</span>
                  </div>
                )}
                <div className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {item.description || 'Без описания'}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${item.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                    ● {item.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMutation.mutate(item.id);
                    }}
                    disabled={toggleMutation.isPending}
                    className={`w-10 h-5 rounded-full transition ${item.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition transform ${item.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Content - Item Details */}
        <div className="col-span-9 space-y-6">
          {!selectedItem ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Выберите запись из списка или создайте новую</p>
            </div>
          ) : (
            <>
              {/* Основная информация */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Основная информация</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
                    <input
                      type="text"
                      value={getItemValue('name') || ''}
                      onChange={(e) => updateItemField('name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                    <textarea
                      value={getItemValue('description') || ''}
                      onChange={(e) => updateItemField('description', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                    <input
                      type="text"
                      value={getItemValue('category') || ''}
                      onChange={(e) => updateItemField('category', e.target.value)}
                      placeholder="Например: Продукты, Услуги, FAQ..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Содержимое */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Содержимое</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Эта информация будет доступна боту для генерации ответов
                  </p>
                </div>
                <div className="p-6">
                  <textarea
                    value={getItemValue('content') || ''}
                    onChange={(e) => updateItemField('content', e.target.value)}
                    rows={15}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Введите информацию, которую должен знать бот..."
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between sticky bottom-0">
                <div className="flex items-center space-x-4">
                  {Object.keys(editedItem).length === 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      <span>Нет несохраненных изменений</span>
                    </div>
                  )}
                  {Object.keys(editedItem).length > 0 && (
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
                    <span>Удалить</span>
                  </button>
                  <button
                    onClick={() => setEditedItem({})}
                    disabled={Object.keys(editedItem).length === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Отменить
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending || Object.keys(editedItem).length === 0}
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
    </div>
  );
}
