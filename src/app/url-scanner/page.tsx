'use client';

import React, { useState, useEffect } from 'react';
import { 
  GlobeLock, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Lock,
  Layers,
  Radio,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { UrlScanResult, ThreatStatus } from '@/types';

export default function UrlScannerPage() {
  const [urlInput, setUrlInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [currentResult, setCurrentResult] = useState<UrlScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<UrlScanResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Sample quick test buttons for common real-world vectors in Indonesia
  const sampleUrls = [
    { label: 'Phishing DANA Kaget', url: 'https://dana-kaget-claim-saldo.xyz/login-otp' },
    { label: 'Sniffing APK Undangan', url: 'https://drive-cloud-download.online/Undangan_Nikah_Deden.apk' },
    { label: 'URL Shortener (bit.ly)', url: 'https://bit.ly/3xCouponSRJ' },
    { label: 'Domain Resmi Pemkot Jogja', url: 'https://jogjakota.go.id/layanan/kesehatan' },
    { label: 'Uji Proteksi SSRF (127.0.0.1)', url: 'http://127.0.0.1:8080/admin-internal' }
  ];

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/pipeline/scan-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://sundarantaujogja.id' })
      });
      // Also get security incidents detected URLs
      const secRes = await fetch('/api/security');
      const secJson = await secRes.json();
      if (secJson.data) {
        // Mock sample initial if needed
      }
    } catch (e) {
      //
    }
  };

  useEffect(() => {
    // Initial demo scan
    handleScan('https://dana-kaget-claim-saldo.xyz/login-otp');
  }, []);

  const handleScan = async (targetUrl?: string) => {
    const urlToScan = targetUrl || urlInput;
    if (!urlToScan || !urlToScan.trim()) {
      setErrorMsg('Masukkan URL yang ingin diperiksa.');
      return;
    }

    setErrorMsg('');
    setScanning(true);

    try {
      const res = await fetch('/api/pipeline/scan-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScan.trim() }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCurrentResult(data.data);
        setRecentScans(prev => [data.data, ...prev.filter(s => s.url !== data.data.url)]);
      } else {
        setErrorMsg(data.error || 'Gagal memindai URL.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Koneksi scanner gagal.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-srjgreen-500/10 text-srjgreen-400 border border-srjgreen-500/20">
            <GlobeLock className="w-4 h-4" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Automatic Link Security Scanner & Sandbox
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-charcoal-400 mt-1">
          Inspeksi mendalam otomatis setiap tautan di grup WhatsApp. Mencegah phishing rekening, Trojan APK, serta dilindungi sandbox anti-SSRF.
        </p>
      </div>

      {/* Live Input & Scanner Form */}
      <div className="glass-panel p-6 rounded-2xl border-charcoal-800 space-y-4">
        <label className="block text-xs font-semibold text-charcoal-300">
          Uji URL / Tautan Langsung:
        </label>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Contoh: https://dana-kaget-claim-saldo.xyz/login-otp atau http://bit.ly/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-charcoal-900 border border-charcoal-750 text-white placeholder-charcoal-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-srjgreen-500"
            />
          </div>
          <button
            onClick={() => handleScan()}
            disabled={scanning}
            className="px-6 py-3 rounded-xl bg-srjgreen-600 hover:bg-srjgreen-500 disabled:opacity-50 text-charcoal-950 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-glow-green shrink-0"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memindai...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Pindai Sekarang</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 font-medium">⚠️ {errorMsg}</p>
        )}

        {/* Quick Test Vectors */}
        <div className="pt-2">
          <span className="text-[11px] text-charcoal-400 block mb-2">Uji Vektor Cepat:</span>
          <div className="flex flex-wrap gap-2">
            {sampleUrls.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setUrlInput(s.url);
                  handleScan(s.url);
                }}
                className="px-2.5 py-1 rounded-lg bg-charcoal-850 hover:bg-charcoal-800 text-charcoal-300 hover:text-white border border-charcoal-750 text-[11px] transition"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Display Box */}
      {currentResult && (
        <div className={`glass-panel p-6 rounded-2xl border ${
          currentResult.threatStatus === 'BERBAHAYA' 
            ? 'border-red-500/40 bg-red-950/10' 
            : currentResult.threatStatus === 'MENCURIGAKAN'
            ? 'border-amber-500/40 bg-amber-950/10'
            : 'border-srjgreen-500/40 bg-srjgreen-950/10'
        } space-y-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-charcoal-800">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  currentResult.threatStatus === 'BERBAHAYA' ? 'bg-red-500 text-white' :
                  currentResult.threatStatus === 'MENCURIGAKAN' ? 'bg-amber-500 text-charcoal-950 font-bold' :
                  'bg-srjgreen-500 text-charcoal-950 font-bold'
                }`}>
                  STATUS: {currentResult.threatStatus}
                </span>
                <span className="text-xs text-charcoal-400 font-mono">
                  Skor Risiko: <strong className="text-white">{currentResult.riskScore}/100</strong>
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-mono font-bold text-white mt-2 break-all">
                {currentResult.url}
              </h2>
            </div>

            <div className="text-right shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold ${
                currentResult.ssrfSafe 
                  ? 'bg-srjgreen-500/20 text-srjgreen-300 border border-srjgreen-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                <Lock className="w-3.5 h-3.5" />
                <span>{currentResult.ssrfSafe ? 'SSRF Aman (Public IP)' : 'BLOCKED: Internal IP'}</span>
              </span>
            </div>
          </div>

          {/* Diagnostics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Vendor Verdicts */}
            <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-2">
              <span className="text-charcoal-400 font-semibold uppercase tracking-wider text-[10px] block">
                Verifikasi Vendor Resmi
              </span>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-300">Google Safe Browsing:</span>
                <span className={`font-mono font-bold ${
                  currentResult.vendorResults?.googleSafeBrowsing?.status === 'SAFE' ? 'text-srjgreen-400' : 'text-red-400'
                }`}>
                  {currentResult.vendorResults?.googleSafeBrowsing?.status || 'SAFE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-300">VirusTotal Detection:</span>
                <span className="font-mono text-white">
                  {currentResult.vendorResults?.virusTotal?.positives || 0} / {currentResult.vendorResults?.virusTotal?.total || 90} Engines
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-300">Resolved IP:</span>
                <span className="font-mono text-charcoal-400">
                  {currentResult.ipAddress || '104.21.x.x'}
                </span>
              </div>
            </div>

            {/* Redirection Analysis */}
            <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-2">
              <span className="text-charcoal-400 font-semibold uppercase tracking-wider text-[10px] block">
                Analisis Pengalihan (Redirect Chain)
              </span>
              <div className="space-y-1">
                {currentResult.redirectChain.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px] text-charcoal-300 truncate">
                    <span className="text-charcoal-500">[{idx + 1}]</span>
                    <span className="truncate">{link}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sandbox Security Features */}
            <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-2">
              <span className="text-charcoal-400 font-semibold uppercase tracking-wider text-[10px] block">
                Proteksi Sandbox SRJ
              </span>
              <p className="text-[11px] text-charcoal-300 leading-relaxed">
                Pemindaian dieksekusi tanpa menjalankan skrip JavaScript berbahaya dari peretas, melindungi server bot dari kebocoran token atau serangan SSRF metadata.
              </p>
            </div>
          </div>

          {/* Threat Reasons Breakdown */}
          <div className="p-4 rounded-xl bg-charcoal-900/80 border border-charcoal-800">
            <span className="text-xs font-semibold text-white block mb-2">
              Indikator & Temuan Keamanan:
            </span>
            <ul className="space-y-1.5 text-xs">
              {currentResult.threatReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-charcoal-200">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Scanned History */}
      <div className="glass-panel p-5 rounded-2xl border-charcoal-800">
        <h3 className="text-sm font-bold text-white mb-3">Riwayat Pemindaian Terakhir</h3>
        <div className="divide-y divide-charcoal-800 text-xs">
          {recentScans.length === 0 ? (
            <p className="text-charcoal-400 text-xs py-4 text-center">Belum ada riwayat pemindaian pada sesi ini.</p>
          ) : (
            recentScans.map((scan) => (
              <div key={scan.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-white truncate text-[11px]">{scan.url}</p>
                  <p className="text-[10px] text-charcoal-400 font-mono">
                    Domain: {scan.domain} | IP: {scan.ipAddress || 'Auto'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    scan.threatStatus === 'BERBAHAYA' ? 'bg-red-500/20 text-red-300' :
                    scan.threatStatus === 'MENCURIGAKAN' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-srjgreen-500/20 text-srjgreen-300'
                  }`}>
                    {scan.threatStatus}
                  </span>
                  <button
                    onClick={() => setCurrentResult(scan)}
                    className="text-[11px] text-charcoal-400 hover:text-white"
                  >
                    Lihat
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
