
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquarePlus, X, Send, Loader2, CheckCircle2, List, ChevronLeft, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

interface FeedbackItem {
  content: string;
  created_at: string;
}

export const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'form' | 'list'>('form');
  const [content, setContent] = useState('');
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const widgetRef = useRef<HTMLDivElement>(null);

  const fetchFeedbacks = async (page: number) => {
    setIsLoadingList(true);
    try {
      const response = await api.feedback.getAll(page, 9);
      if (response && Array.isArray(response.data)) {
        setFeedbacks(response.data);
        setTotalPages(response.totalPages || 1);
        setCurrentPage(response.page || page);
      }
    } catch (error) {
      console.error('Fetch feedback failed:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  // 当视图切换到列表或页码改变时，获取数据
  useEffect(() => {
    if (isOpen && view === 'list') {
      fetchFeedbacks(currentPage);
    }
  }, [isOpen, view, currentPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await api.feedback.submit(content);
      setIsSuccess(true);
      setContent('');
      setTimeout(() => {
        setIsSuccess(false);
        setCurrentPage(1); // 提交后重置到第一页
        setView('list');
      }, 1500);
    } catch (error) {
      alert('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch { return '未知时间'; }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={widgetRef}
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-teal-500/10 border border-teal-500/20 w-80 sm:w-96 mb-4 pointer-events-auto flex flex-col overflow-hidden max-h-[600px]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-teal-500/5">
              <div className="flex items-center gap-2">
                {view === 'list' && (
                  <button 
                    onClick={() => setView('form')} 
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <h3 className="font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                  {view === 'form' ? '建议反馈' : '反馈广场'}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {view === 'form' && (
                  <button 
                    onClick={() => {
                      setCurrentPage(1);
                      setView('list');
                    }}
                    className="p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors"
                    title="查看列表"
                  >
                    <List className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-grow overflow-y-auto no-scrollbar p-6">
              <AnimatePresence mode="wait">
                {view === 'form' ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    {isSuccess ? (
                      <div className="flex flex-col items-center justify-center py-10 text-teal-500">
                        <CheckCircle2 className="w-16 h-16 mb-4 animate-bounce" />
                        <p className="font-black text-lg">感谢您的反馈！</p>
                        <p className="text-sm opacity-60">您的声音让我们更好</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">写下您的想法</p>
                        <textarea
                          autoFocus
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="我们该如何改进？或者分享您发现的 Bug..."
                          className="w-full h-32 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-teal-500 text-sm resize-none transition-all placeholder:text-slate-400 dark:text-white"
                          maxLength={500}
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting || !content.trim()}
                          className="w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          立即提交
                        </button>
                      </form>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {isLoadingList ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">加载中...</p>
                      </div>
                    ) : feedbacks.length > 0 ? (
                      <>
                        <div className="space-y-4">
                          {feedbacks.map((item, idx) => (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              key={idx} 
                              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 group"
                            >
                              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-3 break-words font-medium">
                                {item.content}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                <Clock className="w-3 h-3" />
                                {formatTime(item.created_at)}
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* 分页控制 */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between pt-4 pb-2">
                            <button
                              disabled={currentPage === 1 || isLoadingList}
                              onClick={() => handlePageChange(currentPage - 1)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              PAGE {currentPage} / {totalPages}
                            </span>
                            <button
                              disabled={currentPage === totalPages || isLoadingList}
                              onClick={() => handlePageChange(currentPage + 1)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-20 opacity-30 italic text-sm text-slate-500">暂无反馈记录</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest border-t border-teal-500/5">
              人人参与 · 共建华夏游
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto w-14 h-14 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl shadow-2xl shadow-teal-500/30 flex items-center justify-center transition-all transform hover:scale-110 hover:-rotate-6 active:scale-95 group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}>
              <MessageSquarePlus className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        )}
      </button>
    </div>
  );
};
