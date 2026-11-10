'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Bell, Shield } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Fetch live unread incident count
    fetch('/api/security')
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          const pending = d.data.filter((i: any) => i.adminStatus === 'PENDING').length;
          setUnreadCount(pending);
        }
      })
      .catch(() => {});

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-charcoal-900/90 backdrop-blur-md border-b border-charcoal-800 px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile trigger & context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          className="p-2 rounded-lg bg-charcoal-800 text-charcoal-300 hover:text-white hover:bg-charcoal-700 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-srjgreen-500 animate-pulse"></span>
          <span className="text-xs text-charcoal-300 font-medium">
            Pemantauan Otomatis Aktif
          </span>
          <span className="text-charcoal-600 font-mono">|</span>
          <span className="text-xs font-mono text-srjgold-400 font-medium">
            SUNDA RANTAU JOGJA (SRJ)
          </span>
        </div>
      </div>

      {/* Right: Clock & Admin identity */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-charcoal-850 border border-charcoal-750">
          <span className="text-[11px] text-charcoal-400">Yogyakarta:</span>
          <span className="text-xs font-mono font-medium text-charcoal-200">{timeStr}</span>
        </div>

        {/* Admin Notification Bell */}
        <div className="relative">
          <button 
            className="p-2 rounded-xl bg-charcoal-800 text-charcoal-300 hover:text-white hover:bg-charcoal-750 transition"
            title={unreadCount > 0 ? `${unreadCount} Laporan Menunggu Ditinjau` : 'Tidak Ada Laporan Baru'}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-charcoal-900 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Current Admin Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-charcoal-800">
          <div className="w-8 h-8 rounded-full bg-srjgreen-900/60 border border-srjgreen-500/40 flex items-center justify-center text-srjgreen-300 text-xs font-bold font-mono">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white leading-tight">Admin Utama</p>
            <p className="text-[10px] text-srjgold-400 font-medium">Paguyuban SRJ</p>
          </div>
        </div>
      </div>
    </header>
  );
};
