# 🛡️ SRJ GUARDIAN
## AI WhatsApp Security & Community Moderator
### Paguyuban SUNDA RANTAU JOGJA (SRJ)

> _"Silih Asah, Silih Asih, Silih Asuh — Nulung ka nu Butuh, Nalang ka nu Susah."_

---

## 📌 Ringkasan Sistem
**SRJ GUARDIAN** adalah sistem keamanan digital dan moderator komunitas otomatis berbasis AI yang dirancang khusus untuk mengawal grup WhatsApp **SUNDA RANTAU JOGJA (SRJ)** selama 24 jam non-stop.

Sistem bekerja di belakang layar (*background daemon*) untuk:
1. **AI Security**: Memindai setiap URL/tautan otomatis, memblokir phising perbankan, scam saldo DANA kaget, dan malware berkedok surat undangan/resi APK.
2. **AI Moderator**: Menegakkan aturan resmi paguyuban dengan pemahaman konteks (anti-flexing tanpa menghakimi orang yang sekadar bersyukur, mencegah perundungan/provokasi).
3. **AI Social Care**: Mengenali anggota rantau yang sedang sakit sendirian di kosan Jogja, mencari kerja darurat, atau butuh bantuan tempat tinggal, lalu mengirimkan laporan pribadi (*japri*) kepada admin.
4. **WhatsApp Multi-Device Engine**: Mampu membaca dan memoderasi grup WhatsApp pengguna biasa yang sudah lama ada.
5. **Dashboard Admin Modern**: Tampilan profesional *dark mode* (charcoal, emerald green, gold accents) responsif untuk MacBook dan HP.

---

## 🏗️ Arsitektur Teknologi

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend Dashboard** | Next.js 14, TypeScript, Tailwind CSS, Lucide Icons | Responsive MacBook & Mobile, Dark Charcoal + Emerald & Gold Theme |
| **Backend & Pipeline** | Node.js Route Handlers (`/api/...`) | SSRF Sandbox, Heuristics, Multi-Modal Ingestion |
| **Database** | Supabase PostgreSQL + Resilient Local Store (`.data/`) | Skema DDL lengkap dengan indeks & persistensi otomatis |
| **AI Intelligence** | Google Gemini API (`gemini-2.5-flash`) + Heuristics | Multi-modal text & image moderation grounded in Sundanese culture |
| **URL Security Scanner** | SSRF Guard, DNS Resolver, Redirect Hop Follower | Sandboxed evaluation, Safe Browsing V4, Heuristic engine |
| **WhatsApp Gateway** | Multi-Device Linked Client (Baileys Daemon) + Webhook | Mendukung pemantauan grup lama & eksekusi hapus pesan |
| **24/7 Execution** | Standalone Worker (`scripts/daemon.js`), PM2, Docker | Berjalan terus-menerus tanpa bergantung browser terbuka |

---

## 🔍 Analisis Teknis WhatsApp: Mengapa Multi-Device?

Sesuai evaluasi dokumentasi resmi Meta:
- **WhatsApp Cloud API (Resmi Meta)**: Dirancang secara ketat untuk percakapan 1-on-1 (*customer care* & *broadcast*). API ini **TIDAK BISA** membaca aliran pesan dari grup WhatsApp komunitas biasa yang telah dibuat sebelumnya oleh akun pengguna standar.
- **WhatsApp Multi-Device Socket (Baileys/WA-Web Protocol)**: Menghubungkan nomor ponsel khusus milik Anda sebagai perangkat tertaut (*Linked Device*). Metode ini:
  - ✅ Dapat bergabung ke grup komunitas **SUNDA RANTAU JOGJA** yang sudah ada.
  - ✅ Membaca seluruh aliran pesan, tautan, dan berkas secara *real-time*.
  - ✅ Jika dijadikan **Admin Grup**, dapat menghapus pesan berbahaya untuk semua orang (*revoke/delete for everyone*).
  - ✅ Mengirimkan laporan peringatan rahasia secara *japri* ke nomor WhatsApp admin.

---

## 🚀 Panduan Menjalankan Sistem

### 1. Menjalankan Mode Pengembangan (Local Dev)
```bash
cd /Users/bud_istoreicloud.com/.gemini/antigravity/scratch/srj-guardian
npm install
npm run build
npm start
```
Buka peramban di: `http://localhost:3000`

### 2. Mengaktifkan Background Worker 24 Jam (PM2)
```bash
# Menjalankan Next.js Web dan Background Daemon sekaligus
npx pm2 start ecosystem.config.js
npx pm2 save
npx pm2 logs
```

