import React, { useState, useEffect } from 'react';
import { Attraction } from '../types';
import { X, Save, Trash2, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
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
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-8 py-5 border-b dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <LayoutTemplate className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-xl font-bold dark:text-white">
                {initialData ? '编辑景点' : '新增景点'}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
            {/* Left Column: Form */}
            <div className="w-full md:w-1/2 p-8 overflow-y-auto border-r dark:border-slate-800">
              <form id="attractionForm" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">景点名称</label>
                  <input
                    required
                    placeholder="例如：清明上河园"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">所属省份</label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white appearance-none focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                        value={formData.province}
                        onChange={e => setFormData({...formData, province: e.target.value})}
                      >
                        {["河南", "北京", "四川", "云南", "陕西", "浙江", "江苏", "广东", "湖南", "新疆", "上海", "西藏"].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">评分 (0-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      value={formData.rating}
                      onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">图片链接</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      required
                      placeholder="https://..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      value={formData.imageUrl}
                      onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">支持 JPG, PNG, WebP 格式链接</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">景点描述</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="请详细描述该景点的历史文化、特色亮点..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">标签</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                    placeholder="使用逗号分隔，例如：历史, 5A景区, 摄影"
                  />
                </div>
              </form>
            </div>

            {/* Right Column: Preview */}
            <div className="hidden md:flex w-1/2 bg-slate-50 dark:bg-slate-800/50 p-8 flex-col items-center justify-center relative">
              <div className="absolute top-8 left-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Real-time Preview
              </div>
              
              <div className="w-full max-w-sm">
                 <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
                    <div className="h-48 w-full bg-slate-200 dark:bg-slate-700 relative">
                       {formData.imageUrl ? (
                         <img 
                           src={formData.imageUrl} 
                           alt="Preview" 
                           className="w-full h-full object-cover"
                           onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL'}
                         />
                       ) : (
                         <div className="flex items-center justify-center h-full text-slate-400">
                           <ImageIcon className="w-12 h-12 opacity-50" />
                         </div>
                       )}
                       <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-amber-500 shadow-sm flex items-center gap-1">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                          {formData.rating}
                       </div>
                    </div>
                    <div className="p-4">
                       <div className="text-xs font-medium text-teal-600 mb-2 flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          {formData.province}
                       </div>
                       <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2 line-clamp-1">
                         {formData.name || '景点名称'}
                       </h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                         {formData.description || '景点描述内容将显示在这里...'}
                       </p>
                       <div className="flex flex-wrap gap-2">
                          {formData.tags.split(',').filter(Boolean).map((t, i) => (
                             <span key={i} className="text-[10px] uppercase px-2 py-1 rounded-full border border-slate-100 dark:border-slate-700 text-slate-400">
                               {t}
                             </span>
                          ))}
                          {!formData.tags && <span className="text-[10px] text-slate-300">#TAGS</span>}
                       </div>
                    </div>
                 </div>
              </div>
              <p className="mt-8 text-sm text-slate-400 text-center max-w-xs">
                预览效果仅供参考，实际显示可能因屏幕尺寸而异。
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-5 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center z-10">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                className="px-5 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-2 transition-colors font-medium text-sm"
              >
                <Trash2 className="w-4 h-4" /> 删除此景点
              </button>
            ) : <div></div>}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl dark:text-slate-300 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                form="attractionForm"
                className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-teal-500/30 flex items-center gap-2 font-bold text-sm transition-all transform hover:-translate-y-0.5"
              >
                <Save className="w-4 h-4" /> {initialData ? '保存更改' : '确认发布'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};