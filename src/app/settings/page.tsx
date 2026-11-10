'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Key, 
  ShieldCheck, 
  Smartphone, 
  Cpu, 
  Sliders, 
  CheckCircle2, 
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { SystemSettings } from '@/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    aiSensitivity: 'balanced',
    geminiApiKey: '',
    safeBrowsingApiKey: '',
    primaryAdminPhone: '+6281223344550',
    autoDeleteDangerous: true,
    privateNotifyAdmin: true,
    enableImageScan: true,
    enableVideoScan: true,
  });

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showSafeKey, setShowSafeKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.data) {
          setSettings(prev => ({
            ...prev,
            ...json.data,
            // Keep empty if masked for security unless modified
            geminiApiKey: json.data.geminiApiKey || '',
            safeBrowsingApiKey: json.data.safeBrowsingApiKey || '',
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Pengaturan SRJ GUARDIAN berhasil disimpan.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-srjgreen-500/10 text-srjgreen-400 border border-srjgreen-500/20">
            <Settings className="w-4 h-4" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Pengaturan Sistem & Kebijakan Moderasi
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-charcoal-400 mt-1">
          Konfigurasi kunci API, nomor penerima laporan pribadi admin, sensitivitas AI, dan ambang batas tindakan otomatis.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-srjgreen-950/60 border border-srjgreen-500/40 text-xs text-srjgreen-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-srjgreen-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Section 1: AI Keys & Cloud Security */}
      <div className="glass-panel p-6 rounded-2xl border-charcoal-800 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm pb-3 border-b border-charcoal-800">
          <Key className="w-4 h-4 text-srjgreen-400" />
          <span>Kredensial API & Model AI</span>
        </div>

        <div className="grid grid-cols-1 gap-4 text-xs">
          <div>
            <label className="block text-charcoal-300 font-semibold mb-1">
              Google Gemini API Key:
            </label>
            <div className="relative">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={settings.geminiApiKey}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-750 text-white font-mono text-xs focus:outline-none focus:border-srjgreen-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-2.5 text-charcoal-400 hover:text-white"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-charcoal-500 mt-1">
              Digunakan untuk analisis konteks pesan bahasa Sunda & Indonesia, klasifikasi flexing objektif, serta frame extraction media.
            </p>
          </div>

          <div>
            <label className="block text-charcoal-300 font-semibold mb-1">
              Google Safe Browsing API Key (Opsional):
            </label>
            <div className="relative">
              <input
                type={showSafeKey ? 'text' : 'password'}
                placeholder="Safe Browsing v4 Key"
                value={settings.safeBrowsingApiKey}
                onChange={(e) => setSettings({ ...settings, safeBrowsingApiKey: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-750 text-white font-mono text-xs focus:outline-none focus:border-srjgreen-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSafeKey(!showSafeKey)}
                className="absolute right-3 top-2.5 text-charcoal-400 hover:text-white"
              >
                {showSafeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-charcoal-500 mt-1">
              Memperkuat scanner tautan otomatis terhadap database ancaman global Meta & Google.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Admin Private Notification Channel */}
      <div className="glass-panel p-6 rounded-2xl border-charcoal-800 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm pb-3 border-b border-charcoal-800">
          <Smartphone className="w-4 h-4 text-srjgold-400" />
          <span>Saluran Laporan Pribadi Admin (Japri)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-charcoal-300 font-semibold mb-1">
              Nomor WhatsApp Admin Utama:
            </label>
            <input
              type="text"
              value={settings.primaryAdminPhone}
              onChange={(e) => setSettings({ ...settings, primaryAdminPhone: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-750 text-white font-mono text-xs focus:outline-none focus:border-srjgreen-500"
            />
            <p className="text-[11px] text-charcoal-500 mt-1">
              Format internasional (contoh: +6281223344550).
            </p>
          </div>

          <div>
            <label className="block text-charcoal-300 font-semibold mb-1">
              Sensitivitas AI Moderator:
            </label>
            <select
              value={settings.aiSensitivity}
              onChange={(e: any) => setSettings({ ...settings, aiSensitivity: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-750 text-white text-xs focus:outline-none focus:border-srjgreen-500"
            >
              <option value="low">Rendah (Hanya ancaman eksplisit)</option>
              <option value="balanced">Seimbang (Rekomendasi SRJ — Silih Asah Asih Asuh)</option>
              <option value="strict">Ketat (Deteksi agresif & pembatasan ketat)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Automatic Actions & Privacy */}
      <div className="glass-panel p-6 rounded-2xl border-charcoal-800 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm pb-3 border-b border-charcoal-800">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Tindakan Otomatis & Proteksi Privasi Anggota</span>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-start gap-3 p-3 rounded-xl bg-charcoal-900 border border-charcoal-800 cursor-pointer hover:bg-charcoal-850 transition">
            <input
              type="checkbox"
              checked={settings.autoDeleteDangerous}
              onChange={(e) => setSettings({ ...settings, autoDeleteDangerous: e.target.checked })}
              className="mt-0.5 rounded text-srjgreen-500 focus:ring-0"
            />
            <div>
              <span className="font-semibold text-white block">
                Hapus Otomatis Pesan Kategori BERBAHAYA (Tingkat 3)
              </span>
              <p className="text-charcoal-400 text-[11px] mt-0.5">
                Jika link teridentifikasi sebagai Trojan APK atau Phishing, bot akan langsung menghapus pesan untuk semua orang demi melindungi anggota lain (hanya jika bot adalah Admin grup).
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-charcoal-900 border border-charcoal-800 cursor-pointer hover:bg-charcoal-850 transition">
            <input
              type="checkbox"
              checked={settings.privateNotifyAdmin}
              onChange={(e) => setSettings({ ...settings, privateNotifyAdmin: e.target.checked })}
              className="mt-0.5 rounded text-srjgreen-500 focus:ring-0"
            />
            <div>
              <span className="font-semibold text-white block">
                Kirim Laporan Pribadi ke Jalur Admin (Bukan di Grup)
              </span>
              <p className="text-charcoal-400 text-[11px] mt-0.5">
                Menjaga aib dan kerahasiaan anggota yang meminta bantuan serta tidak mempermalukan anggota di grup publik.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-charcoal-900 border border-charcoal-800 cursor-pointer hover:bg-charcoal-850 transition">
            <input
              type="checkbox"
              checked={settings.enableImageScan}
              onChange={(e) => setSettings({ ...settings, enableImageScan: e.target.checked })}
              className="mt-0.5 rounded text-srjgreen-500 focus:ring-0"
            />
            <div>
              <span className="font-semibold text-white block">
                Pemeriksaan Gambar & Ekstraksi Frame Video Terkontrol
              </span>
              <p className="text-charcoal-400 text-[11px] mt-0.5">
                Memindai gambar/video yang masuk untuk mencegah pornografi, kekerasan ekstrem, atau konten asusila.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-srjgreen-600 hover:bg-srjgreen-500 disabled:opacity-50 text-charcoal-950 font-bold text-sm transition flex items-center gap-2 shadow-glow-green"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
        </button>
      </div>
    </div>
  );
}
