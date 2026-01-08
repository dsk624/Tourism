
import React, { useState } from 'react';
import { Attraction } from '../types';
import { MapPin, Star, Heart, FileText, Check, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeConfig {
  primary: string;
  primaryText: string;
  text: string;
  bg: string;
  cardBg: string;
  border: string;
}

interface Props {
  attraction: Attraction;
  onClick: (attraction: Attraction) => void;
  theme: 'light' | 'dark' | 'teal';
  currentTheme: ThemeConfig;
  searchTerm?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent | null, id: string) => void;
  note?: string;
  onUpdateNote?: (id: string, note: string) => Promise<void>;
}

export const AttractionCard: React.FC<Props> = ({ attraction, onClick, theme, currentTheme, searchTerm = '', isFavorite, onToggleFavorite, note, onUpdateNote }) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(note || '');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onClick={() => onClick(attraction)}
      className={`group cursor-pointer ${currentTheme.cardBg} rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border ${currentTheme.border} h-full flex flex-col relative`}
    >
      <div className="relative h-56 overflow-hidden flex-shrink-0">
        <img
          src={attraction.imageUrl}
          alt={attraction.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => onToggleFavorite(e, attraction.id)}
            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all transform hover:scale-110"
          >
            <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
        )}

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-1 text-[10px] font-black text-amber-500 shadow-sm">
          <Star className="w-3 h-3 fill-amber-500" />
          {attraction.rating}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <h3 className="text-white font-black text-xl truncate">{attraction.name}</h3>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className={`flex items-center gap-1 ${currentTheme.primaryText} text-xs mb-3 font-bold uppercase tracking-widest`}>
          <MapPin className="w-3 h-3" />
          {attraction.province}
        </div>
        <p className={`${isDark ? 'text-slate-200' : 'text-slate-500'} text-sm line-clamp-2 leading-relaxed mb-4 flex-grow font-medium`}>
          {attraction.description}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {attraction.tags.slice(0, 3).map((tag) => (
            <span key={tag} className={`text-[10px] font-bold ${isDark ? 'text-teal-300 bg-teal-500/20' : 'text-slate-400 bg-slate-400/10'} px-2 py-1 rounded-lg transition-colors`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
