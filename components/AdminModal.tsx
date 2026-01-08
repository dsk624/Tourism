
import React, { useState, useEffect } from 'react';
import { Attraction } from '../types';
import { X, Save, Trash2, Image as ImageIcon, LayoutTemplate, MapPin, Loader2, ChevronDown, Bell, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, Notification } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: Attraction | null;
}

export const AdminModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, onDelete, initialData }) => {
  const [activeTab, setActiveTab] = useState<'attraction' | 'notification'>('attraction');
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

  const [notifList, setNotifList] = useState<Notification[]>([]);
  const [newNotifContent, setNewNotifContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNotifs = async () => {
    try {
      const data = await api.notifications.getAll();
      setNotifList(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'notification') {
      fetchNotifs();
    }
  }, [isOpen, activeTab]);

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

  const handleAddNotif = async () => {
    if (!newNotifContent.trim()) return;
    setIsSubmitting(true);
    try {
      await api.notifications.create({ content: newNotifContent });
      setNewNotifContent('');
      fetchNotifs();
    } catch (e) { alert('发布失败'); }
    finally { setIsSubmitting(false); }
  };

  const toggleNotif = async (notif: Notification) => {
    try {
      await api.notifications.update(notif.id, { 
        is_active: notif.is_active === 1 ? 0 : 1,
        priority: notif.priority
      });
      fetchNotifs();
    } catch (e) { alert('操作失败'); }
  };

  const deleteNotif = async (id: number) => {
    if (!confirm('确定删除此通知？')) return;
    try {
      await api.notifications.delete(id);
      fetchNotifs();
    } catch (e) { alert('删除失败'); }
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
          className="relative bg-white dark:bg-slate-900 w-full max-w-5xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] border dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 sm:px-8 py-4 sm:py-5 border-b dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setActiveTab('attraction')}
                className={`flex items-center gap-2 pb-2 border-b-2 transition-all font-black text-sm sm:text-lg ${activeTab === 'attraction' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400'}`}
              >
                <LayoutTemplate className="w-5 h-5" />
                {initialData ? '编辑景点' : '新增景点'}
              </button>
              <button 
                onClick={() => setActiveTab('notification')}
                className={`flex items-center gap-2 pb-2 border-b-2 transition-all font-black text-sm sm:text-lg ${activeTab === 'notification' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400'}`}
              >
                <Bell className="w-5 h-5" />
                通知公告管理
              </button>
            </div>
            <button 
              onClick={onClose} 
              disabled={isDisabled}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col flex-grow overflow-hidden">
            {activeTab === 'attraction' ? (
              <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                {/* Attraction Form Logic (保持原有) */}
                <div className="w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto no-scrollbar border-r dark:border-slate-800">
                  <form id="attractionForm" onSubmit={handleSubmit} className={`space-y-5 sm:space-y-6 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">景点名称</label>
                      <input required disabled={isDisabled} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                       <div>
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">省份</label>
                        <select className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-sm font-bold" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})}>
                          {["河南", "北京", "四川", "云南", "陕西", "浙江", "江苏", "广东", "湖南", "新疆", "上海", "西藏"].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">评分</label>
                        <input type="number" step="0.1" className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white" value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">图片链接</label>
                      <input required className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">描述</label>
                      <textarea required rows={4} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                  </form>
                </div>
                <div className="hidden md:flex w-1/2 bg-slate-50 dark:bg-slate-800/80 p-8 flex-col items-center justify-center relative">
                   {/* Preview (保持原有) */}
                   <div className="w-full max-w-sm">
                      <div className="bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
                         <div className="h-48 w-full bg-slate-200 dark:bg-slate-700">
                            {formData.imageUrl && <img src={formData.imageUrl} className="w-full h-full object-cover" />}
                         </div>
                         <div className="p-6">
                            <h3 className="font-black text-lg dark:text-white">{formData.name || '景点名称'}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-2">{formData.description || '描述...'}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 overflow-y-auto space-y-8 no-scrollbar">
                {/* Notification Management Form */}
                <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-3xl border border-teal-100 dark:border-teal-800">
                  <h4 className="font-black text-slate-800 dark:text-white mb-4">发布新通知</h4>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                      className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white font-bold"
                      placeholder="输入通知内容，如：五一长假景区开放时间调整..."
                      value={newNotifContent}
                      onChange={(e) => setNewNotifContent(e.target.value)}
                    />
                    <button 
                      onClick={handleAddNotif}
                      disabled={isSubmitting || !newNotifContent.trim()}
                      className="px-8 py-3 bg-teal-500 text-white rounded-2xl font-black disabled:opacity-50 transition-all hover:bg-teal-600 active:scale-95"
                    >
                      发布通知
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-black text-slate-800 dark:text-white">通知列表</h4>
                  <div className="grid gap-3">
                    {notifList.map(n => (
                      <div key={n.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${n.is_active ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                            {n.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className={`font-bold ${n.is_active ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500 line-through'}`}>{n.content}</p>
                            <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleNotif(n)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-teal-500">
                            {n.is_active ? '下架' : '上架'}
                          </button>
                          <button onClick={() => deleteNotif(n.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl text-red-500">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {notifList.length === 0 && <div className="text-center py-20 text-slate-400">暂无通知记录</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {activeTab === 'attraction' && (
            <div className="px-6 sm:px-8 py-5 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center z-10">
              {initialData && onDelete ? (
                <button type="button" disabled={isDisabled} onClick={handleDelete} className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl transition-all sm:px-5 sm:flex sm:items-center sm:gap-2">
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />} 
                  <span className="hidden sm:inline font-bold text-sm">删除景点</span>
                </button>
              ) : <div />}
              
              <div className="flex gap-3">
                <button type="button" onClick={onClose} disabled={isDisabled} className="px-5 sm:px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-2xl dark:text-slate-300 dark:hover:bg-slate-800 font-bold text-sm transition-colors">取消</button>
                <button type="submit" form="attractionForm" disabled={isDisabled} className="px-6 sm:px-8 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-2xl hover:shadow-lg hover:shadow-teal-500/30 flex items-center gap-2 font-black text-sm transition-all active:scale-95">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {initialData ? '保存' : '确认发布'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
