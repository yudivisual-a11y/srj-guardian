'use client';

import React, { useState } from 'react';
import { 
  FlaskConical, 
  Send, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  HeartHandshake, 
  Scale, 
  CheckCircle2, 
  AlertTriangle,
  Code2,
  Trash2,
  Cpu
} from 'lucide-react';
import { PipelineResult } from '@/lib/pipeline';

export default function TestLabPage() {
  const [inputText, setInputText] = useState('');
  const [senderName, setSenderName] = useState('Ujang Uji Coba');
  const [senderPhone, setSenderPhone] = useState('+6281234567899');
  const [selectedGroup, setSelectedGroup] = useState('SUNDA RANTAU JOGJA (OFFICIAL PUSAT)');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);

  const presets = [
    {
      category: 'KEAMANAN: Phishing Rekening / DANA',
      title: 'Klaim Saldo DANA Kaget',
      text: 'SELAMAT AKANG TÈTÈH SRJ! Klaim saldo DANA Kaget 500rb akhir pekan di sini: https://dana-kaget-claim-saldo.xyz/login-otp masukkan PIN dan kode OTP sekarang juga!'
    },
    {
      category: 'KEAMANAN: Malware APK Sniffing',
      title: 'Undangan Pernikahan Palsu (.APK)',
      text: 'Punten akang teteh, nyuhunkeun pidu\'ana kanggo putra abi di lembur Tasik. Surat Undangan Pernikahan Digital: https://drive-cloud-download.online/Undangan_Nikah_Deden.apk mangga diunduh.'
    },
    {
      category: 'MODERASI: Flexing Melanggar Aturan',
      title: 'Pamer Saldo & Merendahkan UMR Jogja',
      text: 'Di Jogja mah murah banget euy, sehari jajan 5 juta aja enteng buat saya. Kalian yang masih kerja UMR jangan iri ya wkwkwk'
    },
    {
      category: 'MODERASI: Bersyukur (Bukan Flexing)',
      title: 'Ungkapan Syukur Wajar (Aman)',
      text: 'Alhamdulillah ya Allah, hatur nuhun pidu\'ana akang teteh sadayana, dinten ieu adi abi parantos wisuda di UGM. Mugia janten elmu nu barokah.'
    },
    {
      category: 'SOCIAL CARE: Pencari Kerja',
      title: 'Butuh Info Padamelan / Loker Jogja',
      text: 'Punten pisan akang teteh sadayana, pami aya info padamelan serabutan atanapi supir di Jogja mangga infona, abi peryogi pisan kumargi proyek kamari parantos rengse. Hatur nuhun pisan.'
    },
    {
      category: 'SOCIAL CARE: Kesehatan & Darurat',
      title: 'Sakit Parah Sendirian di Kosan Jogja',
      text: 'Punten akang teteh bilih aya nu caket Pogung Sleman, abdi muriang paranas tiris tos 3 dinten teu tiasa gugah, teu aya rencang di kosan. Bilih aya nu tiasa nulungan meli landong...'
    }
  ];

  const handleRunPipeline = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/pipeline/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          senderName,
          senderJid: `${senderPhone.replace(/[^0-9]/g, '')}@s.whatsapp.net`,
          groupName: selectedGroup,
          groupJid: '1203630491827361@g.us',
          messageId: `LAB-${Date.now()}`
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-srjgold-500/10 text-srjgold-400 border border-srjgold-500/20">
            <FlaskConical className="w-4 h-4" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            SRJ Guardian Test Lab & Pipeline Simulator
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-charcoal-400 mt-1">
          Simulasikan pesan grup secara langsung untuk memverifikasi logika AI Gemini, URL Security Scanner, deteksi Social Care, dan notifikasi admin tanpa mengganggu grup asli.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Presets & Custom Message (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preset Buttons */}
          <div className="glass-panel p-5 rounded-2xl border-charcoal-800 space-y-3">
            <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider block">
              Pilih Skenario Uji Cepat:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(p.text)}
                  className="p-3 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 text-left border border-charcoal-750 transition flex flex-col justify-between"
                >
                  <span className="text-[10px] font-mono text-srjgreen-400 font-semibold">{p.category}</span>
                  <span className="text-xs font-bold text-white mt-1">{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="glass-panel p-5 rounded-2xl border-charcoal-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-400 mb-1">
                  Nama Pengirim (Simulasi):
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-charcoal-900 border border-charcoal-750 text-white focus:outline-none focus:border-srjgreen-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-400 mb-1">
                  Nomor HP Pengirim:
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-charcoal-900 border border-charcoal-750 text-white focus:outline-none focus:border-srjgreen-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Teks Pesan Masuk dari Grup:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={4}
                placeholder="Ketik pesan atau klik tombol skenario di atas..."
                className="w-full p-3 text-xs sm:text-sm rounded-xl bg-charcoal-900 border border-charcoal-750 text-white placeholder-charcoal-500 focus:outline-none focus:border-srjgreen-500 leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-charcoal-400">
                Otomatis diuji dengan: URL Scanner, SSRF Guard, AI Gemini, & Sunda Rules.
              </span>
              <button
                onClick={handleRunPipeline}
                disabled={loading || !inputText.trim()}
                className="px-5 py-2.5 rounded-xl bg-srjgreen-600 hover:bg-srjgreen-500 disabled:opacity-50 text-charcoal-950 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-glow-green"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Jalankan Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Pipeline Output & Diagnostics (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border-charcoal-800 min-h-[460px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-srjgreen-400" />
                  <h3 className="text-sm font-bold text-white">Hasil Eksekusi Pipeline</h3>
                </div>
                {result && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-srjgreen-500/20 text-srjgreen-300">
                    200 OK
                  </span>
                )}
              </div>

              {!result && !loading && (
                <div className="py-20 text-center text-charcoal-500 text-xs">
                  Pilih salah satu skenario atau ketik pesan uji, lalu klik &quot;Jalankan Pipeline&quot; untuk melihat bagaimana sistem mendeteksi ancaman secara otomatis.
                </div>
              )}

              {loading && (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-srjgreen-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Memindai tautan, menganalisis bahasa Sunda/Indonesia via Gemini...</span>
                </div>
              )}

              {result && (
                <div className="mt-4 space-y-4 text-xs">
                  {/* Summary Verdict Pill */}
                  <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-750 flex items-center justify-between">
                    <span className="text-charcoal-400">Tindakan Sistem:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[11px] ${
                      result.actionTaken === 'MESSAGE_DELETED' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                        : result.actionTaken === 'REPORTED_ADMIN'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-srjgreen-500/20 text-srjgreen-300 border border-srjgreen-500/30'
                    }`}>
                      {result.actionTaken === 'MESSAGE_DELETED' ? '🚨 PESAN OTOMATIS DIHAPUS' :
                       result.actionTaken === 'REPORTED_ADMIN' ? '📩 DILAPORKAN KE ADMIN PRIBADI' :
                       '✅ PESAN AMAN (DIBIARKAN)'}
                    </span>
                  </div>

                  {/* Security Threat Verdict */}
                  {result.securityIncident && (
                    <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/50 space-y-1.5">
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <ShieldAlert className="w-4 h-4" />
                        <span>ANCAMAN KEAMANAN TERDETEKSI: {result.securityIncident.threatType}</span>
                      </div>
                      <p className="text-charcoal-200 leading-relaxed text-[11px]">
                        {result.securityIncident.aiAnalysis}
                      </p>
                    </div>
                  )}

                  {/* Social Care Verdict */}
                  {result.helpReport && (
                    <div className="p-3.5 rounded-xl bg-srjgold-500/10 border border-srjgold-500/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-srjgold-400 font-bold">
                        <HeartHandshake className="w-4 h-4" />
                        <span>AI SOCIAL CARE: KEBUTUHAN BANTUAN ({result.helpReport.category})</span>
                      </div>
                      <p className="text-charcoal-200 text-[11px]">
                        {result.helpReport.summary}
                      </p>
                      <span className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-charcoal-900 text-srjgold-300">
                        Urgensi: {result.helpReport.urgency}
                      </span>
                    </div>
                  )}

                  {/* Moderation Verdict */}
                  {result.moderationLog && (
                    <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/50 space-y-1.5">
                      <div className="flex items-center gap-2 text-purple-400 font-bold">
                        <Scale className="w-4 h-4" />
                        <span>ATURAN GRUP: {result.moderationLog.ruleViolation}</span>
                      </div>
                      <p className="text-charcoal-200 text-[11px]">
                        {result.moderationLog.contextAnalysis}
                      </p>
                    </div>
                  )}

                  {/* URL Scans Detected */}
                  {result.processedUrls && result.processedUrls.length > 0 && (
                    <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-2">
                      <span className="text-charcoal-400 font-semibold block text-[10px] uppercase">
                        Tautan yang Dipindai Otomatis:
                      </span>
                      {result.processedUrls.map((u, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 font-mono text-[11px]">
                          <span className="truncate text-charcoal-300">{u.url}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.threatStatus === 'BERBAHAYA' ? 'bg-red-500 text-white' :
                            u.threatStatus === 'MENCURIGAKAN' ? 'bg-amber-500 text-charcoal-950' :
                            'bg-srjgreen-500 text-charcoal-950'
                          }`}>
                            {u.threatStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {result && (
              <div className="pt-3 border-t border-charcoal-800 text-[11px] text-charcoal-400 flex items-center justify-between">
                <span>Data telah dicatat ke database SRJ.</span>
                <span className="text-srjgreen-400 font-mono">Status: PROCESSED</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
