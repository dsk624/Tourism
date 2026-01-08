
import React, { useState, useEffect } from 'react';
import { Attraction } from '../types';
// Added ChevronDown to the imported icons from lucide-react
import { X, Save, Trash2, Image as ImageIcon, LayoutTemplate, MapPin, Loader2, ChevronDown } from 'lucide-react';
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
    rating: 5.0,
    lat: '',
    lng: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        province: initialData.province,
        description: initialData.description,
        imageUrl: initialData.imageUrl,
        tags: initialData.tags.join(', '),
        rating: initialData.rating,
        lat: initialData.coordinates?.lat?.toString() || '',
        lng: initialData.coordinates?.lng?.toString() || ''
      });
    } else {
      setFormData({
        name: '',
        province: '河南',
        description: '',
        imageUrl: '',
        tags: '',
        rating: 5.0,
        lat: '',
        lng: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const lat = parseFloat(formData.lat);
      const lng = parseFloat(formData.lng);

      await onSubmit({
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        coordinates: (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(initialData.id);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const isDisabled = isSubmitting || isDeleting;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isDisabled ? undefined : onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-5xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 sm:px-8 py-4 sm:py-5 border-b dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                <LayoutTemplate className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-black dark:text-white">
                {initialData ? '编辑景点' : '新增景点'}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              disabled={isDisabled}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
            {/* Left Column: Form */}
            <div className="w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto no-scrollbar border-r dark:border-slate-800">
              <form id="attractionForm" onSubmit={handleSubmit} className={`space-y-5 sm:space-y-6 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">景点名称</label>
                  <input
                    required
                    disabled={isDisabled}
                    placeholder="例如：清明上河园"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">所属省份</label>
                    <div className="relative">
                      <select
                        disabled={isDisabled}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white appearance-none focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold"
                        value={formData.province}
                        onChange={e => setFormData({...formData, province: e.target.value})}
                      >
                        {["河南", "北京", "四川", "云南", "陕西", "浙江", "江苏", "广东", "湖南", "新疆", "上海", "西藏"].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">评分 (0-5)</label>
                    <input
                      type="number"
                      disabled={isDisabled}
                      step="0.1"
                      min="0"
                      max="5"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold"
                      value={formData.rating}
                      onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> 纬度
                    </label>
                    <input
                      type="number"
                      disabled={isDisabled}
                      step="any"
                      placeholder="如: 34.8093"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold"
                      value={formData.lat}
                      onChange={e => setFormData({...formData, lat: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> 经度
                    </label>
                    <input
                      type="number"
                      disabled={isDisabled}
                      step="any"
                      placeholder="如: 114.3377"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold"
                      value={formData.lng}
                      onChange={e => setFormData({...formData, lng: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">图片链接</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      disabled={isDisabled}
                      placeholder="https://..."
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold"
                      value={formData.imageUrl}
                      onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">景点描述</label>
                  <textarea
                    required
                    disabled={isDisabled}
                    rows={4}
                    placeholder="详细描述..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none text-sm font-bold"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">标签</label>
                  <input
                    disabled={isDisabled}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold"
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                    placeholder="使用逗号分隔"
                  />
                </div>
              </form>
            </div>

            {/* Right Column: Preview (Hidden on small screens) */}
            <div className="hidden md:flex w-1/2 bg-slate-50 dark:bg-slate-800/50 p-8 flex-col items-center justify-center relative">
              <div className="absolute top-8 left-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                实时预览
              </div>
              
              <div className="w-full max-w-sm">
                 <div className="bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
                    <div className="h-48 w-full bg-slate-200 dark:bg-slate-700 relative">
                       {formData.imageUrl ? (
                         <img 
                           src={formData.imageUrl} 
                           alt="Preview" 
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <div className="flex items-center justify-center h-full text-slate-400">
                           <ImageIcon className="w-12 h-12 opacity-20" />
                         </div>
                       )}
                    </div>
                    <div className="p-6">
                       <h3 className="font-black text-lg text-slate-800 dark:text-white mb-2 line-clamp-1">
                         {formData.name || '景点名称'}
                       </h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                         {formData.description || '描述内容...'}
                       </p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 sm:px-8 py-5 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center z-10">
            {initialData && onDelete ? (
              <button
                type="button"
                disabled={isDisabled}
                onClick={handleDelete}
                className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all sm:px-5 sm:flex sm:items-center sm:gap-2"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />} 
                <span className="hidden sm:inline font-bold text-sm">删除景点</span>
              </button>
            ) : <div />}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isDisabled}
                className="px-5 sm:px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-2xl dark:text-slate-300 dark:hover:bg-slate-800 font-bold text-sm transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                form="attractionForm"
                disabled={isDisabled}
                className="px-6 sm:px-8 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-2xl hover:shadow-lg hover:shadow-teal-500/30 flex items-center gap-2 font-black text-sm transition-all active:scale-95"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {initialData ? '保存' : '确认发布'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
