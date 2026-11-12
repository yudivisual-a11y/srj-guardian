'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Bell, Shield, Radio, Activity, Smartphone, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [botConnected, setBotConnected] = useState<boolean>(false);
  const [botPhone, setBotPhone] = useState<string>('+6285780459052');

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

    // Fetch live status
    const fetchStatus = () => {
      Promise.all([
        fetch('/api/security').then(r => r.json()).catch(() => ({})),
        fetch('/api/whatsapp').then(r => r.json()).catch(() => ({}))
      ]).then(([sec, wa]) => {
        if (sec.data) {
          const pending = sec.data.filter((i: any) => i.adminStatus === 'PENDING').length;
          setUnreadCount(pending);
        }
        if (wa.data) {
          setBotConnected(wa.data.status === 'CONNECTED');
          if (wa.data.phoneNumber) {
            setBotPhone('+' + wa.data.phoneNumber.replace(/[^0-9]/g, ''));
          }
        }
      });
    };

    fetchStatus();
    const pollInterval = setInterval(fetchStatus, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-charcoal-900/90 backdrop-blur-xl border-b border-charcoal-800/80 px-4 lg:px-8 flex items-center justify-between shadow-lg shadow-black/20">
      {/* Left: Mobile trigger & SOC Telemetry */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          className="p-2 rounded-xl bg-charcoal-800 text-charcoal-300 hover:text-white hover:bg-charcoal-750 lg:hidden border border-charcoal-700/50 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* SOC Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-charcoal-950 border border-srjgreen-500/30 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-srjgreen-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-srjgreen-500"></span>
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wider text-srjgreen-400">
              SOC SECURE
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-charcoal-700 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-charcoal-300 font-medium tracking-wide">
              AI SIBER & MODERASI
            </span>
            <span className="text-charcoal-700 font-mono text-xs">/</span>
            <span className="text-[11px] font-mono text-srjgold-400 font-semibold px-2 py-0.5 rounded bg-srjgold-500/10 border border-srjgold-500/20">
              SRJ PUSAT JOGJA
            </span>
          </div>
        </div>
      </div>

      {/* Right: Bot Pill, Real-time Clock & Admin Identity */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* WhatsApp Bot Live Pill */}
        <Link
          href="/whatsapp"
          className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition ${
            botConnected
              ? 'bg-srjgreen-950/40 border-srjgreen-500/30 text-srjgreen-300 hover:border-srjgreen-400/60 shadow-sm'
              : 'bg-charcoal-850 border-charcoal-700 text-charcoal-400 hover:text-white'
          }`}
        >
          <Smartphone className={`w-3.5 h-3.5 ${botConnected ? 'text-srjgreen-400' : 'text-charcoal-500'}`} />
          <span className="font-semibold">{botPhone}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${botConnected ? 'bg-srjgreen-400 animate-pulse' : 'bg-charcoal-500'}`} />
        </Link>

        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-charcoal-950/80 border border-charcoal-800">
          <Activity className="w-3.5 h-3.5 text-cybercyan-400" />
          <span className="text-[11px] text-charcoal-400 font-mono">YOGYAKARTA:</span>
          <span className="text-xs font-mono font-bold text-cybercyan-300">{timeStr}</span>
        </div>

        {/* Notification Bell with Threat Alert */}
        <Link 
          href="/security"
          className="relative p-2 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 border border-charcoal-750 text-charcoal-300 hover:text-white transition group"
          title={unreadCount > 0 ? `${unreadCount} Laporan Insiden Perlu Tindakan` : 'Semua Aman - Tidak Ada Ancaman Tertunda'}
        >
          <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-600 text-[9px] font-mono font-bold text-white shadow-glow-crimson">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Link>

        {/* Admin Profile Badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-charcoal-800/80">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-srjgreen-900 to-charcoal-800 border border-srjgreen-500/40 flex items-center justify-center text-srjgreen-300 text-xs font-bold font-mono shadow-inner">
              AD
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-srjgreen-500 border-2 border-charcoal-900"></span>
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-white leading-tight">Admin Utama</p>
              <span className="text-[9px] font-mono font-extrabold px-1 py-0.2 rounded bg-srjgreen-500/20 text-srjgreen-400 border border-srjgreen-500/30">
                PROD
              </span>
            </div>
            <p className="text-[10px] text-srjgold-400 font-medium">Cyber Security Paguyuban</p>
          </div>
        </div>
      </div>
    </header>
  );
};
