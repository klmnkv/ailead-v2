'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Save,
  Trash2,
  X,
  BookOpen,
  Search,
  Edit2,
  Check,
  Tag,
  Folder
} from 'lucide-react';
import { api, KnowledgeBase } from '@/lib/api-client';

export default function KnowledgePage() {
  const searchParams = useSearchParams();
  const accountId = parseInt(searchParams.get('account_id') || '1');
  const queryClient = useQueryClient();

  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeBase | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formData, setFormData] = useState<Partial<KnowledgeBase>>({
    title: '',
    content: '',
    category: '',
    tags: '',
    is_active: true,
  });

  // Fetch knowledge base
  const { data: knowledgeList = [], isLoading } = useQuery({
    queryKey: ['knowledge', accountId, categoryFilter, searchQuery],
    queryFn: () => api.getKnowledge(accountId, categoryFilter || undefined, searchQuery || undefined),
  });

  // Get unique categories
  const categories = Array.from(new Set(knowledgeList.map(k => k.category).filter(Boolean)));

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<KnowledgeBase>) => api.createKnowledge({ ...data, account_id: accountId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', accountId] });
      setIsCreating(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<KnowledgeBase> }) => api.updateKnowledge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', accountId] });
      setIsEditing(false);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteKnowledge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', accountId] });
      setSelectedKnowledge(null);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      tags: '',
      is_active: true,
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedKnowledge(null);
    resetForm();
  };

  const handleEdit = (knowledge: KnowledgeBase) => {
    setSelectedKnowledge(knowledge);
    setFormData({
      title: knowledge.title,
      content: knowledge.content,
      category: knowledge.category,
      tags: knowledge.tags,
      is_active: knowledge.is_active,
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSave = () => {
    if (isCreating) {
      createMutation.mutate(formData);
    } else if (isEditing && selectedKnowledge) {
      updateMutation.mutate({ id: selectedKnowledge.id, data: formData });
    }
  };

  const handleDelete = (knowledge: KnowledgeBase) => {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
      deleteMutation.mutate(knowledge.id);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedKnowledge(null);
    resetForm();
  };

  const handleSelect = (knowledge: KnowledgeBase) => {
    if (!isEditing && !isCreating) {
      setSelectedKnowledge(knowledge);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              База знаний
            </h1>
          </div>
          <p className="text-gray-600">
            Управляйте информацией для ваших ботов
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
              >
                <option value="">Все категории</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center justify-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Создать запись</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Knowledge List */}
          <div className="lg:col-span-1 bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-6 max-h-[600px] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Записи ({knowledgeList.length})</h2>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : knowledgeList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Нет записей</p>
              </div>
            ) : (
              <div className="space-y-2">
                {knowledgeList.map((knowledge) => (
                  <div
                    key={knowledge.id}
                    onClick={() => handleSelect(knowledge)}
                    className={`p-4 rounded-lg cursor-pointer transition ${
                      selectedKnowledge?.id === knowledge.id
                        ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{knowledge.title}</h3>
                        {knowledge.category && (
                          <div className="flex items-center text-xs text-gray-500 mb-1">
                            <Folder className="w-3 h-3 mr-1" />
                            {knowledge.category}
                          </div>
                        )}
                        {knowledge.tags && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Tag className="w-3 h-3 mr-1" />
                            {knowledge.tags}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(knowledge);
                          }}
                          className="p-1 hover:bg-white rounded transition"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(knowledge);
                          }}
                          className="p-1 hover:bg-white rounded transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail/Edit Panel */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-6">
            {isCreating || isEditing ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {isCreating ? 'Создание записи' : 'Редактирование записи'}
                  </h2>
                  <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Введите название"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Введите категорию"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Теги (через запятую)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="тег1, тег2, тег3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Содержимое</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Введите содержимое записи"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Активна
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!formData.title || !formData.content}
                      className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-5 h-5" />
                      <span>Сохранить</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedKnowledge ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">{selectedKnowledge.title}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {selectedKnowledge.category && (
                        <div className="flex items-center">
                          <Folder className="w-4 h-4 mr-1" />
                          {selectedKnowledge.category}
                        </div>
                      )}
                      {selectedKnowledge.is_active ? (
                        <span className="flex items-center text-green-600">
                          <Check className="w-4 h-4 mr-1" />
                          Активна
                        </span>
                      ) : (
                        <span className="text-gray-400">Неактивна</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(selectedKnowledge)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Редактировать</span>
                  </button>
                </div>
                {selectedKnowledge.tags && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Tag className="w-4 h-4" />
                      <span className="font-medium">Теги:</span>
                      <span>{selectedKnowledge.tags}</span>
                    </div>
                  </div>
                )}
                <div className="prose max-w-none">
                  <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap">
                    {selectedKnowledge.content}
                  </div>
                </div>
                <div className="mt-6 text-xs text-gray-400">
                  Создано: {new Date(selectedKnowledge.created_at!).toLocaleString('ru-RU')}
                  {selectedKnowledge.updated_at && (
                    <span className="ml-4">
                      Обновлено: {new Date(selectedKnowledge.updated_at).toLocaleString('ru-RU')}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Выберите запись для просмотра</p>
                <p className="text-sm">или создайте новую</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
