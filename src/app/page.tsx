'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ShieldAlert, 
  HeartHandshake, 
  Scale, 
  GlobeLock, 
  Smartphone, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  Activity
} from 'lucide-react';
import { SecurityIncident, ModerationLog, HelpReport, WhatsAppConnection } from '@/types';

export default function OverviewPage() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [moderations, setModerations] = useState<ModerationLog[]>([]);
  const [helpReports, setHelpReports] = useState<HelpReport[]>([]);
  const [waConn, setWaConn] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SECURITY' | 'SOCIAL_CARE' | 'MODERATION'>('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        const [secRes, modRes, helpRes, waRes] = await Promise.all([
          fetch('/api/security').then(r => r.json()).catch(() => ({})),
          fetch('/api/moderation').then(r => r.json()).catch(() => ({})),
          fetch('/api/social-care').then(r => r.json()).catch(() => ({})),
          fetch('/api/whatsapp').then(r => r.json()).catch(() => ({})),
        ]);

        if (secRes.data) setIncidents(secRes.data);
        if (modRes.data) setModerations(modRes.data);
        if (helpRes.data) setHelpReports(helpRes.data);
        if (waRes.data) setWaConn(waRes.data);
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalThreats = incidents.filter(i => i.riskLevel === 'BERBAHAYA').length;
  const pendingHelp = helpReports.filter(h => h.status === 'NEW' || h.status === 'IN_PROGRESS').length;
  const flaggedFlexing = moderations.filter(m => m.ruleViolation === 'FLEXING').length;
  const isConnected = waConn?.status === 'CONNECTED';

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome with Sunda Spirit */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-charcoal-900 via-charcoal-850 to-charcoal-900 border border-charcoal-750 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-srjgreen-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-20 -mb-16 w-48 h-48 rounded-full bg-srjgold-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-srjgreen-500/20 text-srjgreen-400 border border-srjgreen-500/30">
                Sistem Penjaga Komunitas Aktif
              </span>
              <span className="text-xs text-charcoal-400">|</span>
              <span className="text-xs text-srjgold-400 font-medium font-mono">
                SUNDA RANTAU JOGJA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              SRJ GUARDIAN
            </h1>
            <p className="text-sm text-charcoal-300 mt-1 max-w-2xl leading-relaxed">
              Penjaga digital otomatis 24 jam untuk grup WhatsApp Paguyuban. Melindungi dari bahaya scam, mengawal aturan silaturahmi tanpa flexing, dan menjangkau saudara yang butuh pertolongan di perantauan Jogja.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/whatsapp"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-srjgreen-600 hover:bg-srjgreen-500 text-charcoal-950 font-bold text-xs sm:text-sm transition shadow-glow-green"
            >
              <Smartphone className="w-4 h-4" />
              <span>Hubungkan Bot WhatsApp</span>
            </Link>
            <Link
              href="/url-scanner"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-white font-medium text-xs sm:text-sm border border-charcoal-700 transition"
            >
              <GlobeLock className="w-4 h-4 text-srjgreen-400" />
              <span>Scan URL</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: AI Security */}
        <div className="glass-panel p-5 rounded-2xl glass-panel-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">AI Security</span>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">{totalThreats}</span>
              <span className="text-xs text-red-400 font-medium">Ancaman Berbahaya</span>
            </div>
            <p className="text-xs text-charcoal-400 mt-2">
              Phishing, sniffing APK, & scam DANA kaget langsung diintervensi otomatis.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-charcoal-800/80 flex items-center justify-between">
            <span className="text-[11px] text-charcoal-400">Status Penahanan:</span>
            <span className="text-[11px] font-mono font-semibold text-srjgreen-400">
              {totalThreats > 0 ? '100% Ditahan' : 'Aman'}
            </span>
          </div>
        </div>

        {/* Card 2: AI Social Care */}
        <div className="glass-panel p-5 rounded-2xl glass-panel-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">AI Social Care</span>
              <div className="w-8 h-8 rounded-lg bg-srjgold-500/10 border border-srjgold-500/20 flex items-center justify-center text-srjgold-400">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">{pendingHelp}</span>
              <span className="text-xs text-srjgold-400 font-medium">Peryogi Bantos</span>
            </div>
            <p className="text-xs text-charcoal-400 mt-2">
              Pencari kerja, sakit sendirian di kosan, butuh info kontrakan di Jogja.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-charcoal-800/80 flex items-center justify-between">
            <span className="text-[11px] text-charcoal-400">Prinsip Sunda:</span>
            <span className="text-[11px] font-medium text-srjgold-300">Nulung ka nu Butuh</span>
          </div>
        </div>

        {/* Card 3: AI Moderator */}
        <div className="glass-panel p-5 rounded-2xl glass-panel-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">AI Moderator</span>
              <div className="w-8 h-8 rounded-lg bg-srjgreen-500/10 border border-srjgreen-500/20 flex items-center justify-center text-srjgreen-400">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">{moderations.length}</span>
              <span className="text-xs text-srjgreen-400 font-medium">Catatan Aturan</span>
            </div>
            <p className="text-xs text-charcoal-400 mt-2">
              {flaggedFlexing} dugaan flexing kontekstual dicek teliti tanpa permalukan anggota.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-charcoal-800/80 flex items-center justify-between">
            <span className="text-[11px] text-charcoal-400">Pedoman Grup:</span>
            <span className="text-[11px] font-medium text-srjgreen-300">Silih Asih & Rukun</span>
          </div>
        </div>

        {/* Card 4: WhatsApp Connection Health */}
        <div className="glass-panel p-5 rounded-2xl glass-panel-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Koneksi WhatsApp</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-charcoal-800 text-charcoal-400'
              }`}>
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-charcoal-600'}`}></span>
              <span className={`text-base font-bold font-mono ${isConnected ? 'text-emerald-400' : 'text-charcoal-400'}`}>
                {waConn?.status || 'DISCONNECTED'}
              </span>
            </div>
            <p className="text-xs text-charcoal-400 mt-2 font-mono">
              {waConn?.phoneNumber || 'Nomor Belum Terhubung'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-charcoal-800/80 flex items-center justify-between">
            <span className="text-[11px] text-charcoal-400">Status Server:</span>
            <span className="text-[11px] font-mono font-semibold text-charcoal-300">
              {isConnected ? 'Daemon Online' : 'Menunggu Pairing'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Event Stream (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-5 rounded-2xl">
            {/* Feed Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-charcoal-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-srjgreen-400" />
                <h2 className="text-base font-bold text-white">Aktivitas Pemantauan Grup</h2>
              </div>

              <div className="flex items-center gap-1 bg-charcoal-850 p-1 rounded-xl border border-charcoal-750">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    activeTab === 'ALL' ? 'bg-charcoal-700 text-white' : 'text-charcoal-400 hover:text-white'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setActiveTab('SECURITY')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    activeTab === 'SECURITY' ? 'bg-red-500/20 text-red-300 font-semibold' : 'text-charcoal-400 hover:text-white'
                  }`}
                >
                  Keamanan
                </button>
                <button
                  onClick={() => setActiveTab('SOCIAL_CARE')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    activeTab === 'SOCIAL_CARE' ? 'bg-srjgold-500/20 text-srjgold-300 font-semibold' : 'text-charcoal-400 hover:text-white'
                  }`}
                >
                  Social Care
                </button>
                <button
                  onClick={() => setActiveTab('MODERATION')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    activeTab === 'MODERATION' ? 'bg-srjgreen-500/20 text-srjgreen-300 font-semibold' : 'text-charcoal-400 hover:text-white'
                  }`}
                >
                  Moderasi
                </button>
              </div>
            </div>

            {/* Empty State or Items List */}
            {incidents.length === 0 && helpReports.length === 0 && moderations.length === 0 ? (
              <div className="py-16 text-center text-charcoal-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-charcoal-850 border border-charcoal-750 text-charcoal-500 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Belum Ada Laporan Masuk</p>
                  <p className="text-xs text-charcoal-400 max-w-md mx-auto mt-1">
                    Database bersih tanpa data palsu. Saat bot terhubung ke grup WhatsApp dan ada anggota mengirim pesan, ancaman atau permintaan bantuan akan langsung tercatat di sini secara otomatis.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/whatsapp"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-white text-xs font-semibold border border-charcoal-700 transition"
                  >
                    <span>Cek Status WhatsApp</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-charcoal-800/80 mt-2">
                {/* Security Items */}
                {(activeTab === 'ALL' || activeTab === 'SECURITY') && incidents.map((item) => (
                  <div key={item.id} className="py-4 hover:bg-charcoal-850/40 px-2 rounded-xl transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-2 rounded-xl ${
                          item.riskLevel === 'BERBAHAYA' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{item.senderName}</span>
                            <span className="text-[10px] font-mono text-charcoal-400">({item.groupName})</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              item.riskLevel === 'BERBAHAYA' 
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {item.riskLevel}: {item.threatType}
                            </span>
                          </div>
                          <p className="text-xs text-charcoal-200 mt-1 font-mono bg-charcoal-900/60 p-2 rounded-lg border border-charcoal-800/80 break-all">
                            {item.rawContent}
                          </p>
                          <p className="text-xs text-charcoal-400 mt-1.5 flex items-center gap-1.5">
                            <span className="text-srjgreen-400 font-medium">Analisis AI:</span>
                            <span>{item.aiAnalysis}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-charcoal-400 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-300 border border-charcoal-700">
                            {item.actionTaken === 'MESSAGE_DELETED' ? 'Otomatis Dihapus' : 'Lapor Admin'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Social Care Items */}
                {(activeTab === 'ALL' || activeTab === 'SOCIAL_CARE') && helpReports.map((item) => (
                  <div key={item.id} className="py-4 hover:bg-charcoal-850/40 px-2 rounded-xl transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-xl bg-srjgold-500/10 text-srjgold-400 border border-srjgold-500/20">
                          <HeartHandshake className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{item.senderName}</span>
                            <span className="text-[10px] font-mono text-charcoal-400">({item.groupName})</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-srjgold-500/20 text-srjgold-300 border border-srjgold-500/30">
                              BANTUAN: {item.category}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              item.urgency === 'CRITICAL' ? 'bg-red-500/20 text-red-300 font-bold' : 'bg-charcoal-800 text-charcoal-300'
                            }`}>
                              URGENSI {item.urgency}
                            </span>
                          </div>
                          <p className="text-xs text-charcoal-300 mt-1 italic">
                            &ldquo;{item.excerpt}&rdquo;
                          </p>
                          <p className="text-xs text-srjgold-400/90 mt-1 font-medium">
                            {item.summary}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-charcoal-400 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="mt-1">
                          <Link
                            href={`https://wa.me/${item.senderJid.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-srjgreen-400 hover:text-srjgreen-300"
                          >
                            <span>Japri Admin</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Moderation Items */}
                {(activeTab === 'ALL' || activeTab === 'MODERATION') && moderations.map((item) => (
                  <div key={item.id} className="py-4 hover:bg-charcoal-850/40 px-2 rounded-xl transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Scale className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{item.senderName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              ATURAN: {item.ruleViolation}
                            </span>
                          </div>
                          <p className="text-xs text-charcoal-300 mt-1 bg-charcoal-900/60 p-2 rounded-lg border border-charcoal-800">
                            &ldquo;{item.rawContent}&rdquo;
                          </p>
                          <p className="text-xs text-charcoal-400 mt-1.5">
                            {item.contextAnalysis}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-charcoal-400 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-300">
                            {item.adminDecision}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Rules & System Controls */}
        <div className="space-y-4">
          {/* SRJ Community Creed Card */}
          <div className="glass-panel p-5 rounded-2xl border-srjgold-500/20 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-srjgold-400 font-mono">
                PEDOMAN SRJ JOGJA
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Sunda Rantau Jogja
            </h3>
            <p className="text-xs text-charcoal-300 mt-2 leading-relaxed">
              Jauh dari kampung halaman di Jawa Barat & Banten, tetapi tetap rukun bersaudara di Yogyakarta.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-charcoal-850 border border-charcoal-750">
                <span className="font-semibold text-srjgreen-400">1. Silih Asah</span>
                <p className="text-[11px] text-charcoal-400 mt-0.5">Saling mengasah kecerdasan dan ilmu tanpa saling menjatuhkan.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-charcoal-850 border border-charcoal-750">
                <span className="font-semibold text-srjgold-400">2. Silih Asih</span>
                <p className="text-[11px] text-charcoal-400 mt-0.5">Saling mengasihi sesama perantau, peduli yang sakit & kesusahan.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-charcoal-850 border border-charcoal-750">
                <span className="font-semibold text-emerald-400">3. Silih Asuh</span>
                <p className="text-[11px] text-charcoal-400 mt-0.5">Yang mapan membimbing yang baru merantau, tanpa pamer/flexing.</p>
              </div>
            </div>
          </div>

          {/* Automatic Link Security Status */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GlobeLock className="w-4 h-4 text-srjgreen-400" />
                <h3 className="text-sm font-bold text-white">URL Security Sandbox</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-srjgreen-500/20 text-srjgreen-400">
                SSRF SAFE
              </span>
            </div>

            <p className="text-xs text-charcoal-300 leading-relaxed">
              Setiap tautan yang terkirim di grup dipindai otomatis secara terisolasi tanpa memicu eksekusi kode berbahaya.
            </p>

            <div className="mt-4 pt-3 border-t border-charcoal-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-charcoal-300">
                <span>Google Safe Browsing:</span>
                <span className="text-srjgreen-400 font-mono">Siap</span>
              </div>
              <div className="flex items-center justify-between text-charcoal-300">
                <span>Heuristic Anti-Phishing:</span>
                <span className="text-srjgreen-400 font-mono">Aktif</span>
              </div>
              <div className="flex items-center justify-between text-charcoal-300">
                <span>Sniffing APK Blocker:</span>
                <span className="text-red-400 font-mono font-semibold">Aktif</span>
              </div>
            </div>

            <Link
              href="/url-scanner"
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-xs text-white font-medium border border-charcoal-700 transition"
            >
              <span>Buka Live URL Scanner</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
