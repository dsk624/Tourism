import React, { useState } from 'react';
import { MessageSquarePlus, X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setContent('');
        setTimeout(() => {
          setIsSuccess(false);
          setIsOpen(false);
        }, 2000);
      } else {
        alert('提交失败，请稍后重试');
      }
    } catch (error) {
      console.error('Feedback error:', error);
      alert('网络错误，请稍后重试');
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
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-72 mb-4 pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800">意见反馈</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-teal-600 animate-in fade-in">
                <CheckCircle2 className="w-10 h-10 mb-2" />
                <span className="font-medium">感谢您的反馈！</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none placeholder-slate-400"
                  rows={4}
                  placeholder="您对网站有什么建议？"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="mt-3 w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl py-2 text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      提交反馈
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-lg shadow-teal-600/30 transition-all transform hover:scale-110 active:scale-95 group"
      >
        <MessageSquarePlus className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
};