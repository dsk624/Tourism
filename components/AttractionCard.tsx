import React from 'react';
import { Attraction } from '../types';
import { MapPin, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThemeConfig {
  primary: string;
  primaryText: string;
  primaryHover: string;
  secondary: string;
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
}

export const AttractionCard: React.FC<Props> = ({ attraction, onClick, theme, currentTheme }) => {
  return (
    <motion.div
      layoutId={`card-${attraction.id}`}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={() => onClick(attraction)}
      className={`group cursor-pointer ${currentTheme.cardBg} rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border ${currentTheme.border}`}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={attraction.imageUrl}
          alt={attraction.name}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 blur-sm transition-all duration-300"
          loading="lazy"
          onLoad={(e) => (e.target as HTMLImageElement).classList.remove('blur-sm')}
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-1 text-xs font-bold text-amber-500 shadow-sm">
          <Star className="w-3 h-3 fill-amber-500" />
          {attraction.rating}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
          <h3 className="text-white font-bold text-base sm:text-lg truncate">{attraction.name}</h3>
        </div>
      </div>
      
      <div className="p-4">
        <div className={`flex items-center gap-1 ${currentTheme.primaryText} text-xs sm:text-sm mb-2 font-medium`}>
          <MapPin className="w-3 h-3" />
          {attraction.province}
        </div>
        <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm sm:text-base line-clamp-2 leading-relaxed mb-3`}>
          {attraction.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {attraction.tags.map((tag) => (
            <span key={tag} className={`text-[10px] sm:text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-slate-400 bg-slate-50 border-slate-100'} px-2 py-1 rounded-full border`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
