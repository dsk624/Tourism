
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
      <div className="fixed inset-0 z-[110] overflow-y-auto overflow-x-hidden flex items-start sm:items-center justify-center p-0 sm:p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-lg"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 40 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-screen sm:h-auto sm:max-h-[90vh] border border-white/20 dark:border-slate-800 z-10 my-0 sm:my-auto"
        >
          {/* Header - 保持在顶部 */}
          <div className="px-6 sm:px-8 py-6 sm:py-8 flex items-center justify-between border-b dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight dark:text-white">我的旅程日程</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Travel Itinerary</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 sm:p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content - 独立滚动区域 */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-grow no-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
            {!isAuthenticated ? (
              <div className="text-center py-16 sm:py-20">
                <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <p className="text-slate-400 dark:text-slate-500 font-bold">请先登录以同步您的云端日程</p>
              </div>
            ) : (
              <div className="space-y-8 sm:space-y-10">
                <div className="flex justify-between items-center">
                   <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                     <AlignLeft className="w-4 h-4 text-teal-500" /> 全部计划 ({schedules.length})
                   </h3>
                   <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl text-[10px] sm:text-xs font-black transition-all ${showAddForm ? 'bg-slate-200 dark:bg-slate-800 text-slate-600' : 'bg-teal-500 text-white shadow-xl shadow-teal-500/20 active:scale-95'}`}
                  >
                    {showAddForm ? '取消' : <><Plus className="w-4 h-4" /> 新增安排</>}
                  </button>
                </div>

                <AnimatePresence>
                  {showAddForm && (
                    <motion.form 
                      initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginBottom: 40 }}
                      exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                      onSubmit={handleAdd}
                      className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 space-y-4 sm:space-y-5 overflow-hidden"
                    >
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">目的地或活动</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
                          <input required className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl pl-11 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-teal-500 dark:text-white" placeholder="例如：清明上河园演出" value={newSchedule.title} onChange={e => setNewSchedule({...newSchedule, title: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">计划日期</label>
                        <input required type="date" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-teal-500 dark:text-white" value={newSchedule.schedule_date} onChange={e => setNewSchedule({...newSchedule, schedule_date: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">备注说明</label>
                        <textarea className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-teal-500 dark:text-white min-h-[60px] sm:min-h-[80px]" placeholder="记录一些细节..." value={newSchedule.description} onChange={e => setNewSchedule({...newSchedule, description: e.target.value})} />
                      </div>
                      <button type="submit" disabled={isLoading} className="w-full py-3.5 sm:py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/20 active:scale-95">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '保存'}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="relative space-y-6">
                  {/* Timeline Line */}
                  {schedules.length > 0 && <div className="absolute left-[31px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800" />}

                  {schedules.map((s, idx) => {
                    const dateArr = s.schedule_date.split('-');
                    return (
                      <motion.div 
                        key={s.id} 
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: idx * 0.1 }}
                        className="relative pl-16 group"
                      >
                        <div className="absolute left-[27px] top-2 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900 z-10 transition-transform group-hover:scale-150" />
                        
                        <div className="absolute left-0 top-0 text-center w-12">
                          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase leading-none mb-1">{parseInt(dateArr[1])}月</div>
                          <div className="text-xl font-black text-slate-800 dark:text-white leading-none">{dateArr[2]}</div>
                        </div>

                        <div className="bg-white dark:bg-slate-800/40 p-4 sm:p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 hover:border-teal-500/30 transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-4">
                            <h4 className="font-black text-sm sm:text-base dark:text-white flex items-center gap-2 truncate">
                              {s.title}
                              <ChevronRight className="w-3 h-3 text-teal-500/40" />
                            </h4>
                            {s.description && <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">{s.description}</p>}
                          </div>
                          <button 
                            onClick={() => handleDelete(s.id)} 
                            className="p-1.5 sm:p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}

                  {schedules.length === 0 && !isLoading && !showAddForm && (
                    <div className="py-16 sm:py-20 text-center">
                       <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                         <CalendarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 dark:text-slate-700" />
                       </div>
                       <p className="text-slate-400 font-bold text-sm sm:text-base">还没有任何行程安排</p>
                       <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-2">Start your adventure today</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer - 保持在底部 */}
          <div className="px-6 sm:px-8 py-4 sm:py-5 bg-slate-100/50 dark:bg-slate-800/20 text-center border-t dark:border-slate-800 flex-shrink-0">
             <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
               每一段旅程都值得被记录 · 华夏游
             </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
