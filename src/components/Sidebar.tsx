'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  Radio, 
  Smartphone, 
  HeartHandshake, 
  Scale, 
  GlobeLock, 
  FlaskConical, 
  Settings, 
  ShieldAlert,
  Terminal,
  Cpu,
  Wifi,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  desc: string;
  statusDot?: boolean;
  badge?: number;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const pathname = usePathname();
  const [waStatus, setWaStatus] = useState<string>('DISCONNECTED');
  const [waPhone, setWaPhone] = useState<string>('Belum Terhubung');
  const [threatCount, setThreatCount] = useState<number>(0);
  const [helpCount, setHelpCount] = useState<number>(0);
  const [modCount, setModCount] = useState<number>(0);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [waRes, secRes, helpRes, modRes] = await Promise.all([
          fetch('/api/whatsapp').then(r => r.json()).catch(() => ({})),
          fetch('/api/security').then(r => r.json()).catch(() => ({})),
          fetch('/api/social-care').then(r => r.json()).catch(() => ({})),
          fetch('/api/moderation').then(r => r.json()).catch(() => ({})),
        ]);

        if (waRes.data) {
          setWaStatus(waRes.data.status || 'DISCONNECTED');
          setWaPhone(waRes.data.phoneNumber || 'Belum Terhubung');
        }
        if (secRes.data) {
          const dangerous = secRes.data.filter((i: any) => i.riskLevel === 'BERBAHAYA').length;
          setThreatCount(dangerous);
        }
        if (helpRes.data) {
          const active = helpRes.data.filter((h: any) => h.status === 'NEW' || h.status === 'IN_PROGRESS').length;
          setHelpCount(active);
        }
        if (modRes.data) {
          setModCount(modRes.data.length || 0);
        }
      } catch (e) {
        // Silent error
      }
    }
    fetchCounts();
    const interval = setInterval(fetchCounts, 12000);
    return () => clearInterval(interval);
  }, [pathname]);

  const navSections: NavSection[] = [
    {
      title: 'PUSAT KENDALI',
      items: [
        { href: '/', label: 'Overview HUD', icon: Radio, desc: 'Ringkasan & Radar Real-Time' },
        { href: '/whatsapp', label: 'WhatsApp Bot', icon: Smartphone, desc: 'Daemon & Manajemen Grup', statusDot: waStatus === 'CONNECTED' },
      ]
    },
    {
      title: 'INTEL & DETEKSI SIBER',
      items: [
        { href: '/security', label: 'AI Security Incidents', icon: ShieldCheck, desc: 'Judol, Scam & Malware', badge: threatCount, badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30' },
        { href: '/url-scanner', label: 'URL Deep Scanner', icon: GlobeLock, desc: 'Cek Tautan Berbahaya' },
        { href: '/moderation', label: 'AI Moderasi Grup', icon: Scale, desc: 'Anti-Flexing & Maksiat' },
      ]
    },
    {
      title: 'KOMUNITAS & SIMULATOR',
      items: [
        { href: '/social-care', label: 'Radar Social Care', icon: HeartHandshake, desc: 'Bantuan Warga & Loker Jogja', badge: helpCount, badgeColor: 'bg-srjgold-500/20 text-srjgold-400 border-srjgold-500/30' },
        { href: '/test-lab', label: 'Test Lab Simulator', icon: FlaskConical, desc: 'Uji Skenario Pesan & AI' },
        { href: '/settings', label: 'Pengaturan Sistem', icon: Settings, desc: 'API Gemini, Filter & Admin' },
      ]
    }
  ];

  const isOnline = waStatus === 'CONNECTED';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col justify-between
        bg-charcoal-900/95 backdrop-blur-2xl border-r border-charcoal-800/80 transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top: Branding & Nav Links */}
        <div className="flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-5 border-b border-charcoal-800/80">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-srjgreen-500 via-srjgreen-600 to-charcoal-900 p-0.5 shadow-glow-green">
                  <div className="w-full h-full bg-charcoal-950 rounded-[10px] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-srjgreen-400 font-bold" />
                  </div>
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-srjgreen-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-srjgreen-500"></span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold tracking-wider text-white text-sm font-mono">
                    SRJ GUARDIAN
                  </h1>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-srjgreen-500/10 text-srjgreen-400 border border-srjgreen-500/20">
                    CYBER
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-400 font-medium">Sunda Rantau Jogja</p>
              </div>
            </div>

            {/* Cultural Motto Pill in Cyber Framing */}
            <div className="mt-3.5 px-3 py-2 rounded-xl bg-charcoal-950/70 border border-charcoal-800/80 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-srjgreen-500"></div>
              <p className="text-[10px] font-semibold text-srjgreen-400 tracking-wide font-mono">
                &ldquo;Silih Asah, Silih Asih, Silih Asuh&rdquo;
              </p>
              <p className="text-[9px] text-charcoal-400 font-medium mt-0.5">
                Nulung ka nu Butuh, Nalang ka nu Susah
              </p>
            </div>
          </div>

          {/* Navigation Sections */}
          <nav className="p-3.5 space-y-4">
            {navSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <p className="px-3 text-[10px] font-mono font-bold text-charcoal-400 tracking-wider">
                  {sec.title}
                </p>

                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`
                          group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all relative
                          ${isActive 
                            ? 'bg-srjgreen-950/50 text-white border border-srjgreen-500/40 shadow-sm' 
                            : 'text-charcoal-300 hover:text-white hover:bg-charcoal-800/60 border border-transparent'}
                        `}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-srjgreen-400 shadow-glow-green" />
                        )}

                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-srjgreen-400' : 'text-charcoal-400 group-hover:text-charcoal-200'
                          }`} />
                          <div className="truncate">
                            <span className="block font-semibold tracking-wide truncate">
                              {item.label}
                            </span>
                            <span className="block text-[10px] text-charcoal-400 truncate font-normal">
                              {item.desc}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {item.statusDot && (
                            <span className="w-2 h-2 rounded-full bg-srjgreen-400 animate-pulse" title="WhatsApp Bot Terhubung" />
                          )}
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${item.badgeColor || 'bg-charcoal-800 text-charcoal-200'}`}>
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className={`w-3.5 h-3.5 text-charcoal-600 transition-transform ${
                            isActive ? 'text-srjgreen-400 translate-x-0.5' : 'group-hover:translate-x-0.5 group-hover:text-charcoal-400'
                          }`} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer: Live Daemon Telemetry Card */}
        <div className="p-3.5 border-t border-charcoal-800/80 bg-charcoal-950/80">
          <div className="p-2.5 rounded-xl bg-charcoal-900 border border-charcoal-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-srjgreen-400" />
                <span className="text-[10px] font-mono font-bold text-charcoal-300">
                  DAEMON MONITOR
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                isOnline 
                  ? 'bg-srjgreen-500/10 text-srjgreen-400 border-srjgreen-500/30' 
                  : 'bg-charcoal-800 text-charcoal-400 border-charcoal-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-srjgreen-400 animate-pulse' : 'bg-charcoal-500'}`} />
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <p className="text-[11px] font-mono text-white truncate font-semibold">
              {waPhone}
            </p>
            <div className="flex items-center justify-between text-[9px] text-charcoal-400 font-mono mt-1 pt-1 border-t border-charcoal-800/60">
              <span>Apple Silicon KeepAlive</span>
              <span className="text-srjgreen-400">caffeinated</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
