
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

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const HighlightText: React.FC<{ text: string; highlight?: string }> = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) {
    return <>{text}</>;
  }

  try {
    const escapedHighlight = escapeRegExp(highlight);
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => (
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-yellow-300 text-slate-900 px-0.5 rounded-sm font-medium">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        ))}
      </>
    );
  } catch (e) {
    return <>{text}</>;
  }
};

export const AttractionCard: React.FC<Props> = ({ attraction, onClick, theme, currentTheme, searchTerm = '', isFavorite, onToggleFavorite, note, onUpdateNote }) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(note || '');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const handleNoteSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateNote) {
      setIsSavingNote(true);
      try {
        await onUpdateNote(attraction.id, tempNote);
        setIsEditingNote(false);
      } finally {
        setIsSavingNote(false);
      }
    }
  };

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempNote(note || '');
    setIsEditingNote(true);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingNote(false);
    setTempNote(note || '');
  };

  return (
    <motion.div
      layoutId={`card-${attraction.id}`}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={() => onClick(attraction)}
      className={`group cursor-pointer ${currentTheme.cardBg} rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border ${currentTheme.border} h-full flex flex-col relative`}
    >
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        <img
          src={attraction.imageUrl}
          alt={attraction.name}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 blur-sm transition-all duration-300"
          loading="lazy"
          onLoad={(e) => (e.target as HTMLImageElement).classList.remove('blur-sm')}
        />
        
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => onToggleFavorite(e, attraction.id)}
            className="absolute top-3 right-3 z-10 bg-black/20 hover:bg-black/40 backdrop-blur-md p-2 rounded-full text-white transition-all transform hover:scale-110 active:scale-95"
          >
            <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
        )}

        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-1 text-xs font-bold text-amber-500 shadow-sm">
          <Star className="w-3 h-3 fill-amber-500" />
          {attraction.rating}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
          <h3 className="text-white font-bold text-base sm:text-lg truncate">
            <HighlightText text={attraction.name} highlight={searchTerm} />
          </h3>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className={`flex items-center gap-1 ${currentTheme.primaryText} text-xs sm:text-sm mb-2 font-medium`}>
          <MapPin className="w-3 h-3" />
          <HighlightText text={attraction.province} highlight={searchTerm} />
        </div>
        <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm sm:text-base line-clamp-3 leading-relaxed mb-4 flex-grow`}>
          <HighlightText text={attraction.description} highlight={searchTerm} />
        </p>
        
        <div className="flex flex-wrap gap-2 mt-auto mb-3">
          {attraction.tags.map((tag) => (
            <span key={tag} className={`text-[10px] sm:text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-slate-400 bg-slate-50 border-slate-100'} px-2 py-1 rounded-full border`}>
              <HighlightText text={tag} highlight={searchTerm} />
            </span>
          ))}
        </div>

        {onUpdateNote && isFavorite && (
          <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`} onClick={e => e.stopPropagation()}>
            {isEditingNote ? (
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <input 
                    autoFocus
                    disabled={isSavingNote}
                    type="text" 
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    placeholder="添加备注..."
                    className={`w-full text-sm px-2 py-1.5 rounded-md border outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'} disabled:opacity-50`}
                  />
                  {isSavingNote && <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-2.5 text-teal-500" />}
                </div>
                {!isSavingNote && (
                  <div className="flex justify-end gap-2">
                    <button onClick={cancelEditing} className="p-1 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={handleNoteSubmit} className="p-1 text-teal-500 hover:text-teal-600">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div 
                onClick={startEditing}
                className={`group/note flex items-start gap-2 p-2 rounded-lg cursor-text transition-colors ${theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}
              >
                <FileText className={`w-3 h-3 mt-1 flex-shrink-0 ${note ? 'text-teal-500' : 'text-slate-300'}`} />
                <span className={`text-xs ${note ? (theme === 'dark' ? 'text-slate-300' : 'text-slate-600') : 'text-slate-400 italic'}`}>
                  {note || '添加备注...'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
