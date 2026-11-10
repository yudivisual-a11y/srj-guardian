'use client';

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Info, 
  ShieldCheck, 
  Radio, 
  Send,
  Trash2,
  Lock,
  Users,
  Settings2,
  Camera,
  Plus,
  KeyRound,
  Copy,
  Check,
  Search,
  ShieldAlert
} from 'lucide-react';
import { WhatsAppConnection, MonitoredGroup } from '@/types';

export default function WhatsAppPage() {
  const [conn, setConn] = useState<(WhatsAppConnection & { qrCodeDataUrl?: string; pairingCode?: string }) | null>(null);
  const [groups, setGroups] = useState<MonitoredGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'CONNECTION' | 'GROUPS' | 'ARCHITECTURE'>('CONNECTION');
  const [testMsgStatus, setTestMsgStatus] = useState<string | null>(null);

  // Pairing Mode Choice: 'CODE' or 'QR'
  const [pairingMethod, setPairingMethod] = useState<'CODE' | 'QR'>('CODE');
  const [botPhoneNumber, setBotPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [codeError, setCodeError] = useState('');

  // New Group Form State
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupJid, setNewGroupJid] = useState('');
  const [newGroupRules, setNewGroupRules] = useState('Silih Asah, Silih Asih, Silih Asuh. Dilarang flexing sombong.');
  const [autoDeleteThreats, setAutoDeleteThreats] = useState(true);

  // Search & Filter State for Groups
  const [groupSearch, setGroupSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const fetchData = async () => {
    try {
      const [connRes, grpRes] = await Promise.all([
        fetch('/api/whatsapp').then(r => r.json()),
        fetch('/api/groups').then(r => r.json()),
      ]);

      if (connRes.data) {
        setConn(connRes.data);
        if (connRes.data.pairingCode && !pairingCode) {
          setPairingCode(connRes.data.pairingCode);
        }
      }
      if (grpRes.data) setGroups(grpRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Poll status while not CONNECTED to auto-detect QR, pairing code, and connection status
  useEffect(() => {
    let interval: any;
    if (conn?.status !== 'CONNECTED') {
      interval = setInterval(() => {
        fetch('/api/whatsapp')
          .then(r => r.json())
          .then(res => {
            if (res.data) {
              setConn(res.data);
              if (res.data.pairingCode) {
                setPairingCode(res.data.pairingCode);
              }
              if (res.data.status === 'CONNECTED') {
                clearInterval(interval);
                fetchData();
              }
            }
          })
          .catch(() => {});
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [conn?.status]);

  const handleStartQrPairing = async () => {
    setPairingLoading(true);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START_PAIRING' }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPairingLoading(false);
    }
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botPhoneNumber.trim()) {
      setCodeError('Masukkan nomor WhatsApp bot Anda.');
      return;
    }

    setCodeError('');
    setPairingLoading(true);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'REQUEST_PAIRING_CODE',
          phoneNumber: botPhoneNumber.trim()
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.pairingCode) {
        setPairingCode(json.data.pairingCode);
        await fetchData();
      } else {
        setCodeError(json.error || 'Gagal meminta kode pairing. Pastikan nomor diawali kode negara (+62).');
      }
    } catch (err: any) {
      setCodeError(err.message || 'Koneksi ke server bot gagal.');
    } finally {
      setPairingLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Apakah Anda yakin ingin memutuskan sesi WhatsApp bot SRJ GUARDIAN?')) return;
    try {
      const res = await fetch('/api/whatsapp', { method: 'DELETE' });
      if (res.ok) {
        setPairingCode(null);
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleGroup = async (groupId: string) => {
    try {
      const res = await fetch('/api/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });
      if (res.ok) await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName: newGroupName.trim(),
          groupJid: newGroupJid.trim() || `${Date.now()}@g.us`,
          rulesSummary: newGroupRules.trim(),
          autoDeleteThreats
        }),
      });

      if (res.ok) {
        setNewGroupName('');
        setNewGroupJid('');
        setShowAddGroup(false);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTestAlert = async () => {
    setTestMsgStatus('Mengirim notifikasi ke WA Admin...');
    try {
      const res = await fetch('/api/pipeline/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'UJI SISTEM SRJ: Klaim Saldo DANA Kaget 500rb https://dana-kaget-claim-saldo.xyz/login-otp',
          senderName: 'Uji Hansip SRJ',
          senderJid: '62800000000@s.whatsapp.net',
          messageId: `TEST-${Date.now()}`
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTestMsgStatus('Notifikasi uji berhasil diproses & dikirim ke WhatsApp pribadi admin!');
        setTimeout(() => setTestMsgStatus(null), 4000);
      }
    } catch (e) {
      setTestMsgStatus('Gagal mengirim notifikasi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Smartphone className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Koneksi WhatsApp Real-Time
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-400 mt-1">
            Hubungkan nomor WhatsApp asli Anda menggunakan Kode Pairing (tanpa kamera) atau Scan QR Code.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-charcoal-900 p-1 rounded-xl border border-charcoal-800">
          <button
            onClick={() => setActiveTab('CONNECTION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'CONNECTION' ? 'bg-charcoal-750 text-white shadow-sm' : 'text-charcoal-400 hover:text-white'
            }`}
          >
            Koneksi Bot
          </button>
          <button
            onClick={() => setActiveTab('GROUPS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'GROUPS' ? 'bg-charcoal-750 text-white shadow-sm' : 'text-charcoal-400 hover:text-white'
            }`}
          >
            Grup Dipantau ({groups.length})
          </button>
          <button
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'ARCHITECTURE' ? 'bg-srjgold-500/20 text-srjgold-300 shadow-sm' : 'text-charcoal-400 hover:text-white'
            }`}
          >
            Analisis Teknis API
          </button>
        </div>
      </div>

      {/* TAB 1: CONNECTION */}
      {activeTab === 'CONNECTION' && (
        <div className="space-y-6">
          {/* Main Status Card */}
          <div className="glass-panel p-6 rounded-2xl border-charcoal-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-800">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  conn?.status === 'CONNECTED' 
                    ? 'bg-srjgreen-500/20 text-srjgreen-400 border border-srjgreen-500/30 shadow-glow-green' 
                    : conn?.status === 'PAIRING'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    : 'bg-charcoal-800 text-charcoal-400 border border-charcoal-700'
                }`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      BOT SRJ GUARDIAN
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase ${
                      conn?.status === 'CONNECTED' ? 'bg-srjgreen-500/20 text-srjgreen-300 border border-srjgreen-500/30' :
                      conn?.status === 'PAIRING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {conn?.status || 'DISCONNECTED'}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-400 font-mono mt-0.5">
                    Nomor Terhubung: <strong className="text-white">{conn?.phoneNumber || 'Belum Terhubung'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {conn?.status === 'CONNECTED' && (
                  <>
                    <button
                      onClick={handleSendTestAlert}
                      className="px-3.5 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-white text-xs font-semibold border border-charcoal-750 transition flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5 text-srjgreen-400" />
                      <span>Uji Notifikasi WA Admin</span>
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-800 transition"
                    >
                      Putuskan Sesi
                    </button>
                  </>
                )}
              </div>
            </div>

            {testMsgStatus && (
              <div className="p-3 rounded-xl bg-charcoal-850 border border-srjgreen-500/30 text-xs text-srjgreen-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{testMsgStatus}</span>
              </div>
            )}

            {/* Diagnostics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1">
                <span className="text-charcoal-400">Metode Pairing:</span>
                <p className="font-semibold text-white">Kode Telepon (8-Digit) & QR</p>
                <p className="text-[10px] text-charcoal-500">Mendukung koneksi tanpa kamera</p>
              </div>

              <div className="p-3.5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1">
                <span className="text-charcoal-400">Izin Hapus Pesan:</span>
                <p className="font-semibold text-srjgreen-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Siap (Saat Dijadikan Admin)</span>
                </p>
                <p className="text-[10px] text-charcoal-500">Auto-delete ancaman berbahaya aktif</p>
              </div>

              <div className="p-3.5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1">
                <span className="text-charcoal-400">Pembaruan Terakhir:</span>
                <p className="font-mono text-white">
                  {conn?.lastConnectedAt ? new Date(conn.lastConnectedAt).toLocaleTimeString('id-ID') : 'Standby'} WIB
                </p>
                <p className="text-[10px] text-charcoal-500">Worker aktif di background</p>
              </div>
            </div>
          </div>

          {/* PAIRING PANEL (IF NOT CONNECTED) */}
          {conn?.status !== 'CONNECTED' && (
            <div className="glass-panel p-6 rounded-2xl border-charcoal-800 space-y-5">
              {/* Method Selector Tabs */}
              <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Pilih Cara Menghubungkan Bot</h3>
                  <p className="text-xs text-charcoal-400 mt-0.5">
                    Bisa menggunakan 8-digit kode angka di HP (tanpa scan kamera) atau scan QR Code konvensional.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-charcoal-900 p-1 rounded-xl border border-charcoal-750">
                  <button
                    onClick={() => setPairingMethod('CODE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      pairingMethod === 'CODE' 
                        ? 'bg-srjgreen-600 text-charcoal-950 shadow-glow-green' 
                        : 'text-charcoal-300 hover:text-white'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Pakai Kode Angka</span>
                  </button>
                  <button
                    onClick={() => {
                      setPairingMethod('QR');
                      handleStartQrPairing();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      pairingMethod === 'QR' 
                        ? 'bg-srjgreen-600 text-charcoal-950 shadow-glow-green' 
                        : 'text-charcoal-300 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan QR Code</span>
                  </button>
                </div>
              </div>

              {/* OPTION 1: PAIRING CODE (KODE ANGKA TANPA KAMERA) */}
              {pairingMethod === 'CODE' && (
                <div className="space-y-4 pt-1">
                  {!pairingCode ? (
                    <form onSubmit={handleRequestPairingCode} className="max-w-xl space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                          Masukkan Nomor WhatsApp Bot Anda:
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="Contoh: +6281234567890 atau 081234567890"
                            value={botPhoneNumber}
                            onChange={(e) => setBotPhoneNumber(e.target.value)}
                            required
                            className="flex-1 px-4 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white font-mono text-sm focus:outline-none focus:border-srjgreen-500"
                          />
                          <button
                            type="submit"
                            disabled={pairingLoading}
                            className="px-5 py-2.5 rounded-xl bg-srjgreen-600 hover:bg-srjgreen-500 disabled:opacity-50 text-charcoal-950 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-glow-green"
                          >
                            {pairingLoading ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Meminta Kode...</span>
                              </>
                            ) : (
                              <>
                                <KeyRound className="w-4 h-4" />
                                <span>Dapatkan Kode Pairing</span>
                              </>
                            )}
                          </button>
                        </div>
                        {codeError && (
                          <p className="text-xs text-red-400 font-medium mt-1">⚠️ {codeError}</p>
                        )}
                        <p className="text-[11px] text-charcoal-400 mt-2">
                          Gunakan format dengan kode negara (contoh: <code>+6281234567890</code>). Sistem akan meminta kode autentikasi 8 digit langsung dari server WhatsApp.
                        </p>
                      </div>
                    </form>
                  ) : (
                    /* Display Pairing Code Box */
                    <div className="p-6 rounded-2xl bg-charcoal-900 border border-srjgreen-500/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-srjgreen-400 uppercase tracking-wider">
                          Kode Pairing WhatsApp Anda:
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-srjgreen-500/20 text-srjgreen-300 animate-pulse">
                          Menunggu Masukan di HP...
                        </span>
                      </div>

                      {/* Giant Code Display */}
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="px-6 py-4 rounded-2xl bg-charcoal-950 border border-charcoal-750 font-mono text-3xl sm:text-4xl font-extrabold text-srjgreen-400 tracking-widest selection:bg-srjgreen-500/30">
                          {pairingCode}
                        </div>

                        <button
                          onClick={handleCopyCode}
                          className="px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-white text-xs font-semibold border border-charcoal-700 transition flex items-center gap-2"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 text-srjgreen-400" />
                              <span className="text-srjgreen-400">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Salin Kode</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Instructions */}
                      <div className="p-4 rounded-xl bg-charcoal-850 border border-charcoal-750 space-y-2 text-xs text-charcoal-300">
                        <p className="font-bold text-white text-xs">
                          Langkah di HP WhatsApp Anda:
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5">
                          <li>Buka WhatsApp di ponsel nomor bot <strong>{botPhoneNumber}</strong>.</li>
                          <li>Buka menu <strong>Perangkat Tertaut (Linked Devices)</strong> &gt; ketuk <strong>Tautkan Perangkat</strong>.</li>
                          <li>Ketuk tulisan di bagian bawah: <strong>&quot;Tautkan dengan nomor telepon saja&quot; (Link with phone number instead)</strong>.</li>
                          <li>Ketikkan kode 8 digit di atas: <code className="font-bold text-srjgreen-400 bg-charcoal-900 px-1.5 py-0.5 rounded">{pairingCode}</code>.</li>
                        </ol>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[11px] text-charcoal-400">
                          💡 Setelah Anda memasukkan kode di HP, dashboard ini akan otomatis berubah menjadi <span className="text-srjgreen-400 font-semibold">CONNECTED</span> dalam 2 detik.
                        </p>
                        <button
                          onClick={() => {
                            setPairingCode(null);
                            setBotPhoneNumber('');
                          }}
                          className="text-xs text-charcoal-400 hover:text-white underline"
                        >
                          Ganti Nomor Lain
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OPTION 2: QR CODE */}
              {pairingMethod === 'QR' && (
                <div className="space-y-4 pt-1">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center shrink-0">
                      {conn?.qrCodeDataUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={conn.qrCodeDataUrl} 
                          alt="WhatsApp Multi-Device QR Code" 
                          key={conn.qrCodeDataUrl.slice(-30)}
                          className="w-64 h-64 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-64 h-64 flex flex-col items-center justify-center text-charcoal-700 text-xs gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-charcoal-800" />
                          <span>Membangkitkan QR WhatsApp dari server...</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 text-xs flex-1">
                      <div className="p-4 rounded-xl bg-charcoal-850 border border-charcoal-750 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-white text-xs">
                            Cara Scan QR di HP WhatsApp:
                          </p>
                          <button
                            onClick={handleStartQrPairing}
                            disabled={pairingLoading}
                            className="px-2.5 py-1 rounded-lg bg-charcoal-750 hover:bg-charcoal-700 text-charcoal-200 text-[11px] font-semibold border border-charcoal-600 transition flex items-center gap-1.5"
                          >
                            <RefreshCw className={`w-3 h-3 ${pairingLoading ? 'animate-spin' : ''}`} />
                            <span>Segarkan QR Baru</span>
                          </button>
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 text-charcoal-300">
                          <li>Buka aplikasi WhatsApp di ponsel nomor bot Anda.</li>
                          <li>Buka menu <strong>Titik Tiga (Android)</strong> atau <strong>Pengaturan (iPhone)</strong> &gt; pilih <strong>Perangkat Tertaut</strong>.</li>
                          <li>Ketuk tombol hijau <strong>Tautkan Perangkat</strong>.</li>
                          <li>Arahkan kamera HP ke gambar QR di sebelah kiri.</li>
                        </ol>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>Tips jika scan belum terbaca:</strong> Pastikan tingkat kecerahan layar laptop cukup terang dan tidak ada pantulan cahaya lampu di kamera HP. Atau gunakan tab <strong>&quot;Pakai Kode Angka&quot;</strong> yang jauh lebih cepat dan anti-gagal.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MONITORED GROUPS */}
      {activeTab === 'GROUPS' && (() => {
        const activeCount = groups.filter(g => g.isActive).length;
        const inactiveCount = groups.length - activeCount;
        const filteredGroups = groups.filter(grp => {
          const matchesSearch = !groupSearch || 
            grp.groupName.toLowerCase().includes(groupSearch.toLowerCase()) ||
            grp.groupJid.includes(groupSearch);
          if (!matchesSearch) return false;
          if (groupFilter === 'ACTIVE') return grp.isActive;
          if (groupFilter === 'INACTIVE') return !grp.isActive;
          return true;
        });

        const handleDeactivateAll = async () => {
          if (!confirm('Apakah Anda yakin ingin menonaktifkan pemantauan pada SEMUA grup?')) return;
          for (const g of groups) {
            if (g.isActive) {
              await fetch('/api/groups', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupId: g.id })
              }).catch(() => {});
            }
          }
          await fetchData();
        };

        return (
          <div className="space-y-4">
            {/* Privacy Notification Banner */}
            <div className="p-4 rounded-2xl bg-charcoal-900 border border-srjgreen-500/30 flex items-start gap-3 shadow-lg">
              <ShieldCheck className="w-5 h-5 text-srjgreen-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm">
                    {groups.length} Grup Terdeteksi dari Akun WhatsApp Bot
                  </p>
                  <span className="px-2 py-0.5 rounded-full bg-srjgreen-500/20 text-srjgreen-300 border border-srjgreen-500/30 font-mono text-[10px] font-bold">
                    {activeCount} Aktif Dipantau
                  </span>
                </div>
                <p className="text-charcoal-300 leading-relaxed">
                  Demi privasi obrolan Anda, semua grup baru yang terdeteksi disetel <strong className="text-amber-400">NONAKTIF</strong> secara default. AI SRJ GUARDIAN <strong>tidak akan membaca atau memantau pesan</strong> di grup yang nonaktif.
                </p>
                <p className="text-charcoal-400 text-[11px]">
                  💡 <strong>Cara Menggunakan:</strong> Cari grup paguyuban Anda (misal: <em>SUNDA RANTAU JOGJA</em>), lalu ketuk tombol hijau <strong className="text-srjgreen-400">&quot;Aktifkan Pemantauan&quot;</strong>.
                </p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-charcoal-800 space-y-4">
              {/* Header with Search and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-charcoal-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-srjgreen-400" />
                  <h3 className="text-sm font-bold text-white">Kelola Pemantauan Grup</h3>
                </div>

                <div className="flex items-center gap-2">
                  {activeCount > 0 && (
                    <button
                      onClick={handleDeactivateAll}
                      className="px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-red-950/40 text-charcoal-400 hover:text-red-300 text-xs font-semibold border border-charcoal-700 hover:border-red-800 transition"
                    >
                      Nonaktifkan Semua ({activeCount})
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddGroup(!showAddGroup)}
                    className="px-3 py-1.5 rounded-xl bg-srjgreen-600 hover:bg-srjgreen-500 text-charcoal-950 font-bold text-xs transition flex items-center gap-1.5 shadow-glow-green"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Manual</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-charcoal-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama grup atau ID JID (misal: Sunda, Jogja, Rantau)..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-charcoal-900 border border-charcoal-750 text-white text-xs placeholder:text-charcoal-500 focus:outline-none focus:border-srjgreen-500"
                  />
                  {groupSearch && (
                    <button
                      onClick={() => setGroupSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-charcoal-900 p-1 rounded-xl border border-charcoal-750 shrink-0 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => setGroupFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      groupFilter === 'ALL' 
                        ? 'bg-charcoal-750 text-white shadow-sm' 
                        : 'text-charcoal-400 hover:text-white'
                    }`}
                  >
                    Semua ({groups.length})
                  </button>
                  <button
                    onClick={() => setGroupFilter('ACTIVE')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      groupFilter === 'ACTIVE' 
                        ? 'bg-srjgreen-600 text-charcoal-950 font-bold shadow-glow-green' 
                        : 'text-charcoal-400 hover:text-white'
                    }`}
                  >
                    Aktif ({activeCount})
                  </button>
                  <button
                    onClick={() => setGroupFilter('INACTIVE')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      groupFilter === 'INACTIVE' 
                        ? 'bg-charcoal-750 text-white shadow-sm' 
                        : 'text-charcoal-400 hover:text-white'
                    }`}
                  >
                    Nonaktif ({inactiveCount})
                  </button>
                </div>
              </div>

              {/* Add Group Form */}
              {showAddGroup && (
                <form onSubmit={handleCreateGroup} className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-750 space-y-3 text-xs">
                  <h4 className="font-bold text-white text-xs">Pendaftaran Grup Baru</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-charcoal-400 font-semibold mb-1">Nama Grup WhatsApp:</label>
                      <input
                        type="text"
                        placeholder="Contoh: SUNDA RANTAU JOGJA (SRJ)"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-charcoal-850 border border-charcoal-700 text-white focus:outline-none focus:border-srjgreen-500"
                      />
                    </div>
                    <div>
                      <label className="block text-charcoal-400 font-semibold mb-1">Group JID (Opsional / Otomatis):</label>
                      <input
                        type="text"
                        placeholder="Contoh: 1203630491827361@g.us (atau biarkan kosong)"
                        value={newGroupJid}
                        onChange={(e) => setNewGroupJid(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-charcoal-850 border border-charcoal-700 text-white font-mono focus:outline-none focus:border-srjgreen-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">Ringkasan Aturan Grup:</label>
                    <input
                      type="text"
                      value={newGroupRules}
                      onChange={(e) => setNewGroupRules(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-charcoal-850 border border-charcoal-700 text-white focus:outline-none focus:border-srjgreen-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-charcoal-300">
                      <input
                        type="checkbox"
                        checked={autoDeleteThreats}
                        onChange={(e) => setAutoDeleteThreats(e.target.checked)}
                        className="rounded text-srjgreen-500"
                      />
                      <span>Otomatis Hapus Link Berbahaya / APK Jahat</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddGroup(false)}
                        className="px-3 py-1.5 rounded-lg bg-charcoal-800 text-charcoal-300 hover:text-white"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-srjgreen-600 hover:bg-srjgreen-500 text-charcoal-950 font-bold"
                      >
                        Simpan Grup
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Groups List */}
              {filteredGroups.length === 0 ? (
                <div className="py-12 text-center text-charcoal-400 text-xs space-y-2">
                  <Users className="w-8 h-8 mx-auto text-charcoal-600" />
                  <p className="font-semibold text-white">
                    {groupSearch ? 'Tidak ada grup yang cocok dengan pencarian' : 'Belum Ada Grup'}
                  </p>
                  <p className="text-[11px] text-charcoal-500 max-w-sm mx-auto">
                    {groupSearch ? `Coba gunakan kata kunci lain selain "${groupSearch}".` : 'Grup WhatsApp akan otomatis muncul setelah nomor bot terhubung.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGroups.map((grp) => (
                    <div 
                      key={grp.id}
                      className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        grp.isActive 
                          ? 'bg-srjgreen-950/20 border-srjgreen-500/40 shadow-sm' 
                          : 'bg-charcoal-850/60 border-charcoal-750/70 hover:border-charcoal-700'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{grp.groupName}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            grp.isActive 
                              ? 'bg-srjgreen-500/20 text-srjgreen-300 border border-srjgreen-500/40' 
                              : 'bg-charcoal-800 text-charcoal-400 border border-charcoal-700'
                          }`}>
                            {grp.isActive ? 'AKTIF DIPANTAU 🛡️' : 'NONAKTIF (AMAN)'}
                          </span>
                          {grp.autoDeleteThreats && grp.isActive && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              AUTO-DELETE ON
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-charcoal-500">{grp.groupJid}</p>
                        <p className="text-xs text-charcoal-300 line-clamp-1">{grp.rulesSummary}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right text-[11px] hidden sm:block">
                          <span className="text-charcoal-400 block text-[10px]">Perlindungan:</span>
                          <span className={`font-mono text-xs ${grp.isActive ? 'text-srjgreen-400 font-semibold' : 'text-charcoal-500'}`}>
                            {grp.isActive ? 'Anti-Scam • Social Care • Auto-Mod' : 'Pemantauan Dijeda'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleToggleGroup(grp.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            grp.isActive 
                              ? 'bg-charcoal-800 text-charcoal-300 hover:bg-red-950/60 hover:text-red-300 border border-charcoal-700 hover:border-red-800' 
                              : 'bg-srjgreen-600 hover:bg-srjgreen-500 text-charcoal-950 shadow-glow-green'
                          }`}
                        >
                          {grp.isActive ? (
                            <span>Nonaktifkan</span>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Aktifkan Pemantauan</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* TAB 3: ARCHITECTURE */}
      {activeTab === 'ARCHITECTURE' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border-srjgold-500/30 bg-charcoal-900/90 space-y-4">
            <div className="flex items-center gap-2 text-srjgold-400">
              <Info className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">
                Analisis Resmi WhatsApp Business API vs Multi-Device
              </h3>
            </div>
            <p className="text-xs text-charcoal-300 leading-relaxed">
              Sesuai instruksi proyek, sistem ini menggunakan arsitektur <strong>Multi-Device Socket</strong> karena API resmi Cloud API Meta tidak mengizinkan pemantauan grup WhatsApp biasa yang dibuat secara mandiri oleh pengguna.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
