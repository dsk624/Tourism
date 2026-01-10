
import React, { useState, useEffect, useRef } from 'react';
import { Attraction } from '../types';
import { X, Save, Trash2, Image as ImageIcon, LayoutTemplate, MapPin, Loader2, ChevronDown, Bell, Eye, EyeOff, Palette, SlidersHorizontal, Megaphone, List, Type } from 'lucide-react';
import { api, Notification } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: Attraction | null;
  defaultTab?: 'attraction' | 'notification' | 'settings';
}

export const AdminModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, onDelete, initialData, defaultTab = 'attraction' }) => {
  const [activeTab, setActiveTab] = useState<'attraction' | 'notification' | 'settings'>(defaultTab);
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

  const [siteSettings, setSiteSettings] = useState({
    hero_badge: 'DISCOVER THE ORIENTAL BEAUTY',
    hero_title_main: '探索',
    hero_title_highlight: '锦绣中华',
    hero_subtitle: '从古老的河南腹地出发，丈量每一寸山河。沉浸式旅行体验，带您领略千年文化的独特魅力。'
  });

  const [notifList, setNotifList] = useState<Notification[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);
  const [newNotifContent, setNewNotifContent] = useState('');
  const [newNotifColor, setNewNotifColor] = useState('#0d9488');
  const [newNotifOpacity, setNewNotifOpacity] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const colorInputRef = useRef<HTMLInputElement>(null);

  const getRGBA = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const fetchNotifs = async () => {
    setIsListLoading(true);
    try {
      const data = await api.notifications.getActive();
      // 这里获取所有通知以便管理
      const allData = await api.notifications.getAll();
      setNotifList(allData);
    } catch (e) { console.error(e); }
    finally { setIsListLoading(false); }
  };

  const fetchSettings = async () => {
    setIsListLoading(true);
    try {
      const data = await api.settings.get();
      setSiteSettings(prev => ({ ...prev, ...data }));
    } catch (e) { console.error(e); }
    finally { setIsListLoading(false); }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'notification') fetchNotifs();
      if (activeTab === 'settings') fetchSettings();
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

  const handleUpdateSettings = async () => {
    setIsSubmitting(true);
    try {
      await api.settings.update(siteSettings);
      alert('站点设置已更新');
      window.dispatchEvent(new CustomEvent('siteSettingsUpdated'));
    } catch (e) { alert('更新失败'); }
    finally { setIsSubmitting(false); }
  };

  const handleAddNotif = async () => {
    if (!newNotifContent.trim()) return;
    setIsSubmitting(true);
    try {
      const bgColor = getRGBA(newNotifColor, newNotifOpacity);
      await api.notifications.create({ content: newNotifContent, bg_color: bgColor });
      setNewNotifContent('');
      fetchNotifs();
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch (e) { alert('发布失败'); }
    finally { setIsSubmitting(false); }
  };

  const toggleNotif = async (notif: Notification) => {
    try {
      await api.notifications.update(notif.id, { 
        is_active: notif.is_active === 1 ? 0 : 1,
        priority: notif.priority,
        bg_color: notif.bg_color
      });
      fetchNotifs();
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch (e) { alert('操作失败'); }
  };

  const deleteNotif = async (id: number) => {
    if (!confirm('确定删除此通知？')) return;
    try {
      await api.notifications.delete(id);
      fetchNotifs();
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
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
      <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isDisabled ? undefined : onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-5xl h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border dark:border-slate-800 z-10"
        >
          <div className="flex justify-between items-center px-6 sm:px-8 py-4 sm:py-5 border-b dark:border-slate-800 bg-white dark:bg-slate-900 z-10 overflow-x-auto no-scrollbar flex-shrink-0">
            <div className="flex items-center gap-6 min-w-max">
              <button onClick={() => setActiveTab('attraction')} className={`flex items-center gap-2 pb-2 border-b-2 transition-all font-black text-sm sm:text-lg ${activeTab === 'attraction' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400'}`}>
                <LayoutTemplate className="w-5 h-5" />
                景点
              </button>
              <button onClick={() => setActiveTab('notification')} className={`flex items-center gap-2 pb-2 border-b-2 transition-all font-black text-sm sm:text-lg ${activeTab === 'notification' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400'}`}>
                <Bell className="w-5 h-5" />
                通知
              </button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 pb-2 border-b-2 transition-all font-black text-sm sm:text-lg ${activeTab === 'settings' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400'}`}>
                <Type className="w-5 h-5" />
                站点设置
              </button>
            </div>
            <button onClick={onClose} disabled={isDisabled} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-300 ml-4">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col flex-grow overflow-hidden min-h-0">
            {activeTab === 'attraction' ? (
              <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                <div className="w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto no-scrollbar border-r dark:border-slate-800 min-h-0">
                  <form id="attractionForm" onSubmit={handleSubmit} className={`space-y-5 sm:space-y-6 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">景点名称</label>
                      <input required disabled={isDisabled} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">省份</label>
                      <input required disabled={isDisabled} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">图片链接</label>
                      <input required disabled={isDisabled} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">标签 (逗号分隔)</label>
                      <input disabled={isDisabled} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">评分</label>
                      <input type="number" step="0.1" min="0" max="5" required disabled={isDisabled} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold" value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">纬度</label>
                        <input type="number" step="any" disabled={isDisabled} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">经度</label>
                        <input type="number" step="any" disabled={isDisabled} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">详细描述</label>
                      <textarea required disabled={isDisabled} rows={5} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div className="flex gap-4 pt-4 pb-6">
                      <button type="submit" disabled={isDisabled} className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-teal-500/20 active:scale-95">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {initialData ? '保存修改' : '立即发布'}
                      </button>
                      {initialData && onDelete && (
                        <button type="button" onClick={handleDelete} disabled={isDisabled} className="px-6 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-black transition-all">
                          {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
                <div className="hidden md:flex md:w-1/2 bg-slate-50 dark:bg-slate-800/20 items-center justify-center p-8 overflow-y-auto no-scrollbar">
                  {formData.imageUrl ? (
                    <div className="w-full max-w-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">预览效果</p>
                       <div className="rounded-[2rem] overflow-hidden shadow-2xl border dark:border-slate-700 bg-white dark:bg-slate-800">
                          <img src={formData.imageUrl} className="w-full h-48 object-cover" alt="Preview" />
                          <div className="p-6">
                             <h5 className="font-black text-lg dark:text-white mb-1">{formData.name || '景点名称'}</h5>
                             <div className="flex items-center gap-1 text-teal-600 text-[10px] font-bold uppercase mb-2">
                                <MapPin className="w-3 h-3" /> {formData.province}
                             </div>
                             <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{formData.description || '此处显示景点描述预览...'}</p>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-10 h-10 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">输入图片链接以预览</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'notification' ? (
              <div className="p-6 sm:p-8 overflow-y-auto space-y-8 no-scrollbar min-h-0 flex-grow">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700">
                  <h4 className="font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-teal-500" /> 发布新通知
                  </h4>
                  <div className="space-y-6">
                    <textarea 
                      disabled={isSubmitting}
                      rows={3}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500 transition-all shadow-sm disabled:opacity-50 resize-none"
                      placeholder="输入通知内容..."
                      value={newNotifContent}
                      onChange={(e) => setNewNotifContent(e.target.value)}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">外观配置</label>
                        </div>
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-14 h-14 rounded-2xl shadow-inner border border-white/20 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                            style={{ backgroundColor: getRGBA(newNotifColor, newNotifOpacity) }}
                            onClick={() => !isSubmitting && colorInputRef.current?.click()}
                          >
                             <Palette className="w-6 h-6 text-white drop-shadow-md" />
                             <input 
                               ref={colorInputRef}
                               type="color" 
                               className="sr-only"
                               value={newNotifColor}
                               onChange={(e) => setNewNotifColor(e.target.value)}
                             />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                              <span>透明度</span>
                              <span>{newNotifOpacity}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="10" 
                              max="100" 
                              className="w-full accent-teal-500"
                              value={newNotifOpacity}
                              onChange={(e) => setNewNotifOpacity(parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleAddNotif}
                        disabled={isSubmitting || !newNotifContent.trim()}
                        className="w-full px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-2xl font-black disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-teal-500/30 active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '发布通知'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pb-10">
                  <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <List className="w-5 h-5 text-teal-500" /> 通知列表
                  </h4>
                  <div className="grid gap-3 min-h-[100px] relative">
                    <AnimatePresence mode="wait">
                      {isListLoading ? (
                        <motion.div key="list-loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-10">
                           <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.div key="list-items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                          {notifList.map(n => (
                            <div key={n.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-start justify-between group">
                              <div className="flex items-start gap-4 flex-1">
                                <div 
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 mt-1`}
                                  style={{ backgroundColor: n.bg_color.includes('rgba') ? n.bg_color : '#0d9488' }}
                                >
                                  {n.is_active ? <Eye className="w-5 h-5 text-white" /> : <EyeOff className="w-5 h-5 text-white opacity-60" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {/* 修改此处：移除 truncate 类，添加 break-words 和 whitespace-normal，实现换行 */}
                                  <p className={`font-bold break-words whitespace-normal mb-1 leading-relaxed ${n.is_active ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500 line-through'}`}>{n.content}</p>
                                  <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0">
                                <button onClick={() => toggleNotif(n)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-teal-500 text-xs font-bold">
                                  {n.is_active ? '下架' : '上架'}
                                </button>
                                <button onClick={() => deleteNotif(n.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl text-red-500">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {notifList.length === 0 && (
                             <p className="text-center py-10 text-slate-400 italic text-sm">暂无历史通知</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 overflow-y-auto space-y-8 no-scrollbar min-h-0 flex-grow">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700">
                  <h4 className="font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Type className="w-5 h-5 text-teal-500" /> 首页文字内容配置
                  </h4>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">顶部 Slogan (Badge)</label>
                      <input disabled={isSubmitting} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold disabled:opacity-50" value={siteSettings.hero_badge} onChange={e => setSiteSettings({...siteSettings, hero_badge: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">主标题文字 (白色)</label>
                        <input disabled={isSubmitting} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold disabled:opacity-50" value={siteSettings.hero_title_main} onChange={e => setSiteSettings({...siteSettings, hero_title_main: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">标题高亮文字 (渐变色)</label>
                        <input disabled={isSubmitting} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold disabled:opacity-50" value={siteSettings.hero_title_highlight} onChange={e => setSiteSettings({...siteSettings, hero_title_highlight: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">副标题描述</label>
                      <textarea disabled={isSubmitting} rows={4} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold resize-none disabled:opacity-50" value={siteSettings.hero_subtitle} onChange={e => setSiteSettings({...siteSettings, hero_subtitle: e.target.value})} />
                    </div>
                    <button 
                      onClick={handleUpdateSettings}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-2 mb-10"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      确认修改站点文字
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
