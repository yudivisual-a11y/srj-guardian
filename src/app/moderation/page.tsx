'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquareWarning, 
  Send, 
  UserX, 
  Check, 
  Info,
  Shield,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { ModerationLog, RuleViolationType } from '@/types';

export default function ModerationPage() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [filterRule, setFilterRule] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<ModerationLog | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/moderation');
      const json = await res.json();
      if (json.data) setLogs(json.data);
    } catch (e) {
      console.error('Failed fetching moderation logs:', e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus data log moderasi ini?')) return;
    try {
      const res = await fetch(`/api/moderation?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchLogs();
        if (selectedLog?.id === id) {
          setSelectedLog(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA riwayat log moderasi? Data tidak dapat dikembalikan.')) return;
    try {
      const res = await fetch('/api/moderation?all=true', { method: 'DELETE' });
      if (res.ok) {
        await fetchLogs();
        setSelectedLog(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecision = async (id: string, decision: ModerationLog['adminDecision']) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/moderation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          decision, 
          reviewedBy: 'Kang Asep (Ketua SRJ)' 
        }),
      });
      if (res.ok) {
        await fetchLogs();
        setSelectedLog(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const getRuleDetails = (rule: RuleViolationType) => {
    switch (rule) {
      case 'FLEXING':
        return { label: 'Flexing / Pamer Sombong', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'INSULT':
        return { label: 'Penghinaan / Ujaran Kasar', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
      case 'JUDI_ONLINE':
        return { label: 'Judi Online / Slot Gacor', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
      case 'INAPPROPRIATE_BEHAVIOR':
        return { label: 'Ajakan Tidak Pantas / Dugem / Mabuk', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'PROVOCATION':
        return { label: 'Provokasi / Adu Domba', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
      case 'BULLYING':
        return { label: 'Perundungan Anggota', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'SPAM_PROMO':
        return { label: 'Spam / Promo Berlebihan', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      default:
        return { label: 'Pelanggaran Etika Silih Asih', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
    }
  };

  const filtered = logs.filter(item => {
    if (filterRule === 'ALL') return true;
    return item.ruleViolation === filterRule;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-srjgreen-500/10 text-srjgreen-400 border border-srjgreen-500/20">
              <Scale className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Aktivitas Moderator & Kepatuhan Aturan Grup
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-400 mt-1">
            Penegakan aturan grup Sunda Rantau Jogja berbasis AI dengan pemahaman konteks, empati perantau, dan sanksi di tangan admin.
          </p>
        </div>

        {/* Filter Rule & Actions */}
        <div className="flex items-center gap-2">
          <select
            value={filterRule}
            onChange={(e) => setFilterRule(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-xl bg-charcoal-900 border border-charcoal-750 text-charcoal-200 focus:outline-none focus:border-srjgreen-500"
          >
            <option value="ALL">Semua Jenis Pelanggaran</option>
            <option value="JUDI_ONLINE">Judi Online / Judol / Slot</option>
            <option value="INAPPROPRIATE_BEHAVIOR">Ajakan Dugem / Mabuk / Maksiat</option>
            <option value="FLEXING">Dugaan Flexing (Pamer Sombong)</option>
            <option value="PROVOCATION">Provokasi & Konflik</option>
            <option value="INSULT">Penghinaan & Kata Kasar</option>
            <option value="BULLYING">Perundungan Anggota</option>
            <option value="SPAM_PROMO">Spam & Promo Berlebihan</option>
          </select>

          {logs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl bg-charcoal-900 hover:bg-red-950/60 text-charcoal-400 hover:text-red-300 text-xs font-semibold border border-charcoal-750 hover:border-red-800 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Semua ({logs.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Admin Commands Reference Card */}
      <div className="p-4 rounded-2xl bg-charcoal-900 border border-charcoal-750 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-srjgold-500/20 text-srjgold-400">
              <Shield className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Daftar Kode Pemanggilan Bot Cepat (bot 01 - bot 05)
            </h3>
          </div>
          <span className="text-[10px] text-charcoal-500 hidden sm:inline">Balas (reply / quote) pesan yang melanggar di grup</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-charcoal-850 border border-charcoal-750 flex items-start gap-2">
            <code className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono font-bold text-[11px] shrink-0">
              bot 01
            </code>
            <div className="space-y-0.5">
              <p className="font-semibold text-white text-[11px]">Hapus Kata Kasar + Etika Tutur Kata</p>
              <p className="text-[10px] text-charcoal-400">Hapus makian/kata kotor & bot kirim pepeling Silih Asah Asih Asuh.</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-charcoal-850 border border-charcoal-750 flex items-start gap-2">
            <code className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px] shrink-0">
              bot 02
            </code>
            <div className="space-y-0.5">
              <p className="font-semibold text-white text-[11px]">Hapus Penipuan / Saldo Palsu</p>
              <p className="text-[10px] text-charcoal-400">Hapus link scam/saldo masuk & kirim peringatan proteksi rekening siber.</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-charcoal-850 border border-charcoal-750 flex items-start gap-2">
            <code className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-[11px] shrink-0">
              bot 03
            </code>
            <div className="space-y-0.5">
              <p className="font-semibold text-white text-[11px]">Hapus Ajakan Dugem / Miras / Judi</p>
              <p className="text-[10px] text-charcoal-400">Hapus konten maksiat & beri peringatan tegas penegakan aturan paguyuban.</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-charcoal-850 border border-charcoal-750 flex items-start gap-2">
            <code className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold text-[11px] shrink-0">
              bot 04
            </code>
            <div className="space-y-0.5">
              <p className="font-semibold text-white text-[11px]">Daftar Menu Panduan Bot</p>
              <p className="text-[10px] text-charcoal-400">Ketik bot 04 atau bot menu untuk menampilkan daftar perintah bot.</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-charcoal-850 border border-charcoal-750 flex items-start gap-2 sm:col-span-2 lg:col-span-2">
            <code className="px-1.5 py-0.5 rounded bg-srjgreen-500/20 text-srjgreen-300 font-mono font-bold text-[11px] shrink-0">
              bot 05
            </code>
            <div className="space-y-0.5">
              <p className="font-semibold text-white text-[11px]">Tandai Anggota Butuh Bantuan (Social Care)</p>
              <p className="text-[10px] text-charcoal-400">Teruskan curhatan anggota yang butuh kerjaan/sakit/musibah ke antrean Social Care.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Rules Reminder Box */}
      <div className="glass-panel p-4 rounded-xl border-srjgreen-500/20 bg-srjgreen-950/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-srjgreen-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-white">
              Pedoman AI Moderator: Adil, Berimbang, Tidak Mudah Memvonis
            </p>
            <p className="text-charcoal-300">
              AI diinstruksikan untuk tidak menganggap ucapan syukur atau kelulusan sebagai flexing. Semua sanksi membutuhkan persetujuan manusia (human-in-the-loop) demi menjaga ukhuwah & silaturahmi.
            </p>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-charcoal-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-charcoal-800 bg-charcoal-900/80 text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pengirim & Grup</th>
                <th className="py-3 px-4">Aturan Terindikasi</th>
                <th className="py-3 px-4">Kutipan Pesan</th>
                <th className="py-3 px-4">Analisis Konteks AI</th>
                <th className="py-3 px-4">Keputusan Admin</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400 text-xs">
                    Tidak ada catatan pelanggaran yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const rule = getRuleDetails(item.ruleViolation);

                  return (
                    <tr key={item.id} className="hover:bg-charcoal-850/50 transition">
                      <td className="py-3.5 px-4 font-mono text-charcoal-400 text-[11px] whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{item.senderName}</div>
                        <div className="text-[10px] font-mono text-charcoal-400">{item.groupName}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rule.color}`}>
                          {rule.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="truncate italic text-charcoal-300 text-[11px] bg-charcoal-900/60 p-1.5 rounded border border-charcoal-800">
                          &ldquo;{item.rawContent}&rdquo;
                        </p>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="line-clamp-2 text-charcoal-300 text-[11px]">
                          {item.contextAnalysis}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.adminDecision === 'WARNED_PRIVATELY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          item.adminDecision === 'SANCTIONED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          item.adminDecision === 'NO_ACTION' ? 'bg-charcoal-800 text-charcoal-300' :
                          'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {item.adminDecision}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedLog(item)}
                            className="px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-750 text-white text-[11px] font-medium border border-charcoal-700 transition"
                          >
                            Tinjau
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            title="Hapus Log Ini"
                            className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-red-950/70 text-charcoal-400 hover:text-red-300 border border-charcoal-750 hover:border-red-800/80 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Review Moderation */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-charcoal-750 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-srjgreen-400" />
                <h3 className="text-base font-bold text-white">Tinjauan Etika & Aturan Grup</h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-charcoal-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-800">
                <p className="font-semibold text-white">{selectedLog.senderName} ({selectedLog.senderJid})</p>
                <p className="text-charcoal-300 mt-1 italic">&ldquo;{selectedLog.rawContent}&rdquo;</p>
              </div>

              <div className="p-3 rounded-xl bg-charcoal-850 border border-charcoal-750">
                <span className="text-srjgreen-400 font-semibold block mb-1">Analisis Konteks AI:</span>
                <p className="text-charcoal-200 leading-relaxed">
                  {selectedLog.contextAnalysis}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-800 text-charcoal-300">
                <p className="font-semibold text-white mb-1">Pilihan Tindakan Admin:</p>
                <p className="text-[11px]">
                  Pilihlah tindakan yang mendidik sesuai asas <i>Silih Asah Silih Asih</i>. Jika sekadar candaan atau salah paham, pilih &quot;Abaikan&quot;. Jika perlu diingatkan, pilih &quot;Tegur Japri&quot;.
                </p>
              </div>

              <div className="pt-3 border-t border-charcoal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  onClick={() => handleDelete(selectedLog.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-800 transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Log Ini</span>
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    disabled={updatingId === selectedLog.id}
                    onClick={() => handleDecision(selectedLog.id, 'NO_ACTION')}
                    className="px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-750 text-charcoal-300 text-xs font-semibold border border-charcoal-700 transition"
                  >
                    Abaikan (Wajar)
                  </button>
                  <button
                    disabled={updatingId === selectedLog.id}
                    onClick={() => handleDecision(selectedLog.id, 'WARNED_PRIVATELY')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-bold border border-amber-500/40 transition"
                  >
                    Tegur via Japri
                  </button>
                  <button
                    disabled={updatingId === selectedLog.id}
                    onClick={() => handleDecision(selectedLog.id, 'SANCTIONED')}
                    className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs font-bold border border-red-500/40 transition"
                  >
                    Beri Sanksi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
