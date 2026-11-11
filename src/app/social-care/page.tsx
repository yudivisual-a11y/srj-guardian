'use client';

import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  ExternalLink, 
  Briefcase, 
  HeartPulse, 
  Home, 
  HelpCircle, 
  MessageSquare,
  CheckCircle,
  Clock,
  UserCheck,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { HelpReport, SocialCareCategory, UrgencyLevel } from '@/types';

export default function SocialCarePage() {
  const [reports, setReports] = useState<HelpReport[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<HelpReport | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [assignedAdmin, setAssignedAdmin] = useState('Kang Asep');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/social-care');
      const json = await res.json();
      if (json.data) setReports(json.data);
    } catch (e) {
      console.error('Failed fetching help reports:', e);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus permohonan bantuan ini?')) return;
    try {
      const res = await fetch(`/api/social-care?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchReports();
        if (selectedReport?.id === id) {
          setSelectedReport(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA riwayat social care? Data yang dihapus tidak dapat dikembalikan.')) return;
    try {
      const res = await fetch('/api/social-care?all=true', { method: 'DELETE' });
      if (res.ok) {
        await fetchReports();
        setSelectedReport(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: HelpReport['status']) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/social-care', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status: newStatus,
          notes: adminNote,
          assignedAdmin
        }),
      });
      if (res.ok) {
        await fetchReports();
        setSelectedReport(null);
        setAdminNote('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const getCategoryBadge = (cat: SocialCareCategory) => {
    switch (cat) {
      case 'PEKERJAAN':
        return { label: 'Pekerjaan / Loker', icon: Briefcase, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'KESEHATAN_DARURAT':
        return { label: 'Kesehatan & Darurat', icon: HeartPulse, color: 'text-red-400 bg-red-500/10 border-red-500/30' };
      case 'TEMPAT_TINGGAL':
        return { label: 'Tempat Tinggal / Kos', icon: Home, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'BANTUAN_SOSIAL':
        return { label: 'Bantuan Sosial', icon: HeartHandshake, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      default:
        return { label: 'Informasi Lain', icon: HelpCircle, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
    }
  };

  const filtered = reports.filter(item => {
    if (filterCategory === 'ALL') return true;
    return item.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-srjgold-500/10 text-srjgold-400 border border-srjgold-500/20">
              <HeartHandshake className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              AI Social Care — Pendataan Bantuan Perantau
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-400 mt-1">
            Mendeteksi kebutuhan saudara se-paguyuban di Jogja (pekerjaan, tempat tinggal, sakit darurat) secara pribadi dan penuh empati.
          </p>
        </div>

        {/* Category Filter & Actions */}
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-xl bg-charcoal-900 border border-charcoal-750 text-charcoal-200 focus:outline-none focus:border-srjgold-500"
          >
            <option value="ALL">Semua Kategori Bantuan</option>
            <option value="PEKERJAAN">Pekerjaan & Lowongan Kerja</option>
            <option value="KESEHATAN_DARURAT">Kesehatan & Darurat</option>
            <option value="TEMPAT_TINGGAL">Tempat Tinggal / Kosan</option>
            <option value="BANTUAN_SOSIAL">Bantuan Sosial</option>
            <option value="INFORMASI_LAIN">Informasi Lain</option>
          </select>

          {reports.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl bg-charcoal-900 hover:bg-red-950/60 text-charcoal-400 hover:text-red-300 text-xs font-semibold border border-charcoal-750 hover:border-red-800 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Semua ({reports.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Philosophy Banner */}
      <div className="p-4 rounded-xl bg-charcoal-900/90 border border-srjgold-500/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-srjgold-500/20 text-srjgold-400 flex items-center justify-center shrink-0">
          <HeartHandshake className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <p className="font-semibold text-white">
            Etika Pendampingan Social Care SRJ:
          </p>
          <p className="text-charcoal-300 mt-0.5">
            Admin menghubungi anggota secara <span className="text-srjgold-400 font-semibold">japri (pribadi)</span>. Jangan permalukan anggota di grup atau mengumbar kesusahan ekonominya di muka umum.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-charcoal-400 text-xs">
            Belum ada permintaan bantuan pada kategori yang dipilih.
          </div>
        ) : (
          filtered.map((item) => {
            const badge = getCategoryBadge(item.category);
            const Icon = badge.icon;
            const cleanPhone = item.senderJid.replace(/[^0-9]/g, '');

            return (
              <div 
                key={item.id} 
                className="glass-panel p-5 rounded-2xl glass-panel-hover flex flex-col justify-between border-charcoal-800"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${badge.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      item.urgency === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                      item.urgency === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : 'bg-charcoal-800 text-charcoal-300'
                    }`}>
                      URGENSI {item.urgency}
                    </span>
                  </div>

                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-white">{item.senderName}</h3>
                    <p className="text-[10px] text-charcoal-400 font-mono">{item.groupName}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-charcoal-900/80 border border-charcoal-800 text-xs text-charcoal-200 mb-3 italic">
                    &ldquo;{item.excerpt}&rdquo;
                  </div>

                  <p className="text-xs text-srjgold-300 font-medium">
                    {item.summary}
                  </p>

                  {item.adminNotes && (
                    <div className="mt-3 p-2.5 rounded-lg bg-charcoal-850 border border-charcoal-750 text-[11px]">
                      <span className="text-charcoal-400 block font-semibold">Catatan Admin ({item.assignedAdmin || 'Admin'}):</span>
                      <span className="text-charcoal-200">{item.adminNotes}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-charcoal-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      item.status === 'RESOLVED' ? 'bg-srjgreen-400' :
                      item.status === 'IN_PROGRESS' ? 'bg-blue-400' : 'bg-amber-400'
                    }`} />
                    <span className="text-[11px] font-semibold text-charcoal-300">
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold transition"
                    >
                      <span>Japri WA</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => {
                        setSelectedReport(item);
                        setAdminNote(item.adminNotes || '');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-750 text-white text-[11px] font-medium border border-charcoal-700 transition"
                    >
                      Update
                    </button>

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Hapus Laporan Ini"
                      className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-red-950/70 text-charcoal-400 hover:text-red-300 border border-charcoal-700 hover:border-red-800/80 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Update Status */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-charcoal-750 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-srjgold-400" />
                <h3 className="text-base font-bold text-white">Tindak Lanjut Bantuan Perantau</h3>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="text-charcoal-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-800">
                <p className="font-semibold text-white">{selectedReport.senderName} ({selectedReport.senderJid})</p>
                <p className="text-charcoal-300 mt-1 italic">&ldquo;{selectedReport.rawMessage}&rdquo;</p>
              </div>

              <div>
                <label className="block text-charcoal-400 font-semibold mb-1">
                  Catatan Tindak Lanjut Admin:
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Misal: Sudah dihubungi, diberikan kontak supir catering SRJ..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-charcoal-900 border border-charcoal-750 text-white placeholder-charcoal-500 focus:outline-none focus:border-srjgold-500"
                />
              </div>

              <div>
                <label className="block text-charcoal-400 font-semibold mb-1">
                  Admin Penanggung Jawab:
                </label>
                <input
                  type="text"
                  value={assignedAdmin}
                  onChange={(e) => setAssignedAdmin(e.target.value)}
                  className="w-full p-2 rounded-xl bg-charcoal-900 border border-charcoal-750 text-white focus:outline-none focus:border-srjgold-500"
                />
              </div>

              <div className="pt-3 border-t border-charcoal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  onClick={() => handleDelete(selectedReport.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-800 transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Laporan Ini</span>
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'CONTACTED')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-semibold border border-blue-500/40 transition"
                  >
                    Sudah Dijapri
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'IN_PROGRESS')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-semibold border border-amber-500/40 transition"
                  >
                    Dalam Proses
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'RESOLVED')}
                    className="px-3 py-1.5 rounded-lg bg-srjgreen-600 hover:bg-srjgreen-500 text-charcoal-950 text-xs font-bold transition"
                  >
                    Selesai / Terbantu
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
