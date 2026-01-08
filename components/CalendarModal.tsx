
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Plus, Trash2, Loader2, Bookmark } from 'lucide-react';
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-white dark:border-slate-800"
        >
          {/* Header */}
          <div className="px-8 py-6 flex items-center justify-between bg-teal-500/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-500 rounded-2xl text-white">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight dark:text-white">旅程记事</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400 dark:text-slate-200" />
            </button>
          </div>

          <div className="p-8 overflow-y-auto flex-grow no-scrollbar">
            {!isAuthenticated ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-300">请先登录以保存您的旅程日程</div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">我的安排</span>
                  <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-500/20"
                  >
                    {showAddForm ? '取消' : <><Plus className="w-3 h-3" /> 添加备注</>}
                  </button>
                </div>

                <AnimatePresence>
                  {showAddForm && (
                    <motion.form 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={handleAdd}
                      className="bg-slate-50 dark:bg-slate-800/80 p-6 rounded-2xl space-y-4 overflow-hidden border border-slate-100 dark:border-slate-700"
                    >
                      <input 
                        required
                        className="w-full bg-white dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        placeholder="目的地 / 标题"
                        value={newSchedule.title}
                        onChange={e => setNewSchedule({...newSchedule, title: e.target.value})}
                      />
                      <input 
                        required
                        type="date"
                        className="w-full bg-white dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 dark:text-white"
                        value={newSchedule.schedule_date}
                        onChange={e => setNewSchedule({...newSchedule, schedule_date: e.target.value})}
                      />
                      <textarea 
                        className="w-full bg-white dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        placeholder="备注信息 (可选)"
                        rows={2}
                        value={newSchedule.description}
                        onChange={e => setNewSchedule({...newSchedule, description: e.target.value})}
                      />
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-3 bg-teal-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                      >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />} 保存计划
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  {schedules.map(s => (
                    <div key={s.id} className="group p-5 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-teal-500/30 transition-all flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="text-center bg-teal-50 dark:bg-teal-900/60 px-3 py-1.5 rounded-xl border border-teal-100 dark:border-teal-800">
                          <div className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase leading-none mb-1">{s.schedule_date.split('-')[1]}月</div>
                          <div className="text-lg font-black leading-none dark:text-white">{s.schedule_date.split('-')[2]}</div>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm dark:text-white">{s.title}</h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-300 mt-0.5">{s.description || '暂无详细描述'}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-300 dark:text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {schedules.length === 0 && !isLoading && (
                    <div className="py-12 text-center opacity-30 italic text-sm text-slate-500 dark:text-slate-300">暂无旅程安排</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
