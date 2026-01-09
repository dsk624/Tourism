
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Compass, MoreHorizontal } from 'lucide-react';

export const WeChatOverlay: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[10000] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-start pt-20 px-6 text-center text-white"
    >
      {/* 右上角箭头指引 */}
      <div className="absolute top-4 right-8 flex flex-col items-end">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowUpRight className="w-12 h-12 text-teal-400" />
        </motion.div>
      </div>

      <div className="max-w-xs mx-auto space-y-8 mt-10">
        <div className="flex justify-center gap-4 mb-4">
           <div className="p-4 bg-white/10 rounded-2xl border border-white/20 shadow-xl">
             <MoreHorizontal className="w-8 h-8 text-white" />
           </div>
           <div className="flex items-center text-teal-500 font-black">
             <ArrowUpRight className="w-6 h-6" />
           </div>
           <div className="p-4 bg-teal-500 rounded-2xl shadow-xl shadow-teal-500/30">
             <Compass className="w-8 h-8 text-white" />
           </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black tracking-tight">请在浏览器中打开</h2>
          <p className="text-slate-300 text-sm leading-relaxed font-medium">
            为了获得更流畅的浏览体验及完整的地图交互功能，请点击右上角 <span className="text-teal-400">“三个点”</span> 菜单，选择 <span className="text-teal-400">“在浏览器中打开”</span>。
          </p>
        </div>

        <div className="pt-8 flex flex-col items-center">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">华夏游 · Digital Experience</p>
           <div className="w-12 h-1 bg-teal-500/30 rounded-full mt-4" />
        </div>
      </div>
    </motion.div>
  );
};
