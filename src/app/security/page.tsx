'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Search,
  Filter,
  Check,
  XCircle,
  FileText,
  Trash2
} from 'lucide-react';
import { SecurityIncident, ThreatStatus } from '@/types';

export default function SecurityPage() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus data laporan insiden ini?')) return;
    try {
      const res = await fetch(`/api/security?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchIncidents();
        if (selectedIncident?.id === id) {
          setSelectedIncident(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA riwayat insiden keamanan siber? Data yang dihapus tidak dapat dikembalikan.')) return;
    try {
      const res = await fetch('/api/security?all=true', { method: 'DELETE' });
      if (res.ok) {
        await fetchIncidents();
        setSelectedIncident(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/security');
      const json = await res.json();
      if (json.data) setIncidents(json.data);
    } catch (e) {
      console.error('Failed fetching security logs:', e);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: SecurityIncident['adminStatus']) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/security', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await fetchIncidents();
        if (selectedIncident?.id === id) {
          setSelectedIncident(prev => prev ? { ...prev, adminStatus: newStatus } : null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = incidents.filter(item => {
    const matchRisk = filterRisk === 'ALL' || item.riskLevel === filterRisk;
    const matchSearch = item.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.rawContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.threatType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRisk && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Laporan Keamanan Siber Grup
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-400 mt-1">
            Deteksi real-time ancaman scam, phishing rekening, peretasan APK, tautan jahat, dan konten terlarang.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-charcoal-400" />
            <input
              type="text"
              placeholder="Cari pengirim / isi / jenis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-charcoal-900 border border-charcoal-750 text-white placeholder-charcoal-500 focus:outline-none focus:border-srjgreen-500 w-48 sm:w-64"
            />
          </div>

          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-xl bg-charcoal-900 border border-charcoal-750 text-charcoal-200 focus:outline-none focus:border-srjgreen-500"
          >
            <option value="ALL">Semua Tingkat Risiko</option>
            <option value="BERBAHAYA">Hanya BERBAHAYA</option>
            <option value="MENCURIGAKAN">Hanya MENCURIGAKAN</option>
            <option value="AMAN">AMAN</option>
          </select>

          {incidents.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl bg-charcoal-900 hover:bg-red-950/60 text-charcoal-400 hover:text-red-300 text-xs font-semibold border border-charcoal-750 hover:border-red-800 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Semua ({incidents.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Incidents Table / List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-charcoal-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-charcoal-800 bg-charcoal-900/80 text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pengirim & Grup</th>
                <th className="py-3 px-4">Jenis Ancaman</th>
                <th className="py-3 px-4">Isi Pesan Terkait</th>
                <th className="py-3 px-4">Tindakan Sistem</th>
                <th className="py-3 px-4">Status Admin</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400 text-xs">
                    Tidak ada laporan insiden keamanan yang cocok dengan kriteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
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
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.riskLevel === 'BERBAHAYA'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {item.threatType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="truncate font-mono text-charcoal-300 text-[11px]">
                        {item.rawContent}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                        item.actionTaken === 'MESSAGE_DELETED' 
                          ? 'bg-red-950 text-red-300 border border-red-800' 
                          : 'bg-charcoal-800 text-charcoal-300'
                      }`}>
                        {item.actionTaken === 'MESSAGE_DELETED' ? 'Otomatis Dihapus' : 'Dilaporkan ke Admin'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.adminStatus === 'RESOLVED' 
                          ? 'bg-srjgreen-500/20 text-srjgreen-300 border border-srjgreen-500/30'
                          : item.adminStatus === 'ACKNOWLEDGED'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {item.adminStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedIncident(item)}
                          className="px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-750 text-white text-[11px] font-medium border border-charcoal-700 transition"
                        >
                          Detail
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          title="Hapus Laporan Ini"
                          className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-red-950/70 text-charcoal-400 hover:text-red-300 border border-charcoal-750 hover:border-red-800/80 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Incident */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-xl p-6 rounded-2xl border border-charcoal-750 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-bold text-white">Detail Insiden Keamanan</h3>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="text-charcoal-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-charcoal-850 border border-charcoal-750">
                  <span className="text-charcoal-400">Pengirim:</span>
                  <p className="font-semibold text-white mt-0.5">{selectedIncident.senderName}</p>
                  <p className="font-mono text-[10px] text-charcoal-400">{selectedIncident.senderJid}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-charcoal-850 border border-charcoal-750">
                  <span className="text-charcoal-400">Grup:</span>
                  <p className="font-semibold text-white mt-0.5">{selectedIncident.groupName}</p>
                  <p className="font-mono text-[10px] text-charcoal-400">{selectedIncident.groupJid}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-800">
                <span className="text-charcoal-400 font-semibold block mb-1">Bukti Pesan:</span>
                <p className="font-mono text-charcoal-200 bg-charcoal-950 p-2.5 rounded-lg border border-charcoal-800 select-all break-all">
                  {selectedIncident.rawContent}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/50">
                <span className="text-red-300 font-semibold block mb-1">Hasil Analisis AI Gemini & Heuristik:</span>
                <p className="text-charcoal-200 leading-relaxed">
                  {selectedIncident.aiAnalysis}
                </p>
              </div>

              {selectedIncident.detectedUrls && selectedIncident.detectedUrls.length > 0 && (
                <div className="p-3 rounded-xl bg-charcoal-850 border border-charcoal-750">
                  <span className="text-charcoal-400 font-semibold block mb-1">Tautan yang Terdeteksi:</span>
                  <div className="space-y-1">
                    {selectedIncident.detectedUrls.map((u, i) => (
                      <div key={i} className="font-mono text-red-400 text-[11px] truncate">
                        • {u}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update Actions */}
              <div className="pt-3 border-t border-charcoal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  onClick={() => handleDelete(selectedIncident.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-800 transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Laporan Ini</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    disabled={updatingId === selectedIncident.id}
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'ACKNOWLEDGED')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-semibold border border-blue-500/40 transition"
                  >
                    Tandai Diperiksa
                  </button>
                  <button
                    disabled={updatingId === selectedIncident.id}
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'RESOLVED')}
                    className="px-3 py-1.5 rounded-lg bg-srjgreen-600 hover:bg-srjgreen-500 text-charcoal-950 text-xs font-bold transition"
                  >
                    Selesai Ditangani
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
