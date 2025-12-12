
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Map, Calendar, Coffee, Plane, Loader2, Send, Bot } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AIPlannerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('3');
  const [interests, setInterests] = useState('历史文化, 地道美食');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const generatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, days, interests })
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data.content);
      } else {
        setResult('抱歉，AI 暂时无法生成计划，请检查网络配置或稍后重试。');
      }
    } catch (error) {
      setResult('网络请求失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="relative px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  DeepSeek 智能规划
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-extrabold tracking-wider border border-blue-200">V3</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">基于国产开源大模型，为您定制专属中国行</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-grow overflow-y-auto p-0 bg-slate-50 dark:bg-slate-950">
            {!result ? (
              <div className="h-full flex flex-col justify-center max-w-xl mx-auto px-6 py-8">
                 <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">您的下一站是哪里？</h3>
                    <p className="text-slate-400 text-sm">输入目的地，让 AI 为您生成详细的吃喝玩乐攻略</p>
                 </div>

                 <form onSubmit={generatePlan} className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="space-y-1.5">
                       <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                         <Map className="w-3.5 h-3.5 text-blue-500" /> 目的地
                       </label>
                       <input 
                         required
                         value={destination}
                         onChange={(e) => setDestination(e.target.value)}
                         placeholder="例如：西安、重庆、神农架..."
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white font-medium"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" /> 天数
                        </label>
                        <select 
                          value={days}
                          onChange={(e) => setDays(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-blue-500 outline-none transition-all dark:text-white appearance-none font-medium cursor-pointer"
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(d => <option key={d} value={d}>{d} 天</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <Coffee className="w-3.5 h-3.5 text-blue-500" /> 偏好
                        </label>
                        <input 
                          value={interests}
                          onChange={(e) => setInterests(e.target.value)}
                          placeholder="美食, 摄影, 徒步..."
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !destination}
                      className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin w-5 h-5" />
                          <span>正在深度思考...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" /> 
                          <span>生成行程计划</span>
                        </>
                      )}
                    </button>
                 </form>

                 <div className="mt-6">
                    <div className="flex flex-wrap justify-center gap-2 opacity-60">
                       {['成都 3天 美食', '杭州 2天 徒步', '新疆 7天 自驾'].map(ex => (
                         <button 
                           key={ex}
                           onClick={() => {
                             const [dest, d, int] = ex.split(' ');
                             setDestination(dest);
                             setDays(d.replace('天',''));
                             setInterests(int);
                           }}
                           className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
                         >
                           {ex}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
            ) : (
              <div className="animate__animated animate__fadeIn p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur py-2 z-10 border-b border-slate-200 dark:border-slate-800">
                   <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                     <Plane className="w-5 h-5 text-blue-500" />
                     {destination} · {days}日探索之旅
                   </h3>
                   <button 
                     onClick={() => setResult('')}
                     className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                   >
                     重新规划
                   </button>
                </div>
                
                {/* Result Display - Optimized for Markdown-like content */}
                <div className="prose prose-slate dark:prose-invert prose-sm sm:prose-base max-w-none 
                  prose-headings:font-bold prose-headings:text-slate-800 dark:prose-headings:text-white
                  prose-h3:text-blue-600 dark:prose-h3:text-blue-400 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                  prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-extrabold
                  prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-300
                  prose-li:text-slate-600 dark:prose-li:text-slate-300
                  bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="whitespace-pre-wrap font-sans">{result}</div>
                </div>

                <div className="mt-8 flex gap-3 sticky bottom-0 bg-slate-50 dark:bg-slate-950 pt-4 pb-2">
                   <button 
                     onClick={onClose}
                     className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                   >
                     关闭
                   </button>
                   <button 
                     onClick={() => {
                       navigator.clipboard.writeText(result);
                       alert('行程已复制到剪贴板！');
                     }}
                     className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                   >
                     <Send className="w-4 h-4" /> 复制全部行程
                   </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
