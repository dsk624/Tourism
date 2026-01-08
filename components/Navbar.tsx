
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mountain, MessageCircle, Menu, X, Sun, Moon, Map, LogOut, Settings, User as UserIcon, ChevronDown, Bell, Volume2, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { api, Notification } from '../services/api';

interface NavbarProps {
  theme: 'light' | 'dark' | 'teal';
  setTheme: (theme: 'light' | 'dark' | 'teal') => void;
  isAuthenticated: boolean;
  currentUser: User | null;
  handleLogout: () => void;
  setIsContactModalOpen: (isOpen: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onOpenAdminNotifications?: () => void;
  onNotificationVisibilityChange?: (isVisible: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme, setTheme, isAuthenticated, currentUser, handleLogout, setIsContactModalOpen, mobileMenuOpen, setMobileMenuOpen, onOpenAdminNotifications, onNotificationVisibilityChange
}) => {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.notifications.getActive();
        setNotifications(data);
        if (data.length > 0 && !isDismissed) {
          onNotificationVisibilityChange?.(true);
        }
      } catch (e) {
        console.error('Failed to fetch notifications');
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 300000);
    return () => clearInterval(interval);
  }, [onNotificationVisibilityChange, isDismissed]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    onNotificationVisibilityChange?.(false);
  };

  const currentThemeStyles = {
    light: "bg-white/80 border-slate-200 text-slate-800",
    dark: "bg-slate-900/80 border-slate-800 text-white",
    teal: "bg-teal-50/80 border-teal-100 text-teal-900"
  }[theme];

  const isDark = theme === 'dark';
  const isAdmin = currentUser?.isAdmin;
  
  // 检查 bg_color 是否为有效的自定义颜色（rgba 或 hex），否则回退到默认 teal
  const getSafeBgColor = (notif: Notification) => {
    const val = notif.bg_color;
    if (val.startsWith('#') || val.startsWith('rgba') || val.startsWith('rgb')) {
      return val;
    }
    // 兼容旧版本的预设名称
    const colorMap: any = {
      teal: "#0d9488",
      blue: "#2563eb",
      rose: "#e11d48",
      amber: "#d97706"
    };
    return colorMap[val] || "#0d9488";
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Marquee Notification Bar */}
      <AnimatePresence>
        {notifications.length > 0 && !isDismissed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ backgroundColor: getSafeBgColor(notifications[0]) }}
            className={`text-white py-2 overflow-hidden relative group/marquee backdrop-blur-sm`}
          >
            <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 flex-shrink-0 animate-pulse" />
                {isAdmin && (
                  <button 
                    onClick={onOpenAdminNotifications}
                    className="p-1 rounded-md bg-white/20 hover:bg-white/40 transition-colors opacity-0 group-hover/marquee:opacity-100"
                    title="管理通知"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-hidden relative h-5">
                <div className="absolute whitespace-nowrap animate-marquee flex gap-20 items-center">
                  {notifications.map((n, i) => (
                    <span key={i} className="text-xs font-bold tracking-wide drop-shadow-sm">
                      {n.content}
                    </span>
                  ))}
                  {notifications.map((n, i) => (
                    <span key={`dup-${i}`} className="text-xs font-bold tracking-wide drop-shadow-sm">
                      {n.content}
                    </span>
                  ))}
                </div>
              </div>
              <button 
                onClick={handleDismiss}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="关闭通知"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ... (Navbar 其余部分保持不变) ... */}
    </div>
  );
};
