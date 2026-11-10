'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  AlertTriangle, 
  HeartHandshake, 
  Scale, 
  GlobeLock, 
  Smartphone, 
  Settings, 
  FlaskConical,
  Radio
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const pathname = usePathname();
  const [waStatus, setWaStatus] = useState<string>('DISCONNECTED');
  const [waPhone, setWaPhone] = useState<string>('Belum Terhubung');
  const [threatCount, setThreatCount] = useState<number>(0);
  const [helpCount, setHelpCount] = useState<number>(0);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [waRes, secRes, helpRes] = await Promise.all([
          fetch('/api/whatsapp').then(r => r.json()).catch(() => ({})),
          fetch('/api/security').then(r => r.json()).catch(() => ({})),
          fetch('/api/social-care').then(r => r.json()).catch(() => ({})),
        ]);

        if (waRes.data) {
          setWaStatus(waRes.data.status || 'DISCONNECTED');
          setWaPhone(waRes.data.phoneNumber || 'Belum Terhubung');
        }
        if (secRes.data) {
          setThreatCount(secRes.data.length || 0);
        }
        if (helpRes.data) {
          setHelpCount(helpRes.data.length || 0);
        }
      } catch (e) {
        //
      }
    }
    fetchCounts();
  }, [pathname]);

  const navItems = [
    { href: '/', label: 'Overview', icon: Radio },
    { href: '/security', label: 'AI Security', icon: ShieldCheck, count: threatCount },
    { href: '/social-care', label: 'AI Social Care', icon: HeartHandshake, count: helpCount },
    { href: '/moderation', label: 'AI Moderator', icon: Scale },
    { href: '/url-scanner', label: 'URL Scanner', icon: GlobeLock },
    { href: '/whatsapp', label: 'WhatsApp Bot', icon: Smartphone, highlight: true },
    { href: '/test-lab', label: 'Test Lab & Simulator', icon: FlaskConical },
    { href: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col justify-between
        bg-charcoal-900 border-r border-charcoal-800 transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header & Brand */}
        <div>
          <div className="p-6 border-b border-charcoal-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-srjgreen-600 via-srjgreen-500 to-srjgold-500 flex items-center justify-center shadow-glow-green">
                <ShieldCheck className="w-6 h-6 text-charcoal-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold tracking-tight text-white text-base">SRJ GUARDIAN</h1>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-srjgold-500/20 text-srjgold-400 border border-srjgold-500/30 font-semibold">v1.0</span>
                </div>
                <p className="text-[11px] text-charcoal-400 font-medium">Sunda Rantau Jogja</p>
              </div>
            </div>

            {/* Cultural Motto Pill */}
            <div className="mt-4 px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-750 text-center">
              <p className="text-[10px] font-medium text-srjgreen-400 italic">
                &ldquo;Silih Asah, Silih Asih, Silih Asuh&rdquo;
              </p>
              <p className="text-[9px] text-charcoal-400 mt-0.5">
                Nulung ka nu Butuh, Nalang ka nu Susah
              </p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-srjgreen-950/80 text-srjgreen-400 border border-srjgreen-600/40 shadow-sm' 
                      : 'text-charcoal-300 hover:text-white hover:bg-charcoal-800/60 border border-transparent'}
                    ${item.highlight && !isActive ? 'hover:border-srjgold-500/30' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-srjgreen-400' : 'text-charcoal-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-charcoal-800 text-charcoal-200 border border-charcoal-700">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Status Panel */}
        <div className="p-4 border-t border-charcoal-800 bg-charcoal-950/60">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[11px] text-charcoal-400">Daemon Monitor</span>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-medium ${
              waStatus === 'CONNECTED' ? 'text-srjgreen-400' : 'text-charcoal-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                waStatus === 'CONNECTED' ? 'bg-srjgreen-500 animate-ping' : 'bg-charcoal-600'
              }`}></span>
              {waStatus === 'CONNECTED' ? '24/7 ONLINE' : 'STANDBY'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-charcoal-850/80 border border-charcoal-750 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              waStatus === 'CONNECTED' 
                ? 'bg-srjgreen-500/10 border border-srjgreen-500/20 text-srjgreen-400' 
                : 'bg-charcoal-800 border border-charcoal-700 text-charcoal-400'
            }`}>
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white truncate">SRJ BOT</p>
                <span className={`text-[9px] px-1 rounded font-mono font-semibold ${
                  waStatus === 'CONNECTED' ? 'bg-srjgreen-500/20 text-srjgreen-300' : 'bg-charcoal-800 text-charcoal-400'
                }`}>
                  {waStatus}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-400 font-mono truncate">{waPhone}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
