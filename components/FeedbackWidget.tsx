import React, { useState } from 'react';
import { MessageSquarePlus, X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Feedback error:', error);
      alert('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-[rgb(13,148,136)]/20 border border-[rgb(13,148,136)]/20 p-4 w-full max-w-[320px] sm:w-72 mb-4 pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800 dark:text-white">意见反馈</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-lg"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-[rgb(13,148,136)]">
                <CheckCircle2 className="w-12 h-12 mb-2" />
                <span className="font-medium">感谢您的反馈！</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-[rgb(13,148,136)]/30 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(13,148,136)]/20 focus:border-[rgb(13,148,136)] transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-white"
                  rows={4}
                  placeholder="您对网站有什么建议？"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="mt-3 w-full bg-[rgb(13,148,136)] hover:bg-[rgb(10,130,120)] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:shadow-[rgb(13,148,136)]/20"
                  style={{ minHeight: '44px' }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      提交反馈
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-[rgb(13,148,136)] hover:bg-[rgb(10,130,120)] text-white p-4 rounded-full shadow-lg shadow-[rgb(13,148,136)]/30 transition-all"
        whileHover={{ scale: 1.1, rotate: 12 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <MessageSquarePlus className="w-6 h-6" />
      </motion.button>
    </div>
  );
};