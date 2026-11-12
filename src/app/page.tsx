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
  Activity,
  Zap,
  Terminal,
  Cpu,
  Lock,
  Layers,
  Sparkles,
  Wifi,
  Copy,
  Check
} from 'lucide-react';
import { SecurityIncident, ModerationLog, HelpReport, WhatsAppConnection } from '@/types';

export default function OverviewPage() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [moderations, setModerations] = useState<ModerationLog[]>([]);
  const [helpReports, setHelpReports] = useState<HelpReport[]>([]);
  const [waConn, setWaConn] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SECURITY' | 'SOCIAL_CARE' | 'MODERATION'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalThreats = incidents.length;
  const dangerousThreats = incidents.filter(i => i.riskLevel === 'BERBAHAYA').length;
  const pendingHelp = helpReports.filter(h => h.status === 'NEW' || h.status === 'IN_PROGRESS').length;
  const totalMod = moderations.length;
  const isConnected = waConn?.status === 'CONNECTED';
  const botNumber = waConn?.phoneNumber || '+6285780459052';

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Cyber HUD Hero Section */}
      <div className="cyber-card hud-corner p-6 relative overflow-hidden border-srjgreen-500/25">
        {/* Ambient Cyber Light Effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-srjgreen-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-20 w-60 h-60 rounded-full bg-cybercyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            {/* Header Telemetry Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-srjgreen-500/15 text-srjgreen-400 border border-srjgreen-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-srjgreen-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-srjgreen-500"></span>
                </span>
                SISTEM SIBER AKTIF
              </span>

              <span className="text-charcoal-700 font-mono text-xs hidden sm:inline">|</span>

              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-charcoal-900/90 text-charcoal-300 border border-charcoal-700/60">
                JALUR KILAT: <span className="text-srjgreen-400">&lt;50ms AUTO-PURGE</span>
              </span>

              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-srjgold-500/10 text-srjgold-400 border border-srjgold-500/30">
                SRJ YOGYAKARTA
              </span>
            </div>

            {/* Main Cyber Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>SRJ GUARDIAN</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-charcoal-800 text-srjgreen-400 border border-srjgreen-500/30">
                  v2.5 PROD
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-charcoal-300 mt-1 max-w-2xl leading-relaxed">
                Pusat Komando Keamanan Siber & Pemantau Komunitas Paguyuban Sunda Rantau Jogja. Menangkal penipuan, tautan judi online, dan malware, serta menghubungkan tali asih sesama warga perantau di Yogyakarta.
              </p>
            </div>
          </div>

          {/* Action Hub Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <Link
              href="/whatsapp"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-srjgreen-500 hover:bg-srjgreen-400 text-charcoal-950 font-bold text-xs sm:text-sm transition shadow-glow-green"
            >
              <Smartphone className="w-4 h-4" />
              <span>{isConnected ? 'WhatsApp Terhubung' : 'Kelola WhatsApp Bot'}</span>
            </Link>

            <Link
              href="/url-scanner"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-charcoal-900/90 hover:bg-charcoal-800 text-white font-medium text-xs sm:text-sm border border-charcoal-700/80 hover:border-cybercyan-500/40 transition"
            >
              <GlobeLock className="w-4 h-4 text-cybercyan-400" />
              <span>Deep Scanner URL</span>
            </Link>

            <Link
              href="/test-lab"
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-charcoal-900/90 hover:bg-charcoal-800 text-charcoal-300 hover:text-white font-medium text-xs border border-charcoal-700/80 transition"
              title="Buka Test Lab Simulator"
            >
              <Zap className="w-4 h-4 text-srjgold-400" />
              <span className="hidden sm:inline">Test Lab</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Cyber Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: AI Cyber Security */}
        <div className="cyber-card cyber-card-crimson p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-[11px] font-mono font-bold text-charcoal-400 uppercase tracking-wider">
                  Deteksi Siber
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-glow-crimson">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{totalThreats}</span>
              <span className="text-xs text-red-400 font-bold font-mono">INSIDEN</span>
            </div>

            <p className="text-xs text-charcoal-300 mt-2 leading-snug">
              Judol, APK sniffer M-Banking, dan penipuan saldo langsung dihapus instan (&lt;50ms).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-charcoal-800/80 flex items-center justify-between text-[11px]">
            <span className="text-charcoal-400">Status Penahanan:</span>
            <span className="font-mono font-bold text-srjgreen-400">
              100% Terintervensi
            </span>
          </div>
        </div>

        {/* KPI 2: AI Social Care */}
        <div className="cyber-card cyber-card-gold p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-srjgold-400"></span>
                <span className="text-[11px] font-mono font-bold text-charcoal-400 uppercase tracking-wider">
                  Social Care
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-srjgold-500/10 border border-srjgold-500/30 flex items-center justify-center text-srjgold-400 shadow-glow-gold">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{pendingHelp}</span>
              <span className="text-xs text-srjgold-400 font-bold font-mono">PERLU BANTUAN</span>
            </div>

            <p className="text-xs text-charcoal-300 mt-2 leading-snug">
              Warga rantau yang butuh info loker, sakit di kosan, atau butuh bantuan darurat di Jogja.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-charcoal-800/80 flex items-center justify-between text-[11px]">
            <span className="text-charcoal-400">Prinsip Budaya:</span>
            <span className="font-medium text-srjgold-300 font-mono">
              Nulung ka nu Butuh
            </span>
          </div>
        </div>

        {/* KPI 3: AI Moderator & Ketertiban */}
        <div className="cyber-card cyber-card-cyan p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cybercyan-400"></span>
                <span className="text-[11px] font-mono font-bold text-charcoal-400 uppercase tracking-wider">
                  Moderasi Etika
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-cybercyan-500/10 border border-cybercyan-500/30 flex items-center justify-center text-cybercyan-400 shadow-glow-cyan">
                <Scale className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{totalMod}</span>
              <span className="text-xs text-cybercyan-400 font-bold font-mono">PELANGGARAN</span>
            </div>

            <p className="text-xs text-charcoal-300 mt-2 leading-snug">
              Pencegahan flexing, larangan maksiat/dugem, dan etika tutur kata tanpa mempermalukan anggota.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-charcoal-800/80 flex items-center justify-between text-[11px]">
            <span className="text-charcoal-400">Pedoman Grup:</span>
            <span className="font-medium text-cybercyan-300 font-mono">
              Silih Asih & Tertib
            </span>
          </div>
        </div>

        {/* KPI 4: WhatsApp Daemon Engine */}
        <div className="cyber-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-srjgreen-400 animate-pulse' : 'bg-charcoal-600'}`}></span>
                <span className="text-[11px] font-mono font-bold text-charcoal-400 uppercase tracking-wider">
                  Bot Daemon
                </span>
              </div>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isConnected 
                  ? 'bg-srjgreen-500/10 border border-srjgreen-500/30 text-srjgreen-400 shadow-glow-green' 
                  : 'bg-charcoal-800 text-charcoal-500'
              }`}>
                <Smartphone className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold font-mono tracking-tight ${isConnected ? 'text-srjgreen-400' : 'text-charcoal-400'}`}>
                {isConnected ? 'ONLINE / AKTIF' : 'TERPUTUS'}
              </span>
            </div>

            <p className="text-xs text-white font-mono mt-1 font-semibold truncate">
              {botNumber}
            </p>
            <p className="text-[11px] text-charcoal-400 mt-0.5">
              Protokol Baileys Multi-Device v6
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-charcoal-800/80 flex items-center justify-between text-[11px]">
            <span className="text-charcoal-400">Daya Server:</span>
            <span className="font-mono font-bold text-srjgreen-400">
              Mac Caffeinate 24/7
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Telemetry Stream & Creed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Event Stream (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="cyber-card p-5">
            {/* Feed Filter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-charcoal-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-center text-srjgreen-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    LOG SINYAL & AUDIT SIBER REAL-TIME
                  </h2>
                  <p className="text-[11px] text-charcoal-400">
                    Setiap pesan di grup dipindai otomatis secara transparan
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-charcoal-950 p-1 rounded-xl border border-charcoal-800">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    activeTab === 'ALL' 
                      ? 'bg-charcoal-800 text-white shadow-sm' 
                      : 'text-charcoal-400 hover:text-white'
                  }`}
                >
                  SEMUA ({totalThreats + pendingHelp + totalMod})
                </button>
                <button
                  onClick={() => setActiveTab('SECURITY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    activeTab === 'SECURITY' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'text-charcoal-400 hover:text-red-300'
                  }`}
                >
                  SIBER ({totalThreats})
                </button>
                <button
                  onClick={() => setActiveTab('SOCIAL_CARE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    activeTab === 'SOCIAL_CARE' 
                      ? 'bg-srjgold-500/20 text-srjgold-400 border border-srjgold-500/30' 
                      : 'text-charcoal-400 hover:text-srjgold-300'
                  }`}
                >
                  SOSIAL ({pendingHelp})
                </button>
                <button
                  onClick={() => setActiveTab('MODERATION')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    activeTab === 'MODERATION' 
                      ? 'bg-cybercyan-500/20 text-cybercyan-400 border border-cybercyan-500/30' 
                      : 'text-charcoal-400 hover:text-cybercyan-300'
                  }`}
                >
                  MODERASI ({totalMod})
                </button>
              </div>
            </div>

            {/* Empty State */}
            {incidents.length === 0 && helpReports.length === 0 && moderations.length === 0 ? (
              <div className="py-16 text-center text-charcoal-400 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-charcoal-900 border border-charcoal-800 text-charcoal-500 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldCheck className="w-7 h-7 text-srjgreen-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Sistem Bersih — Tidak Ada Ancaman</p>
                  <p className="text-xs text-charcoal-400 max-w-md mx-auto mt-1 leading-relaxed">
                    Database bebas dari data buatan (mock). Begitu ada pesan di grup terdeteksi judol, scam, atau permohonan bantuan, data akan seketika tampil di log radar ini.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/test-lab"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 text-white text-xs font-semibold border border-charcoal-700/80 transition"
                  >
                    <span>Uji Coba Kirim Pesan di Test Lab</span>
                    <ChevronRight className="w-3.5 h-3.5 text-srjgreen-400" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-charcoal-800/60 mt-3 space-y-3">
                {/* 1. Security Incidents */}
                {(activeTab === 'ALL' || activeTab === 'SECURITY') && incidents.map((item) => (
                  <div key={item.id} className="pt-3 pb-1 hover:bg-charcoal-900/40 p-3 rounded-xl transition border border-transparent hover:border-red-500/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white font-mono">{item.senderName}</span>
                            <span className="text-[10px] font-mono text-charcoal-400">({item.groupName})</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              item.riskLevel === 'BERBAHAYA' 
                                ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              {item.threatType}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-charcoal-800 text-charcoal-300 border border-charcoal-700">
                              {item.actionTaken === 'MESSAGE_DELETED' ? 'OTOMATIS DIHAPUS' : 'DITAHAN'}
                            </span>
                          </div>

                          {/* Raw content message box */}
                          <div className="mt-2 p-2.5 rounded-lg bg-charcoal-950 border border-charcoal-800/80 flex items-start justify-between gap-2">
                            <p className="text-xs text-charcoal-200 font-mono break-all leading-relaxed">
                              {item.rawContent}
                            </p>
                            <button
                              onClick={() => handleCopy(item.rawContent, item.id)}
                              className="p-1 rounded text-charcoal-500 hover:text-white shrink-0"
                              title="Salin Pesan"
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-srjgreen-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-xs text-charcoal-400">
                            <span className="text-srjgreen-400 font-semibold font-mono">Analisis AI:</span>
                            <span className="text-charcoal-300">{item.aiAnalysis}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-charcoal-400 font-mono block">
                          {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                        <span className="text-[9px] text-charcoal-500 font-mono block mt-0.5">
                          {new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 2. Social Care Items */}
                {(activeTab === 'ALL' || activeTab === 'SOCIAL_CARE') && helpReports.map((item) => (
                  <div key={item.id} className="pt-3 pb-1 hover:bg-charcoal-900/40 p-3 rounded-xl transition border border-transparent hover:border-srjgold-500/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 p-2 rounded-xl bg-srjgold-500/10 text-srjgold-400 border border-srjgold-500/20 shrink-0">
                          <HeartHandshake className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white font-mono">{item.senderName}</span>
                            <span className="text-[10px] font-mono text-charcoal-400">({item.groupName})</span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-srjgold-500/20 text-srjgold-300 border border-srjgold-500/30">
                              KATEGORI: {item.category}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              item.urgency === 'CRITICAL' 
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40' 
                                : 'bg-charcoal-800 text-charcoal-300 border border-charcoal-700'
                            }`}>
                              URGENSI {item.urgency}
                            </span>
                          </div>

                          <div className="mt-2 p-2.5 rounded-lg bg-charcoal-950 border border-charcoal-800/80">
                            <p className="text-xs text-charcoal-200 italic leading-relaxed">
                              &ldquo;{item.excerpt}&rdquo;
                            </p>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="text-srjgold-400 font-semibold font-mono">Bantuan Dibutuhkan:</span>
                            <span className="text-white">{item.summary}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-charcoal-400 font-mono block">
                          {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                        <Link
                          href={`https://wa.me/${item.senderJid.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-srjgreen-950/80 hover:bg-srjgreen-900 border border-srjgreen-500/30 text-[11px] font-bold text-srjgreen-300 transition"
                        >
                          <span>Japri Admin</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 3. Moderation Logs */}
                {(activeTab === 'ALL' || activeTab === 'MODERATION') && moderations.map((item) => (
                  <div key={item.id} className="pt-3 pb-1 hover:bg-charcoal-900/40 p-3 rounded-xl transition border border-transparent hover:border-cybercyan-500/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 p-2 rounded-xl bg-cybercyan-500/10 text-cybercyan-400 border border-cybercyan-500/20 shrink-0">
                          <Scale className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white font-mono">{item.senderName}</span>
                            <span className="text-[10px] font-mono text-charcoal-400">({item.groupName})</span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cybercyan-500/20 text-cybercyan-300 border border-cybercyan-500/30">
                              PELANGGARAN: {item.ruleViolation}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-300 border border-charcoal-700">
                              SKOR: {Math.round((item.confidenceScore || 0.8) * 100)}%
                            </span>
                          </div>

                          <div className="mt-2 p-2.5 rounded-lg bg-charcoal-950 border border-charcoal-800/80">
                            <p className="text-xs text-charcoal-200 font-mono break-all leading-relaxed">
                              &ldquo;{item.rawContent}&rdquo;
                            </p>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-xs text-charcoal-400">
                            <span className="text-cybercyan-400 font-semibold font-mono">Evaluasi Moderasi:</span>
                            <span className="text-charcoal-300">{item.contextAnalysis}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-charcoal-400 font-mono block">
                          {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-charcoal-300 px-2 py-0.5 rounded bg-charcoal-800 border border-charcoal-700 block mt-2 text-center">
                          {item.adminDecision || 'DITINJAU'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Creed & Cyber Architecture */}
        <div className="space-y-4">
          {/* SRJ Cultural Creed Card */}
          <div className="cyber-card p-5 border-srjgold-500/25 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-srjgold-400">
                FALSAFAH PAGUYUBAN SRJ
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Sunda Rantau Jogja
            </h3>
            <p className="text-xs text-charcoal-300 mt-1.5 leading-relaxed">
              Jauh dari lembur matuh (tanah kelahiran di Jabar & Banten), namun bersatu rukun dan saling menguatkan di Daerah Istimewa Yogyakarta.
            </p>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-charcoal-950 border border-charcoal-800/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-srjgreen-400 font-mono">1. Silih Asah</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-srjgreen-500/10 text-srjgreen-300 border border-srjgreen-500/20">Cerdas</span>
                </div>
                <p className="text-[11px] text-charcoal-300 mt-1">Saling mencerdaskan ilmu, berbagi informasi valid tanpa menyebarkan hoaks atau fitnah.</p>
              </div>

              <div className="p-3 rounded-xl bg-charcoal-950 border border-charcoal-800/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-srjgold-400 font-mono">2. Silih Asih</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-srjgold-500/10 text-srjgold-300 border border-srjgold-500/20">Welis Asih</span>
                </div>
                <p className="text-[11px] text-charcoal-300 mt-1">Saling mengasihi sesama perantau. Sigap membantu anggota yang sakit, tertimpa musibah, atau butuh makan.</p>
              </div>

              <div className="p-3 rounded-xl bg-charcoal-950 border border-charcoal-800/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cybercyan-400 font-mono">3. Silih Asuh</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cybercyan-500/10 text-cybercyan-300 border border-cybercyan-500/20">Membimbing</span>
                </div>
                <p className="text-[11px] text-charcoal-300 mt-1">Yang telah mapan membimbing yang baru tiba di Jogja. Rendah hati dan dilarang menyombongkan diri (anti-flexing).</p>
              </div>
            </div>
          </div>

          {/* Cyber Architecture Spec Card */}
          <div className="cyber-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-srjgreen-400" />
                <h3 className="text-sm font-bold text-white tracking-wide font-mono">
                  ARSITEKTUR PERTAHANAN
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-srjgreen-500/15 text-srjgreen-400 border border-srjgreen-500/30">
                SEC-V2
              </span>
            </div>

            <p className="text-xs text-charcoal-300 leading-relaxed">
              Arsitektur pertahanan berlapis dengan isolasi tautan otomatis dan pemrosesan instan di tingkat memori.
            </p>

            <div className="mt-4 pt-3 border-t border-charcoal-800/80 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-charcoal-300">
                <span className="text-charcoal-400">Jalur Kilat (Fast-Rules):</span>
                <span className="text-srjgreen-400 font-bold">&lt;50ms (In-Memory)</span>
              </div>
              <div className="flex items-center justify-between text-charcoal-300">
                <span className="text-charcoal-400">Pengecualian Biodata:</span>
                <span className="text-srjgreen-400 font-bold">100% Aman Terproteksi</span>
              </div>
              <div className="flex items-center justify-between text-charcoal-300">
                <span className="text-charcoal-400">Anti-Spoofing Siber:</span>
                <span className="text-cybercyan-400 font-bold">Silent Purge</span>
              </div>
              <div className="flex items-center justify-between text-charcoal-300">
                <span className="text-charcoal-400">AI Engine:</span>
                <span className="text-srjgold-400 font-bold">Gemini 2.5 Flash</span>
              </div>
            </div>

            <Link
              href="/whatsapp"
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 text-xs text-white font-semibold border border-charcoal-700/80 transition"
            >
              <span>Pantau Grup Terkoneksi</span>
              <ChevronRight className="w-3.5 h-3.5 text-srjgreen-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
