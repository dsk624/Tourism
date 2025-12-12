import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center overflow-hidden border border-slate-100 dark:border-slate-700"
        >
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-teal-400 to-emerald-600 opacity-10" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-white/50 dark:bg-slate-900/50 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10">
            <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-lg">
              <MessageCircle className="w-10 h-10 text-teal-600 dark:text-teal-400" />
            </div>

            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">联系作者</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
              扫描下方二维码添加微信<br/>交流技术或反馈建议
            </p>

            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100 dark:border-slate-700 inline-block mb-4">
              {/* 这里使用Picsum作为占位符，您可以替换为您真实的微信二维码图片URL */}
              <img 
                src="https://picsum.photos/200/200?random=qr" 
                alt="WeChat QR Code" 
                className="w-48 h-48 rounded-lg object-cover"
              />
            </div>
            
            <p className="text-xs text-slate-400">微信号: ChinaTravel_Admin</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
