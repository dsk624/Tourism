import React, { useState, useEffect } from 'react';
import { Attraction } from '../types';
import { X, Save, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: Attraction | null;
}

export const AdminModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, onDelete, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    province: '河南',
    description: '',
    imageUrl: '',
    tags: '',
    rating: 5.0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        province: initialData.province,
        description: initialData.description,
        imageUrl: initialData.imageUrl,
        tags: initialData.tags.join(', '),
        rating: initialData.rating
      });
    } else {
      setFormData({
        name: '',
        province: '河南',
        description: '',
        imageUrl: '',
        tags: '',
        rating: 5.0
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold dark:text-white">
              {initialData ? '编辑景点' : '新增景点'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
              <X className="w-5 h-5 dark:text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">名称</label>
                <input
                  required
                  className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">省份</label>
                <select
                  className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={formData.province}
                  onChange={e => setFormData({...formData, province: e.target.value})}
                >
                  {["河南", "北京", "四川", "云南", "陕西", "浙江", "江苏", "广东", "湖南", "新疆"].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">图片链接</label>
              <input
                required
                className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={formData.imageUrl}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">描述</label>
              <textarea
                required
                rows={4}
                className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">标签 (逗号分隔)</label>
                <input
                  className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  placeholder="如: 历史, 5A景区"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">评分 (0-5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={formData.rating}
                  onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-slate-700">
              {initialData && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(initialData.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 mr-auto"
                >
                  <Trash2 className="w-4 h-4" /> 删除
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> 保存
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};