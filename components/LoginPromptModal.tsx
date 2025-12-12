import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-teal-600 dark:text-teal-400 shadow-inner rotate-3">
                <LogIn className="w-8 h-8 ml-1" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                登录开启收藏
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed px-2">
                登录后即可收藏您心仪的景点，同步您的旅行计划，随时随地开启精彩旅程。
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm"
                >
                  再逛逛
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/login');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-teal-500/20 transition-all transform hover:-translate-y-0.5 text-sm"
                >
                  立即登录
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};