### 3. Menjalankan via Docker Compose
```bash
docker-compose up -d --build
```

---

## 🛡️ Menu & Fitur Dashboard

1. **Overview (`/`)**: Metrik ancaman tertahan, permintaan Social Care aktif, rasio kepatuhan etika Sunda, dan aliran aktivitas *real-time*.
2. **AI Security (`/security`)**: Riwayat insiden scam, phishing, malware APK, dan tautan berbahaya lengkap dengan tombol penanganan admin.
3. **AI Social Care (`/social-care`)**: Manajemen pendataan anggota rantau yang butuh bantuan (pekerjaan, kesehatan darurat di kosan, tempat tinggal) dengan tombol langsung **Japri WA**.
4. **AI Moderator (`/moderation`)**: Log kepatuhan aturan grup dengan sistem evaluasi human-in-the-loop untuk mencegah kesalahpahaman.
5. **URL Security Scanner (`/url-scanner`)**: Alat uji dan pemindai tautan mandiri dengan proteksi sandbox SSRF dan diagram rantai pengalihan (*redirect*).
6. **Manajemen WhatsApp (`/whatsapp`)**: Status koneksi, generator QR pairing perangkat tertaut, pemilihan grup yang dipantau, dan pengujian notifikasi admin.
7. **Test Lab & Simulator (`/test-lab`)**: Laboratorium pengujian skenario nyata (Phishing DANA, APK malware, flexing, keluhan sakit bahasa Sunda) tanpa menyentuh grup asli.
8. **Pengaturan (`/settings`)**: Konfigurasi kunci API Gemini, Google Safe Browsing, nomor tujuan admin, dan ambang batas sensitivitas.

---

## 📂 Struktur Direktori Proyek

```
srj-guardian/
├── .data/                                # Database JSON lokal persistent
├── scripts/
│   └── daemon.js                         # 24/7 Standalone Background Worker
├── src/
│   ├── app/                              # Next.js App Router Pages & APIs
│   │   ├── api/
│   │   │   ├── pipeline/ingest/          # Pipeline pemroses pesan WhatsApp
│   │   │   ├── pipeline/scan-url/        # Live URL Security Scanner
│   │   │   ├── security/                 # CRUD insiden keamanan
│   │   │   ├── social-care/              # CRUD laporan bantuan perantau
│   │   │   ├── moderation/               # CRUD log kepatuhan aturan
│   │   │   ├── whatsapp/                 # Kontrol sesi WhatsApp
│   │   │   ├── groups/                   # Manajemen grup yang dipantau
│   │   │   ├── settings/                 # Konfigurasi sistem
│   │   │   └── webhook/whatsapp/         # Receiver webhook Meta Cloud API
│   │   ├── security/page.tsx             # Halaman Laporan Keamanan
│   │   ├── social-care/page.tsx          # Halaman AI Social Care
│   │   ├── moderation/page.tsx           # Halaman AI Moderator
│   │   ├── url-scanner/page.tsx          # Halaman Scanner Tautan
│   │   ├── whatsapp/page.tsx             # Halaman Integrasi WhatsApp
│   │   ├── test-lab/page.tsx             # Halaman Simulator & Test Lab
│   │   ├── settings/page.tsx             # Halaman Pengaturan
│   │   ├── layout.tsx                    # Shell navigasi & tema
│   │   └── page.tsx                      # Dashboard Utama
│   ├── components/                       # Sidebar, Header, UI widgets
│   ├── lib/
│   │   ├── db.ts                         # Storage abstraction & state management
│   │   ├── url-scanner.ts                # SSRF guard, redirect follow, threat heuristics
│   │   ├── ai-engine.ts                  # Gemini prompt engineering & Sunda cultural rules
│   │   ├── notifier.ts                   # Pemformat & pengirim laporan pribadi admin
│   │   ├── pipeline.ts                   # Pipeline orkestrasi utama
│   │   └── whatsapp-service.ts           # Service pengelola sesi WhatsApp
│   └── types/                            # Domain interfaces & TypeScript types
├── supabase/
│   └── migrations/
│       └── 20261110_srj_guardian_init.sql # Skema PostgreSQL Supabase lengkap
├── Dockerfile                            # Docker container build
├── docker-compose.yml                    # Multi-container orchestration
├── ecosystem.config.js                   # PM2 process manager config
├── tailwind.config.js                    # Konfigurasi warna charcoal, emerald & gold
└── tsconfig.json                         # TypeScript configuration
```

---

_SRJ GUARDIAN — Didedikasikan untuk menjaga ketentraman dan persaudaraan sesama urang Sunda di perantauan Yogyakarta._
