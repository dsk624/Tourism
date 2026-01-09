
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Plus, Trash2, Loader2, MapPin, AlignLeft, ChevronRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { Schedule } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}

export const CalendarModal: React.FC<Props> = ({ isOpen, onClose, isAuthenticated }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ title: '', schedule_date: '', description: '' });

  const fetchSchedules = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await api.schedules.getAll();
      setSchedules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) fetchSchedules();
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isAuthenticated]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.title || !newSchedule.schedule_date) return;
    setIsLoading(true);
    try {
      await api.schedules.create(newSchedule);
      setShowAddForm(false);
      setNewSchedule({ title: '', schedule_date: '', description: '' });
      fetchSchedules();
    } catch (e) {
      alert('添加失败，请登录重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此旅程备注？')) return;
    try {
      await api.schedules.delete(id);
      fetchSchedules();
    } catch (e) {
      alert('删除失败');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] overflow-y-auto no-scrollbar py-10 sm:py-20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[calc(100dvh-5rem)] border border-white/20 dark:border-slate-800 z-10"
        >
          {/* 1. 固定头部 */}
          <div className="px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between border-b dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight dark:text-white">旅行日程</h2>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none mt-1">Travel Plan</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 2. 滚动主体 */}
          <div className="flex-grow overflow-y-auto p-6 sm:p-8 no-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
            {!isAuthenticated ? (
              <div className="text-center py-20">
                <Sparkles className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 dark:text-slate-500 font-bold">请先登录以查看您的云端日程</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                     <AlignLeft className="w-4 h-4 text-teal-500" /> 全部计划 ({schedules.length})
                   </h3>
                   <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black transition-all ${showAddForm ? 'bg-slate-200 dark:bg-slate-800 text-slate-600' : 'bg-teal-500 text-white shadow-xl shadow-teal-500/20 active:scale-95'}`}
                  >
                    {showAddForm ? '取消' : <><Plus className="w-4 h-4" /> 新增计划</>}
                  </button>
                </div>

                <AnimatePresence>
                  {showAddForm && (
                    <motion.form 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={handleAdd}
                      className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700 space-y-4 overflow-hidden mb-6"
                    >
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest mb-2 px-1">目的地/活动</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
                          <input required className="w-full bg-slate-100 dark:bg-slate-950 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" placeholder="要去哪里？" value={newSchedule.title} onChange={e => setNewSchedule({...newSchedule, title: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest mb-2 px-1">日期</label>
                          <input required type="date" className="w-full bg-slate-100 dark:bg-slate-950 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white" value={newSchedule.schedule_date} onChange={e => setNewSchedule({...newSchedule, schedule_date: e.target.value})} />
                        </div>
                      </div>
                      <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-black text-sm transition-all shadow-md shadow-teal-500/20 active:scale-[0.98]">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '立即保存'}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="relative space-y-6 pb-4">
                  {schedules.length > 0 && <div className="absolute left-[24px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800" />}
                  {schedules.map((s, idx) => {
                    const dateArr = s.schedule_date.split('-');
                    return (
                      <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="relative pl-12">
                        <div className="absolute left-[20px] top-1.5 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900 z-10 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                        <div className="absolute left-0 top-0 text-center w-10">
                          <div className="text-[10px] font-black text-slate-400 dark:text-teal-400/80 leading-none mb-0.5">{parseInt(dateArr[1])}月</div>
                          <div className="text-base font-black text-slate-800 dark:text-white leading-none">{dateArr[2]}</div>
                        </div>
                        {/* 优化卡片背景与边框颜色 */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group hover:border-teal-500/30 transition-all shadow-sm">
                          <div className="flex-1 min-w-0 pr-2">
                            {/* 明确定义标题颜色：亮色为深，暗色为白 */}
                            <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                              {s.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-bold">
                              {s.schedule_date}
                            </p>
                          </div>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-300 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                  {schedules.length === 0 && !showAddForm && (
                     <div className="text-center py-10 opacity-30 dark:opacity-20 italic text-sm dark:text-white">暂无行程计划</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. 固定底部 */}
          <div className="px-6 py-4 bg-slate-100/50 dark:bg-slate-800/20 text-center border-t dark:border-slate-800 flex-shrink-0">
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">华夏游 · 记录每一刻精彩</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
