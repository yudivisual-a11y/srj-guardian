/**
 * SRJ GUARDIAN — 24/7 Background Worker Daemon
 * Paguyuban SUNDA RANTAU JOGJA (SRJ)
 * 
 * Features:
 * - Baileys Multi-Device WebSocket Engine (Official WhatsApp connection)
 * - Dual Pairing: 8-Digit Pairing Code (sock.requestPairingCode) & Dynamic QR Code
 * - File-based IPC with Next.js (/api/whatsapp)
 * - Auto-Discovery of Existing Groups (sock.groupFetchAllParticipating)
 * - 24/7 Message Monitoring, Anti-Phishing/Malware Scanning, Content Moderation
 * - Auto-Delete Threats in Group (when Bot is Admin)
 * - Private Admin Alerts via WhatsApp
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const DATA_DIR = path.join(__dirname, '..', '.data');
const DB_PATH = path.join(DATA_DIR, 'srj_guardian_db.json');
const AUTH_FOLDER = path.join(DATA_DIR, 'baileys_auth_info');
const QR_FILE = path.join(DATA_DIR, 'current_qr.txt');
const STATE_FILE = path.join(DATA_DIR, 'wa_state.json');
const CMD_FILE = path.join(DATA_DIR, 'wa_command.json');
const RESP_FILE = path.join(DATA_DIR, 'wa_response.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('[DAEMON] Error reading DB:', e.message);
  }
  return null;
}

function updateDb(updateFn) {
  try {
    const db = readDb();
    if (db) {
      updateFn(db);
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('[DAEMON] Error saving DB:', e.message);
  }
}

function writeWaState(stateUpdate) {
  try {
    let current = {};
    if (fs.existsSync(STATE_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      } catch (e) {}
    }
    const merged = { ...current, ...stateUpdate, updatedAt: new Date().toISOString() };
    fs.writeFileSync(STATE_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DAEMON] Gagal menulis wa_state.json:', err.message);
  }
}

let currentSock = null;
let isInitializing = false;
let currentPairingCode = null;
let triggerSyncGroups = null;

// =========================================================================
// JALUR KILAT (FAST-PATH RULES): DETEKSI INSTAN TANPA JEDA (<50ms)
// =========================================================================
function inspectFastRules(rawText) {
  const text = (rawText || '').trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  // 1. Judi Online / Judol / Slot / Gacor
  const isJudol = /\b(slot|gacor|zeus|maxwin|olympus|pragmatic|mahjong|togel|toto\s*macau|sbobet|bet88|depo|wd|sensational|scatter|judol|judi\s*online)\b/i.test(lower) ||
    /slot777|slot88|rtp-slot|rtp-live|depo-pulsa|link-gacor/i.test(lower);
  if (isJudol) {
    return {
      type: 'JUDI_ONLINE',
      category: 'MODERATION',
      rule: 'JUDI_ONLINE',
      title: '🎰 *PERINGATAN KERAS DARI CYBER SECURITY: LINK JUDI ONLINE (JUDOL)* 🎰',
      threatHeader: '📌 *Terdeteksi*: Promosi Tautan / Ajakan Judi Online (Slot Gacor / Togel / Taruhan Online)',
      advice: '⚠️ *PERINGATAN KERAS DARI CYBER SECURITY*:\n' +
        'Penyebaran tautan perjudian online melanggar hukum RI (Pasal 27 ayat 2 UU ITE) serta dilarang keras di komunitas SRJ.\n\n' +
        '🛑 *SANKSI KHUSUS JUDOL*:\n' +
        '*1 KALI LAGI* terdeteksi membagikan tautan/ajakan judol, nomor Anda akan *LANGSUNG DI-KICK & DIBLOKIR PERMANEN* dari seluruh grup jaringan SRJ!'
    };
  }

  // 2. APK Malicious / Sniffer Trojan
  const isApk = /\.apk\b/i.test(lower) || /undangan.*\.apk|paket.*\.apk|tilang.*\.apk|tagihan.*\.apk/i.test(lower);
  if (isApk) {
    return {
      type: 'MALWARE',
      category: 'SECURITY',
      threatType: 'MALWARE',
      title: '🛡️ *PERINGATAN KERAS DARI CYBER SECURITY: VIRUS & MALWARE (.APK)* 🛡️',
      threatHeader: '📌 *Terdeteksi*: File Aplikasi Berbahaya (.APK Trojan Sniffer)',
      advice: '⚠️ *PERINGATAN KERAS DARI CYBER SECURITY*:\n' +
        'File APK asing berisiko mencuri kode OTP dan menguras saldo rekening M-Banking!\n\n' +
        '🛑 *SANKSI PENGAMANAN SIBER*:\n' +
        '*1 KALI LAGI* menyebarkan file APK asing, nomor Anda akan *LANGSUNG DI-KICK & DI-BLACKLIST* oleh sistem!'
    };
  }

  // 3. Saldo Masuk Palsu / Dana Kaget Scam / Phishing
  const isSaldoScam = /\b(dana\s*kaget|danakaget|saldo\s*gratis|klaim\s*saldo|tarik\s*tunai\s*gratis|klaim\s*hadiah|pencairan\s*dana|bagi-bagi\s*saldo|undian\s*berhadiah|giveaway\s*resmi|saldo.*masuk|cek\s*saldo|penarikan\s*dana|cairkan\s*saldo)\b/i.test(lower);
  if (isSaldoScam) {
    return {
      type: 'PHISHING',
      category: 'SECURITY',
      threatType: 'PHISHING',
      title: '🛡️ *PERINGATAN KERAS DARI CYBER SECURITY: PENIPUAN SALDO & PHISHING* 🛡️',
      threatHeader: '📌 *Terdeteksi*: Modus Penipuan Saldo Masuk / Link Pencairan Palsu / Phishing',
      advice: '⚠️ *PERINGATAN KERAS DARI CYBER SECURITY*:\n' +
        '1. JANGAN PERNAH mengklik tautan/link yang menjanjikan saldo masuk, transfer gratis, hadiah tunai, atau undian!\n' +
        '2. JANGAN mengisi nomor rekening, PIN, atau kode OTP di tautan tidak resmi.\n\n' +
        '🛑 *SANKSI PENGAMANAN SIBER*:\n' +
        'Jika nomor Anda terus menyebarkan link penipuan serupa (indikasi akun telah dibajak), nomor Anda akan *SEKETIKA DI-KICK* demi melindungi rekening anggota grup!'
    };
  }

  // 4. Kata Kasar / Makian / Hinaan (Insult)
  const isKasar = /\b(anjing|anying|anyink|anjir|anjrit|bangsat|bajingan|kontol|memek|pantek|pepek|itil|jembut|asu|perek|lonte|jablay|tolol|goblok|bego|idiot|bodoh|setan|iblis|sontoloyo|babi|bangke|tai|kehed|belegug)\b/i.test(lower);
  if (isKasar) {
    return {
      type: 'INSULT',
      category: 'MODERATION',
      rule: 'INSULT',
      title: '⚠️ *PERINGATAN TATA KRAMA & ETIKA TUTUR KATA* ⚠️',
      threatHeader: '📌 *Terdeteksi*: Penggunaan Kata Kasar / Hinaan / Makian Tidak Pantas',
      advice: '💡 *HIMBAUAN ETIKA*:\n' +
        'Mohon jaga lisan dan kesopanan tutur kata saat berkomunikasi di grup. Mari saling menghargai sesama warga perantau.'
    };
  }

  // 5. Dugem / Miras / Mabuk / Prostitusi / Maksiat
  const isMaksiat = /\b(open\s*bo|openbo|bo\s*include|michat|vcs|dugem|mabuk\s*bareng|miras|oplosan|pesta\s*miras)\b/i.test(lower);
  if (isMaksiat) {
    return {
      type: 'INAPPROPRIATE_BEHAVIOR',
      category: 'MODERATION',
      rule: 'INAPPROPRIATE_BEHAVIOR',
      title: '⛔ *PERINGATAN KETERTIBAN: LARANGAN MAKSIAT & KONTEN TIDAK PANTAS* ⛔',
      threatHeader: '📌 *Terdeteksi*: Ajakan / Konten Tidak Pantas (Dugem / Miras / Mabuk / Maksiat / Asusila)',
      advice: '⚠️ *PERINGATAN KERAS DARI CYBER SECURITY & PENGURUS*:\n' +
        'Grup Paguyuban Sunda Rantau Jogja (SRJ) adalah wadah silaturahmi perantau yang tertib dan bermartabat. Dilarang keras mengajak pesta malam/dugem, mabuk miras, atau konten asusila!\n\n' +
        '🛑 *SANKSI PELANGGARAN ATURAN*:\n' +
        '*1 KALI LAGI* melakukan tindakan yang sama, hak keanggotaan Anda akan dicabut dan Anda akan *LANGSUNG DI-KICK* dari paguyuban!'
    };
  }

  return null;
}

// =========================================================================
// SISTEM ANTI-SLEEP / KEEPAWAKE MACOS (Apple Silicon M3 / Intel)
// Menjaga CPU, memori, & WiFi tetap aktif meskipun layar padam/terkunci
// =========================================================================
let caffeinateProc = null;
if (process.platform === 'darwin' && !caffeinateProc) {
  try {
    const { spawn } = require('child_process');
    if (fs.existsSync('/usr/bin/caffeinate')) {
      caffeinateProc = spawn('/usr/bin/caffeinate', ['-i', '-s', '-m', '-w', String(process.pid)], {
        detached: true,
        stdio: 'ignore'
      });
      caffeinateProc.unref();
      console.log('[DAEMON-POWER] ☕ macOS Caffeinate aktif! Sistem dijaga tetap online & WiFi aktif meskipun layar padam/terkunci.');
    }
  } catch (cafErr) {
    console.warn('[DAEMON-POWER] Gagal mengaktifkan caffeinate:', cafErr.message);
  }
}

async function startWhatsAppDaemon(freshPairing = false) {
  if (isInitializing) return;
  isInitializing = true;

  console.log('====================================================');
  console.log('  SRJ GUARDIAN — AI WHATSAPP SECURITY & MODERATOR   ');
  console.log('  KOMUNITAS: SUNDA RANTAU JOGJA (SRJ)               ');
  console.log('  Prinsip: Silih Asah, Silih Asih, Silih Asuh       ');
  console.log('  Status: 24/7 WHATSAPP MULTI-DEVICE DAEMON ACTIVE  ');
  console.log('====================================================');

  try {
    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = await import('@whiskeysockets/baileys');

    if (freshPairing && fs.existsSync(AUTH_FOLDER)) {
      console.log('[DAEMON] Membersihkan sesi lama untuk memulai pairing baru...');
      fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
    }

    if (!fs.existsSync(AUTH_FOLDER)) {
      fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: Browsers ? Browsers.macOS('Desktop') : ['Mac OS', 'Chrome', '14.4.1'],
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000
    });

    currentSock = sock;
    isInitializing = false;

    sock.ev.on('creds.update', saveCreds);

    let isSyncingGroups = false;
    let lastSyncTime = 0;

    async function syncGroups(force = false) {
      if (isSyncingGroups) return 0;
      const now = Date.now();
      if (!force && now - lastSyncTime < 10000) return 0; // Debounce 10 detik kecuali force

      isSyncingGroups = true;
      lastSyncTime = now;
      let foundCount = 0;

      try {
        const myJid = sock.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : '';
        const phone = sock.user?.id ? '+' + sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
        console.log(`[DAEMON-DISCOVERY] Memindai grup dari WhatsApp untuk nomor (${phone})...`);
        const participating = await sock.groupFetchAllParticipating();
        const groups = Object.values(participating || {});
        foundCount = groups.length;
        console.log(`[DAEMON-DISCOVERY] Ditemukan ${foundCount} grup di akun WhatsApp saat ini.`);

        const currentJids = new Set(groups.map(g => g.id));

        updateDb((db) => {
          if (!db.monitoredGroups) db.monitoredGroups = [];

          // Ambil map grup yang sudah ada
          const existingMap = new Map();
          for (const m of db.monitoredGroups) {
            if (currentJids.has(m.groupJid)) {
              existingMap.set(m.groupJid, m);
            }
          }

          const updatedList = [];

          for (const g of groups) {
            const isBotAdmin = g.participants?.some(p => p.id === myJid && (p.admin === 'admin' || p.admin === 'superadmin')) || false;
            const existing = existingMap.get(g.id);
            const isSrjOrSecurity = /srj|sunda|keamanan|security|rantau|jogja/i.test(g.subject || '');

            if (existing) {
              existing.groupName = g.subject || existing.groupName;
              existing.autoDeleteThreats = isBotAdmin;
              // Jika grup bernuansa SRJ / Keamanan, pastikan aktif
              if (isSrjOrSecurity && !existing.isActive) {
                existing.isActive = true;
              }
              updatedList.push(existing);
            } else {
              // GRUP BARU TERDETEKSI:
              // Otomatis aktifkan jika bernuansa SRJ/Keamanan atau paguyuban!
              const newGrp = {
                id: `grp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                groupJid: g.id,
                groupName: g.subject || 'Grup WhatsApp',
                isActive: isSrjOrSecurity, // Otomatis aktif untuk grup SRJ!
                autoScanUrls: true,
                autoModContent: true,
                socialCareEnabled: true,
                autoDeleteThreats: isBotAdmin,
                rulesSummary: g.desc || 'Grup Komunitas Sunda Rantau Jogja. Silih Asah, Silih Asih, Silih Asuh.',
                createdAt: new Date().toISOString()
              };
              updatedList.push(newGrp);
              console.log(`[DAEMON-DISCOVERY] Grup terdeteksi: "${g.subject}" (Status: ${isSrjOrSecurity ? 'OTOMATIS AKTIF' : 'NONAKTIF'}, Admin: ${isBotAdmin ? 'YA' : 'BELUM'})`);
            }
          }

          db.monitoredGroups = updatedList;
        });
      } catch (err) {
        console.error('[DAEMON-DISCOVERY] Gagal sinkronisasi grup:', err.message);
        if (err.message && err.message.includes('rate-overlimit')) {
          console.log('[DAEMON-DISCOVERY] Rate-limit WhatsApp aktif, pending sinkronisasi ulang selama 60 detik.');
          setTimeout(() => {
            lastSyncTime = 0;
            syncGroups(true);
          }, 60000);
        }
      } finally {
        isSyncingGroups = false;
      }
      return foundCount;
    }

    triggerSyncGroups = syncGroups;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const dataUrl = await QRCode.toDataURL(qr, {
            width: 320,
            margin: 2,
            color: { dark: '#070A0D', light: '#FFFFFF' }
          });

          fs.writeFileSync(QR_FILE, dataUrl, 'utf-8');
          console.log('[DAEMON] >>> KODE QR ASLI WHATSAPP SIAP & TERSIMPAN! (Ukuran: ' + dataUrl.length + ')');

          writeWaState({
            status: 'PAIRING',
            qrCodeDataUrl: dataUrl,
            qrTimestamp: Date.now()
          });

          updateDb((db) => {
            db.whatsappConnection.status = 'PAIRING';
            db.whatsappConnection.qrCodeData = dataUrl;
          });
        } catch (qrErr) {
          console.error('[DAEMON] QR generation error:', qrErr);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[DAEMON] Connection closed (${statusCode}). Reconnecting: ${shouldReconnect}`);

        if (fs.existsSync(QR_FILE)) {
          try { fs.unlinkSync(QR_FILE); } catch (e) {}
        }

        if (shouldReconnect) {
          writeWaState({ status: 'PAIRING' });
          setTimeout(() => startWhatsAppDaemon(false), 3000);
        } else {
          // Logged out
          console.log('[DAEMON] Sesi WhatsApp telah logout.');
          if (fs.existsSync(AUTH_FOLDER)) {
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          }
          writeWaState({
            status: 'DISCONNECTED',
            phoneNumber: null,
            qrCodeDataUrl: null,
            pairingCode: null
          });
          updateDb((db) => {
            db.whatsappConnection.status = 'DISCONNECTED';
            db.whatsappConnection.phoneNumber = null;
            db.whatsappConnection.qrCodeData = null;
            db.whatsappConnection.coAdminVerified = false;
          });
        }
      } else if (connection === 'open') {
        const botJid = sock.user?.id || '';
        const phone = '+' + botJid.split(':')[0].replace(/[^0-9]/g, '');
        console.log(`[DAEMON] SUKSES! Bot WhatsApp terhubung dengan nomor: ${phone}`);

        if (fs.existsSync(QR_FILE)) {
          try { fs.unlinkSync(QR_FILE); } catch (e) {}
        }

        currentPairingCode = null;

        writeWaState({
          status: 'CONNECTED',
          phoneNumber: phone,
          qrCodeDataUrl: null,
          pairingCode: null,
          lastConnectedAt: new Date().toISOString()
        });

        updateDb((db) => {
          db.whatsappConnection.status = 'CONNECTED';
          db.whatsappConnection.phoneNumber = phone;
          db.whatsappConnection.qrCodeData = null;
          db.whatsappConnection.lastConnectedAt = new Date().toISOString();
          db.whatsappConnection.coAdminVerified = true;
        });

        // Tunggu 2.5 detik agar koneksi WebSocket stabil sebelum query grup ke WhatsApp
        setTimeout(async () => {
          await syncGroups(true);
        }, 2500);
      }
    });

    sock.ev.on('groups.update', async (ev) => {
      console.log('[DAEMON-EVENT] groups.update terdeteksi!');
      await syncGroups(true);
    });

    sock.ev.on('groups.upsert', async (newGroups) => {
      console.log(`[DAEMON-EVENT] groups.upsert terdeteksi: ${newGroups?.length || 0} grup baru.`);
      await syncGroups(true);
    });

    sock.ev.on('group-participants.update', async (ev) => {
      try {
        console.log(`[DAEMON-EVENT] group-participants.update: ${ev.id} (${ev.action})`);
        await syncGroups(true);

        // =========================================================================
        // FITUR SAPAAN HALUS TI CYBER SECURITY: ANGGOTA BARU GABUNG (1 KALI PER NOMOR)
        // =========================================================================
        if (ev.action === 'add' && Array.isArray(ev.participants)) {
          const groupJid = ev.id;
          const dbCheck = readDb() || {};
          if (!Array.isArray(dbCheck.welcomedMembers)) {
            dbCheck.welcomedMembers = [];
          }
          const welcomedSet = new Set(dbCheck.welcomedMembers);
          const myNum = sock.user?.id ? sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

          for (const participant of ev.participants) {
            const rawParticipant = typeof participant === 'string' ? participant : (participant?.id || participant?.jid || '');
            const phoneNum = rawParticipant.replace(/[^0-9]/g, '');
            if (!phoneNum || phoneNum === myNum) continue;

            // Aturan ketat: per nomor hanya 1 kali sambutan seumur hidup
            if (welcomedSet.has(phoneNum)) {
              console.log(`[WELCOME-GUARD] Nomor +${phoneNum} sudah pernah disapa sebelumnya. Melewati sambutan.`);
              continue;
            }

            // Catat ke memori dan database secara permanen
            welcomedSet.add(phoneNum);
            updateDb((db) => {
              if (!Array.isArray(db.welcomedMembers)) db.welcomedMembers = [];
              if (!db.welcomedMembers.includes(phoneNum)) {
                db.welcomedMembers.push(phoneNum);
              }
            });

            // Sapaan halus bernuansa paguyuban Sunda ti Cyber Security + ajakan perkenalan diri
            const welcomeMessage = 
              `Sampurasun Kang/Teh @${phoneNum}! 🙏\n` +
              `Wilujeng sumping di grup resmi Paguyuban Sunda Rantau Jogja (SRJ).\n\n` +
              `🛡️ *Sapaan Ramah ti Cyber Security SRJ*:\n` +
              `Selamat bergabung di wadah silaturahmi perantau asal Tanah Sunda (Jawa Barat & Banten) di Daerah Istimewa Yogyakarta.\n\n` +
              `Paguyuban ini berlandaskan falsafah luhur leluhur urang Sunda:\n` +
              `✨ *Silih Asah, Silih Asih, Silih Asuh* ✨\n` +
              `_Nulung ka nu butuh, nalang ka nu susah._\n\n` +
              `Mangga Kang/Teh nepangkeun supados langkung wanoh & akrab:\n` +
              `• *Nama*:\n` +
              `• *Asal Lembur* (Kab/Kota di Jabar/Banten):\n` +
              `• *Di Jogjana di mana* (Daerah/Wilayah di Jogja):\n\n` +
              `Mugi-mugi betah, guyub rukun, berkah, sareng tiasa silih rojong di tanah perantauan. Rahayu! 🤝`;

            console.log(`[WELCOME-GUARD] Mengirim sapaan halus Cyber Security ke +${phoneNum} di grup ${groupJid}...`);
            await sock.sendMessage(groupJid, {
              text: welcomeMessage,
              mentions: [rawParticipant]
            }).catch(err => console.error('[WELCOME-GUARD] Gagal kirim sambutan:', err.message));
          }
        }
      } catch (err) {
        console.error('[DAEMON-EVENT] Error on group-participants.update:', err.message);
      }
    });

    // Auto-sync otomatis setiap 30 detik agar jika bot baru dimasukkan ke grup langsung tercatat
    const periodicGroupSync = setInterval(async () => {
      try {
        if (currentSock && sock?.user?.id) {
          await syncGroups(false);
        }
      } catch (e) {}
    }, 30000);

    // =========================================================================
    // FITUR DETEKSI WAKE-FROM-SLEEP: DETEKSI KETIKA LAPTOP BANGUN DARI TIDUR
    // =========================================================================
    let lastHeartbeat = Date.now();
    const sleepDetector = setInterval(async () => {
      const now = Date.now();
      const elapsed = now - lastHeartbeat;
      lastHeartbeat = now;

      // Jika jeda timer 3 detik tiba-tiba melompat lebih dari 10 detik,
      // artinya laptop baru saja dibuka atau dibangunkan dari mode Sleep / Layar Ditutup!
      if (elapsed > 10000) {
        const sleepSec = Math.round(elapsed / 1000);
        console.log(`[DAEMON-WAKE] ☀️ LAPTOP BARU SAJA BANGUN DARI TIDUR! (Sleep terdeteksi selama ~${sleepSec} detik)`);
        console.log('[DAEMON-WAKE] Memulihkan koneksi & memindai ulang seluruh grup WhatsApp secara instan...');

        // Beri jeda 2.5 detik agar kartu WiFi / jaringan laptop stabil terhubung ke internet
        setTimeout(async () => {
          try {
            if (currentSock) {
              await syncGroups(true);
              console.log('[DAEMON-WAKE] ✅ Sinkronisasi grup pasca bangun tidur selesai!');
            }
          } catch (wakeErr) {
            console.error('[DAEMON-WAKE] Gagal sinkronisasi saat bangun tidur:', wakeErr.message);
          }
        }, 2500);
      }
    }, 3000);

    // =========================================================================
    // TAMENG PRIVASI 1: AUTO-REJECT PANGGILAN SUARA / VIDEO (ANTI-STALKER)
    // =========================================================================
    sock.ev.on('call', async (callEvents) => {
      try {
        for (const call of callEvents) {
          if (call.status === 'offer') {
            console.log(`[CALL-GUARD] Panggilan terdeteksi dari ${call.from} (${call.id}). Menolak otomatis demi privasi...`);
            await sock.rejectCall(call.id, call.from).catch(() => {});

            const rejectNotice = `🛡️ *SRJ CYBER GUARDIAN — SISTEM KEAMANAN SIBER* 🛡️\n\n` +
              `⚠️ *PANGGILAN DITOLAK OTOMATIS*\n\n` +
              `Nomor ini dikelola langsung oleh *Cyber Security Paguyuban Sunda Rantau Jogja (SRJ)*.\n` +
              `• Jalur ini beroperasi 24 jam dan *TIDAK MENERIMA* panggilan suara atau video dalam bentuk apa pun.\n` +
              `• Semua riwayat panggilan masuk dicatat oleh sistem keamanan siber.\n\n` +
              `_Untuk keperluan paguyuban, silakan hubungi nomor resmi Pengurus SRJ._`;

            await sock.sendMessage(call.from, { text: rejectNotice }).catch(() => {});
          }
        }
      } catch (callErr) {
        console.error('[CALL-GUARD] Error menangani panggilan:', callErr.message);
      }
    });

    // Inbound Message Ingestion & Buffer
    const recentGroupMessages = new Map();
    const recentDmReplies = new Map();

    const processedMessageIds = new Set();

    async function handleOneMessage(msg, isBacklog = false) {
      try {
        if (!msg || !msg.message || msg.key?.fromMe) return;

      const msgId = msg.key?.id;
      if (!msgId || processedMessageIds.has(msgId)) return;
      processedMessageIds.add(msgId);
      if (processedMessageIds.size > 5000) {
        const first = processedMessageIds.values().next().value;
        processedMessageIds.delete(first);
      }

      // Filter usia pesan (hanya proses pesan maksimal 24 jam terakhir)
      const timestampSec = Number(msg.messageTimestamp) || Math.floor(Date.now() / 1000);
      const ageHours = (Date.now() / 1000 - timestampSec) / 3600;
      if (ageHours > 24) return;

      const isGroup = msg.key.remoteJid?.endsWith('@g.us');
      const groupJid = msg.key.remoteJid;
      const senderJid = msg.key.participant || msg.key.remoteJid;
      const senderName = msg.pushName || 'Warga Rantau';

      const text = 
        msg.message.conversation || 
        msg.message.extendedTextMessage?.text || 
        msg.message.imageMessage?.caption || 
        msg.message.videoMessage?.caption || 
        '';

      if (!text.trim()) return;

      if (isBacklog) {
        console.log(`[DAEMON-CATCHUP] 🔍 Memindai pesan tertinggal (${groupJid}) dari ${senderName}: "${text.slice(0, 35)}..."`);
      }

      // =========================================================================
      // TAMENG PRIVASI 2: AUTO-RESPONDER JAPRI & BLOKIR PELACAKAN PRIBADI
      // =========================================================================
      if (!isGroup) {
        if (isBacklog) return; // Jangan spam japri lama
        console.log(`[PRIVACY-GUARD] Pesan japri masuk dari ${senderJid} (${senderName}): ${text.slice(0, 35)}...`);

        // Cooldown singkat (10 detik) per nomor agar responsif saat dites namun tetap aman dari flooding
        const now = Date.now();
        const lastReplied = recentDmReplies.get(senderJid) || 0;
        if (now - lastReplied > 10 * 1000) {
          recentDmReplies.set(senderJid, now);

          const autoReplyDm = `🛡️ *SRJ CYBER GUARDIAN — SISTEM KEAMANAN SIBER* 🛡️\n\n` +
            `Sampurasun Kang/Teh ${senderName}.\n` +
            `Nomor ini dikelola langsung oleh *Cyber Security Paguyuban Sunda Rantau Jogja (SRJ)*.\n\n` +
            `📌 *Pemberitahuan Keamanan Siber*:\n` +
            `1. Akun ini dioperasikan langsung oleh Cyber Security SRJ, bukan nomor pribadi.\n` +
            `2. Sistem *TIDAK MEMBUKA LINK / FILE* apa pun yang dikirim melalui jalur pribadi demi keamanan siber.\n` +
            `3. Nomor ini tidak melayani obrolan pribadi (japri) maupun panggilan telepon.\n\n` +
            `_Untuk urusan paguyuban, silakan berinteraksi di dalam grup resmi atau hubungi kontak Pengurus Paguyuban Sunda Rantau Jogja._`;

          console.log(`[PRIVACY-GUARD] Mengirim auto-reply japri ke ${groupJid}...`);
          await sock.sendMessage(groupJid, { text: autoReplyDm }, { quoted: msg })
            .then(() => console.log(`[PRIVACY-GUARD] Berhasil kirim auto-reply ke ${groupJid}`))
            .catch(e => console.error('[PRIVACY-GUARD] Gagal kirim auto-reply japri:', e.message));
        } else {
          console.log(`[PRIVACY-GUARD] Pesan japri dari ${senderJid} diabaikan (cooldown aktif).`);
        }
        return; // Hentikan di sini, jangan teruskan pesan japri ke pipeline moderasi grup
      }

          // =========================================================================
          // DETEKSI OTOMATIS & PEMANTAUAN GRUP WHATSAPP
          // =========================================================================
          let dbCheck = readDb();
          let targetGroup = dbCheck?.monitoredGroups?.find(g => g.groupJid === groupJid);

          // Jika grup baru belum terdaftar di database, otomatis deteksi & daftarkan!
          if (!targetGroup) {
            console.log(`[DAEMON-DISCOVERY] 🚀 Aktivitas pesan terdeteksi dari grup baru: ${groupJid}`);
            try {
              const meta = await sock.groupMetadata(groupJid).catch(() => null);
              const myJid = sock.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : '';
              const isBotAdmin = meta?.participants?.some(p => p.id === myJid && (p.admin === 'admin' || p.admin === 'superadmin')) || false;
              const groupSubject = meta?.subject || 'Grup WhatsApp Baru';
              const isSrjOrSecurity = /srj|sunda|keamanan|security|rantau|jogja/i.test(groupSubject);

              targetGroup = {
                id: `grp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                groupJid,
                groupName: groupSubject,
                isActive: true, // Otomatis aktifkan agar langsung melindungi grup!
                autoScanUrls: true,
                autoModContent: true,
                socialCareEnabled: true,
                autoDeleteThreats: isBotAdmin,
                rulesSummary: meta?.desc || 'Grup Komunitas Sunda Rantau Jogja. Silih Asah, Silih Asih, Silih Asuh.',
                createdAt: new Date().toISOString()
              };

              updateDb((db) => {
                if (!db.monitoredGroups) db.monitoredGroups = [];
                if (!db.monitoredGroups.some(g => g.groupJid === groupJid)) {
                  db.monitoredGroups.push(targetGroup);
                }
              });

              console.log(`[DAEMON-DISCOVERY] ✅ Grup "${groupSubject}" berhasil didaftarkan & OTOMATIS DIAKTIFKAN untuk perlindungan siber! (Admin: ${isBotAdmin ? 'YA' : 'BELUM'})`);
            } catch (metaErr) {
              console.error('[DAEMON-DISCOVERY] Gagal mengambil metadata grup:', metaErr.message);
            }
          }

          if (!targetGroup || !targetGroup.isActive) {
            // Jika grup sengaja dinonaktifkan manual oleh admin di dashboard, abaikan pesan
            return;
          }

          // =========================================================================
          // FITUR PEMANGGILAN BOT MANUAL: KODE PERINTAH ADMIN (bot 01, bot 02, dst.)
          // =========================================================================
          const cleanText = text.trim();
          const matchBotCode = cleanText.match(/^(!|#|\/)?bot\s*(0[1-9]|[1-9])\b/i);
          const matchCodeBot = cleanText.match(/^(!|#|\/)?(0[1-9]|[1-9])\s*bot\b/i);
          const matchHelp = cleanText.match(/^(!|#|\/)?bot\s*(menu|help|panduan|info)\b|^(!|#|\/)?(menu|help|panduan|info)\s*bot\b/i);

          const isCmd = Boolean(matchBotCode || matchCodeBot || matchHelp);
          const code = matchBotCode 
            ? matchBotCode[2].padStart(2, '0') 
            : (matchCodeBot ? matchCodeBot[2].padStart(2, '0') : null);

          if (isCmd && isGroup) {
            // Panduan Menu Bot
            if (matchHelp || code === '04') {
              const menuText = `📋 *MENU PERINTAH BOT SRJ GUARDIAN* 📋\n` +
                `_Sistem Keamanan & Penjaga Marwah Paguyuban Sunda Rantau Jogja_\n\n` +
                `Balas *(quote/reply)* pesan target lalu ketik salah satu kode:\n\n` +
                `• *bot 01* : Hapus kata kasar / makian + Peringatan etika tutur kata Sunda\n` +
                `• *bot 02* : Hapus penipuan / saldo masuk palsu + Peringatan anti-phishing & rekening\n` +
                `• *bot 03* : Hapus ajakan dugem / miras / judi / maksiat + Peringatan tegas\n` +
                `• *bot 04* : Tampilkan menu panduan perintah bot ini\n` +
                `• *bot 05* : Tandai anggota butuh bantuan darurat / peduli sosial (Social Care)\n` +
                `• *bot 06* : Kirim sapaan hangat Cyber Security SRJ & ajakan perkenalan untuk anggota ini\n\n` +
                `_Falsafah: Silih Asah, Silih Asih, Silih Asuh_`;

              await sock.sendMessage(groupJid, { text: menuText }, { quoted: msg }).catch(() => {});
              return;
            }

            console.log(`[DAEMON-CMD] Perintah admin terdeteksi: code [${code}] dari ${senderName} (${senderJid}) di ${groupJid}`);

            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
            const quotedStanzaId = contextInfo?.stanzaId;
            const quotedParticipant = contextInfo?.participant;
            const quotedText = contextInfo?.quotedMessage?.conversation || contextInfo?.quotedMessage?.extendedTextMessage?.text || '';

            const history = recentGroupMessages.get(groupJid) || [];

            // Cari pesan sasaran (dari reply/quote atau dari history terakhir)
            let targetId = quotedStanzaId;
            let targetSender = quotedParticipant;
            let targetName = 'Anggota Grup';
            let targetContent = quotedText;

            if (!targetId) {
              const lastOtherMsg = history.find(h => h.senderJid !== senderJid) || history[0];
              if (lastOtherMsg) {
                targetId = lastOtherMsg.messageId;
                targetSender = lastOtherMsg.senderJid;
                targetName = lastOtherMsg.senderName;
                targetContent = lastOtherMsg.text;
              }
            }

            const targetNumber = targetSender ? targetSender.replace(/[^0-9]/g, '') : '';

            // 1. KODE 01: HAPUS KATA KASAR / MAKIANT + PERINGATAN ETIKA TUTUR KATA SUNDA
            if (code === '01') {
              if (targetId && targetSender) {
                console.log(`[CMD-01] Menghapus pesan kata kasar ${targetId} dari ${targetSender}`);
                await sock.sendMessage(groupJid, {
                  delete: {
                    remoteJid: groupJid,
                    fromMe: false,
                    id: targetId,
                    participant: targetSender
                  }
                }).catch(e => console.error('[CMD-01] Gagal hapus sasaran:', e.message));

                await sock.sendMessage(groupJid, { delete: msg.key }).catch(() => {});

                const warningText = `⚠️ *PERINGATAN TATA KRAMA & ETIKA TUTUR KATA* ⚠️\n` +
                  `_SRJ GUARDIAN — PENJAGA KETERTIBAN GRUP_\n\n` +
                  `Pesan dari @${targetNumber} telah *DIHAPUS* oleh sistem atas panggilan pengurus *[bot 01]*.\n\n` +
                  `📌 *Alasan*: Penggunaan Kata Kasar / Hinaan / Ujaran Tidak Pantas\n\n` +
                  `💡 *HIMBAUAN ETIKA*:\n` +
                  `Mohon jaga lisan dan kesopanan tutur kata saat berkomunikasi di grup. Mari saling menghargai sesama warga perantau.`;

                await sock.sendMessage(groupJid, {
                  text: warningText,
                  mentions: [targetSender]
                }).catch(e => console.error('[CMD-01] Gagal kirim peringatan:', e.message));

                updateDb((db) => {
                  if (!db.moderationLogs) db.moderationLogs = [];
                  db.moderationLogs.unshift({
                    id: `mod-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    groupJid,
                    groupName: 'Grup WhatsApp',
                    senderJid: targetSender,
                    senderName: targetName,
                    messageId: targetId,
                    ruleViolation: 'INSULT',
                    confidenceScore: 1.0,
                    contextAnalysis: `Pesan kata kasar dihapus via perintah admin [bot 01] oleh ${senderName}.`,
                    rawContent: targetContent || '[Pesan Dihapus via bot 01]',
                    adminDecision: 'SANCTIONED'
                  });
                });
              }
              return;
            }

            // 2. KODE 02: HAPUS PENIPUAN / SALDO MASUK PALSU / PHISHING + PERINGATAN KEAMANAN SIBER
            if (code === '02') {
              if (targetId && targetSender) {
                console.log(`[CMD-02] Menghapus pesan penipuan/phishing ${targetId} dari ${targetSender}`);
                await sock.sendMessage(groupJid, {
                  delete: {
                    remoteJid: groupJid,
                    fromMe: false,
                    id: targetId,
                    participant: targetSender
                  }
                }).catch(e => console.error('[CMD-02] Gagal hapus sasaran:', e.message));

                await sock.sendMessage(groupJid, { delete: msg.key }).catch(() => {});

                const warningText = `🛡️ *PERINGATAN KERAS DARI CYBER SECURITY: ANTI-PENIPUAN & PHISHING* 🛡️\n` +
                  `_SRJ GUARDIAN — SISTEM KEAMANAN SIBER_\n\n` +
                  `🚨 *WASPADA*: Pesan dari @${targetNumber} telah *DIHAPUS* oleh sistem atas panggilan pengurus *[bot 02]*.\n\n` +
                  `📌 *Alasan*: Terindikasi Penipuan Siber / Modus Saldo Masuk / Link Phishing Berbahaya\n\n` +
                  `⚠️ *PERINGATAN KERAS DARI CYBER SECURITY*:\n` +
                  `1. JANGAN PERNAH mengklik tautan/link yang menjanjikan saldo masuk, hadiah, transfer uang, atau undian!\n` +
                  `2. JANGAN unduh file APK asing karena berisiko mencuri kode OTP dan membobol rekening M-Banking.\n\n` +
                  `🛑 *SANKSI PENGAMANAN SIBER*:\n` +
                  `Nomor yang terindikasi diretas atau sengaja menyebarkan link penipuan akan *LANGSUNG DI-KICK* demi melindungi keamanan rekening seluruh anggota grup!`;

                await sock.sendMessage(groupJid, {
                  text: warningText,
                  mentions: [targetSender]
                }).catch(e => console.error('[CMD-02] Gagal kirim peringatan siber:', e.message));

                updateDb((db) => {
                  if (!db.securityIncidents) db.securityIncidents = [];
                  db.securityIncidents.unshift({
                    id: `sec-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    groupJid,
                    groupName: 'Grup WhatsApp',
                    senderJid: targetSender,
                    senderName: targetName,
                    messageId: targetId,
                    threatType: 'PHISHING',
                    riskLevel: 'BERBAHAYA',
                    rawContent: targetContent || '[Pesan Dihapus via bot 02]',
                    aiAnalysis: `Pesan penipuan/phishing dihapus via perintah admin [bot 02] oleh ${senderName}.`,
                    actionTaken: 'MESSAGE_DELETED',
                    adminStatus: 'ACKNOWLEDGED',
                    detectedUrls: []
                  });
                });
              }
              return;
            }

            // 3. KODE 03: HAPUS AJAKAN DUGEM / MIRAS / JUDI SLOT / MAKSIAT + PERINGATAN TEGAS
            if (code === '03') {
              if (targetId && targetSender) {
                console.log(`[CMD-03] Menghapus pesan dugem/miras ${targetId} dari ${targetSender}`);
                await sock.sendMessage(groupJid, {
                  delete: {
                    remoteJid: groupJid,
                    fromMe: false,
                    id: targetId,
                    participant: targetSender
                  }
                }).catch(e => console.error('[CMD-03] Gagal hapus sasaran:', e.message));

                await sock.sendMessage(groupJid, { delete: msg.key }).catch(() => {});

                const warningText = `⛔ *PERINGATAN KETERTIBAN & LARANGAN MAKSIAT* ⛔\n` +
                  `_SRJ GUARDIAN — PENEGAK ATURAN PAGUYUBAN_\n\n` +
                  `Pesan dari @${targetNumber} telah *DIHAPUS* oleh sistem atas panggilan pengurus *[bot 03]*.\n\n` +
                  `📌 *Alasan*: Ajakan / Konten Tidak Pantas (Dugem / Miras / Mabuk / Judi Online / Asusila)\n\n` +
                  `🛑 *SANKSI TEGAS*:\n` +
                  `*1 KALI LAGI* Anda melakukan tindakan yang sama atau menyebarkan konten serupa, kami akan *LANGSUNG MENG-KICK (MENGELUARKAN)* Anda secara permanen dari grup paguyuban!`;

                await sock.sendMessage(groupJid, {
                  text: warningText,
                  mentions: [targetSender]
                }).catch(e => console.error('[CMD-03] Gagal kirim peringatan maksiat:', e.message));

                updateDb((db) => {
                  if (!db.moderationLogs) db.moderationLogs = [];
                  db.moderationLogs.unshift({
                    id: `mod-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    groupJid,
                    groupName: 'Grup WhatsApp',
                    senderJid: targetSender,
                    senderName: targetName,
                    messageId: targetId,
                    ruleViolation: 'INAPPROPRIATE_BEHAVIOR',
                    confidenceScore: 1.0,
                    contextAnalysis: `Pesan ajakan dugem/miras dihapus via perintah admin [bot 03] oleh ${senderName}.`,
                    rawContent: targetContent || '[Pesan Dihapus via bot 03]',
                    adminDecision: 'SANCTIONED'
                  });
                });
              }
              return;
            }

            // 5. KODE 05: TANDAI ANGGOTA BUTUH BANTUAN (SOCIAL CARE)
            if (code === '05') {
              const targetSenderSafe = targetSender || senderJid;
              const targetTextSafe = targetContent || text;
              const targetNumberSafe = targetSenderSafe.replace(/[^0-9]/g, '');

              updateDb((db) => {
                if (!db.helpReports) db.helpReports = [];
                db.helpReports.unshift({
                  id: `help-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  groupJid,
                  groupName: 'Grup WhatsApp',
                  senderJid: targetSenderSafe,
                  senderName: `@${targetNumberSafe}`,
                  messageId: targetId || msg.key.id,
                  category: 'BANTUAN_SOSIAL',
                  urgency: 'HIGH',
                  summary: 'Anggota ditandai membutuhkan bantuan perantau melalui perintah [bot 05].',
                  excerpt: targetTextSafe,
                  rawMessage: targetTextSafe,
                  status: 'NEW'
                });
              });

              await sock.sendMessage(groupJid, {
                text: `🤝 *AI SOCIAL CARE SRJ*\n\nPesan dari @${targetNumberSafe} telah ditandai dan diteruskan ke tim pengurus & relawan SRJ.\n_Nulung ka nu butuh, nalang ka nu susah._`,
                mentions: [targetSenderSafe]
              }, { quoted: msg }).catch(() => {});
              return;
            }

            // 6. KODE 06: SAPA ANGGOTA SECARA MANUAL VIA PERINTAH [bot 06] / [bot sapa]
            if (code === '06' || cleanText.toLowerCase().includes('bot sapa') || cleanText.toLowerCase().includes('sapa bot')) {
              const targetSenderSafe = targetSender || senderJid;
              const targetNumberSafe = targetSenderSafe.replace(/[^0-9]/g, '');

              updateDb((db) => {
                if (!Array.isArray(db.welcomedMembers)) db.welcomedMembers = [];
                if (!db.welcomedMembers.includes(targetNumberSafe)) {
                  db.welcomedMembers.push(targetNumberSafe);
                }
              });

              const welcomeMessage = 
                `Sampurasun Kang/Teh @${targetNumberSafe}! 🙏\n` +
                `Wilujeng sumping di grup resmi Paguyuban Sunda Rantau Jogja (SRJ).\n\n` +
                `🛡️ *Sapaan Ramah ti Cyber Security SRJ*:\n` +
                `Selamat bergabung di wadah silaturahmi perantau asal Tanah Sunda (Jawa Barat & Banten) di Daerah Istimewa Yogyakarta.\n\n` +
                `Paguyuban ini berlandaskan falsafah luhur leluhur urang Sunda:\n` +
                `✨ *Silih Asah, Silih Asih, Silih Asuh* ✨\n` +
                `_Nulung ka nu butuh, nalang ka nu susah._\n\n` +
                `Mangga Kang/Teh nepangkeun supados langkung wanoh & akrab:\n` +
                `• *Nama*:\n` +
                `• *Asal Lembur* (Kab/Kota di Jabar/Banten):\n` +
                `• *Di Jogjana di mana* (Daerah/Wilayah di Jogja):\n\n` +
                `Mugi-mugi betah, guyub rukun, berkah, sareng tiasa silih rojong di tanah perantauan. Rahayu! 🤝`;

              console.log(`[CMD-06] Mengirim sapaan manual atas perintah bot 06 ke @${targetNumberSafe} di ${groupJid}`);
              await sock.sendMessage(groupJid, {
                text: welcomeMessage,
                mentions: [targetSenderSafe]
              }, { quoted: msg }).catch(e => console.error('[CMD-06] Gagal kirim sambutan:', e.message));
              return;
            }
          }

          // Simpan riwayat pesan untuk referensi perintah tanpa quote
          if (!recentGroupMessages.has(groupJid)) {
            recentGroupMessages.set(groupJid, []);
          }
          const groupHistory = recentGroupMessages.get(groupJid);
          groupHistory.unshift({
            messageId: msg.key.id,
            senderJid,
            senderName,
            text,
            timestamp: Date.now()
          });
          if (groupHistory.length > 25) groupHistory.pop();

          console.log(`[DAEMON-MSG] [${groupJid}] ${senderName}: ${text.slice(0, 45)}...`);

          // =========================================================================
          // FITUR DETEKSI PERKENALAN ANGGOTA BARU DI CHAT (Misal: "Izin gabung...", "Salam kenal...")
          // =========================================================================
          const isIntroMessage = /\b(izin\s*gabung|salam\s*kenal|nembe\s*gabung|abdi\s*perantau|anyar\s*gabung|baru\s*gabung|gabung\s*kang|gabung\s*teh|sampurasun.*gabung)\b/i.test(text);

          if (isIntroMessage && isGroup) {
            const dbCheck = readDb() || {};
            if (!Array.isArray(dbCheck.welcomedMembers)) {
              dbCheck.welcomedMembers = [];
            }
            const welcomedSet = new Set(dbCheck.welcomedMembers);
            const senderNumber = senderJid.replace(/[^0-9]/g, '');
            const myNum = sock.user?.id ? sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

            if (senderNumber && senderNumber !== myNum && !welcomedSet.has(senderNumber)) {
              console.log(`[WELCOME-GUARD] 🤝 Deteksi perkenalan anggota baru di chat dari @${senderNumber}: "${text.slice(0, 30)}..."`);
              welcomedSet.add(senderNumber);
              updateDb((db) => {
                if (!Array.isArray(db.welcomedMembers)) db.welcomedMembers = [];
                if (!db.welcomedMembers.includes(senderNumber)) {
                  db.welcomedMembers.push(senderNumber);
                }
              });

              const welcomeMessage = 
                `Sampurasun Kang/Teh @${senderNumber}! 🙏\n` +
                `Wilujeng sumping di grup resmi Paguyuban Sunda Rantau Jogja (SRJ).\n\n` +
                `🛡️ *Sapaan Ramah ti Cyber Security SRJ*:\n` +
                `Selamat bergabung di wadah silaturahmi perantau asal Tanah Sunda (Jawa Barat & Banten) di Daerah Istimewa Yogyakarta.\n\n` +
                `Paguyuban ini berlandaskan falsafah luhur leluhur urang Sunda:\n` +
                `✨ *Silih Asah, Silih Asih, Silih Asuh* ✨\n` +
                `_Nulung ka nu butuh, nalang ka nu susah._\n\n` +
                `Mangga Kang/Teh nepangkeun supados langkung wanoh & akrab:\n` +
                `• *Nama*:\n` +
                `• *Asal Lembur* (Kab/Kota di Jabar/Banten):\n` +
                `• *Di Jogjana di mana* (Daerah/Wilayah di Jogja):\n\n` +
                `Mugi-mugi betah, guyub rukun, berkah, sareng tiasa silih rojong di tanah perantauan. Rahayu! 🤝`;

              await sock.sendMessage(groupJid, {
                text: welcomeMessage,
                mentions: [senderJid]
              }, { quoted: msg }).catch(err => console.error('[WELCOME-GUARD] Gagal kirim sambutan otomatis:', err.message));
            }
          }

          // =========================================================================
          // JALUR KILAT (FAST-PATH INSTANT ACTION): EKSEKUSI DALAM HITUNGAN MILIDETIK (<50ms)
          // =========================================================================
          const fastViolation = isGroup ? inspectFastRules(text) : null;
          if (fastViolation && isGroup) {
            console.log(`[DAEMON-FAST-PATH] ⚡ Pelanggaran instan terdeteksi [${fastViolation.type}] dari ${senderName} di ${groupJid}! Menghapus langsung tanpa jeda...`);

            // 1. LANGSUNG HAPUS PESAN DARI WHATSAPP DALAM MILIDETIK
            await sock.sendMessage(groupJid, { delete: msg.key }).catch(e => {
              console.error('[DAEMON-DELETE-FAST] Gagal hapus pesan:', e.message);
              if (e.message?.includes('admin') || e.message?.includes('403') || e.message?.includes('forbidden')) {
                console.warn('[DAEMON-ADMIN-WARN] Nomor bot (+6285780459052) belum menjadi Admin di grup ini. Harap jadikan Admin agar bot bisa menghapus pesan!');
              }
            });

            // 2. LANGSUNG KIRIM PERINGATAN RESMI CYBER SECURITY KE GRUP
            const senderNumber = senderJid.replace(/[^0-9]/g, '');
            const warningText = `${fastViolation.title}\n_SRJ GUARDIAN — SISTEM KEAMANAN SIBER_\n\n` +
              `🚨 *WASPADA*: Pesan dari @${senderNumber} telah *DIHAPUS OTOMATIS* demi keamanan grup.\n\n` +
              `${fastViolation.threatHeader}\n\n` +
              `${fastViolation.advice}`;

            await sock.sendMessage(groupJid, {
              text: warningText,
              mentions: [senderJid]
            }).catch(e => console.error('[DAEMON-WARN-FAST] Gagal kirim peringatan:', e.message));

            // 3. JAPRI ADMIN RESMI
            const currentDb = readDb();
            const adminPhone = currentDb?.settings?.primaryAdminPhone?.replace(/[^0-9]/g, '');
            if (adminPhone) {
              const alertAdmin = `🛡️ *SRJ GUARDIAN — PERINGATAN KILAT SIBER*\n\n` +
                `⚠️ Ancaman: *${fastViolation.type}* (${fastViolation.category})\n` +
                `👥 Grup: WhatsApp Group\n` +
                `👤 Pengirim: ${senderName} (+${senderNumber})\n` +
                `💬 Pesan: "${text}"\n` +
                `🎯 Tindakan: Otomatis Dihapus Instan dari Grup (<50ms)`;

              sock.sendMessage(`${adminPhone}@s.whatsapp.net`, { text: alertAdmin }).catch(() => {});
            }

            // 4. DISPATCH KE PIPELINE SECARA BACKGROUND (ASYNCHRONOUS) UNTUK RECORD DATABASE & DASHBOARD
            fetch('http://127.0.0.1:3000/api/pipeline/ingest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                groupJid,
                groupName: isGroup ? 'SUNDA RANTAU JOGJA' : 'Private Chat',
                senderJid,
                senderName,
                messageId: msg.key.id,
                text
              })
            }).catch(e => console.error('[DAEMON-FAST-LOG] Gagal background log:', e.message));

            return; // Selesai seketika!
          }

          try {
            const res = await fetch('http://127.0.0.1:3000/api/pipeline/ingest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                groupJid,
                groupName: isGroup ? 'SUNDA RANTAU JOGJA' : 'Private Chat',
                senderJid,
                senderName,
                messageId: msg.key.id,
                text
              })
            });

            const data = await res.json();
            const result = data.data;

            if (result) {
              // Hapus pesan otomatis jika terdeteksi ancaman keamanan atau pelanggaran aturan moderasi
              if (isGroup && (result.actionTaken === 'MESSAGE_DELETED' || result.securityIncident || result.moderationLog)) {
                console.log(`[DAEMON-ACTION] Menghapus pesan ${msg.key.id} dari ${senderName} di grup ${groupJid}`);
                await sock.sendMessage(groupJid, { delete: msg.key }).catch(e => {
                  console.error('[DAEMON-DELETE] Gagal hapus pesan:', e.message);
                  if (e.message?.includes('admin') || e.message?.includes('403') || e.message?.includes('forbidden')) {
                    console.warn('[DAEMON-ADMIN-WARN] Nomor bot (+6285780459052) belum menjadi Admin di grup ini. Harap jadikan Admin agar bot bisa menghapus pesan!');
                  }
                });
              }

              // 1. KIRIM PERINGATAN LANGSUNG KE DALAM GRUP WHATSAPP SAAT TERDETEKSI
              if (isGroup) {
                const senderNumber = senderJid.replace(/[^0-9]/g, '');

                // A. Peringatan Ancaman Keamanan Siber (Phishing / Modus Saldo Masuk / Scam / Judol Link / APK Sniffing)
                if (result.securityIncident) {
                  const threat = result.securityIncident.threatType;
                  const rawLower = (text || '').toLowerCase();
                  const isSaldoScam = /saldo.*masuk|cek saldo|penarikan|cairkan|klaim.*saldo|dana kaget|danakaget|hadiah|undian/i.test(rawLower);
                  const isJudolLink = /slot|gacor|judol|judi|zeus|maxwin|olympus|togel|toto|sbobet|bet88|rtp|depo/i.test(rawLower);

                  let secTitle = '🛡️ *PERINGATAN KEAMANAN SIBER & ANTI-PENIPUAN* 🛡️';
                  let threatHeader = '';
                  let advice = '';

                  if (isJudolLink) {
                    secTitle = '🎰 *PERINGATAN KERAS DARI CYBER SECURITY: LINK JUDI ONLINE (JUDOL)* 🎰';
                    threatHeader = '📌 *Terdeteksi*: Tautan / Situs Perjudian Online (Slot Gacor / Togel / Taruhan)';
                    advice = '⚠️ *PERINGATAN KERAS DARI CYBER SECURITY*:\n' +
                      'Tautan perjudian online dilarang keras dan melanggar hukum RI (Pasal 27 ayat 2 UU ITE).\n\n' +
                      '🛑 *SANKSI KHUSUS JUDOL*:\n' +
                      '*1 KALI LAGI* membagikan tautan judol, nomor Anda akan *LANGSUNG DI-KICK & DIBLOKIR PERMANEN* dari seluruh grup SRJ!';
                  } else if (threat === 'MALWARE' || rawLower.includes('.apk')) {
                    secTitle = '🛡️ *PERINGATAN KERAS DARI CYBER SECURITY: VIRUS & MALWARE (.APK)* 🛡️';
                    threatHeader = '📌 *Terdeteksi*: File Aplikasi Berbahaya (.APK Trojan Sniffer)';
                    advice = '⚠️ *PERINGATAN KERAS DARI CYBER SECURITY*:\n' +
                      'File APK asing berisiko mencuri kode OTP dan menguras saldo rekening M-Banking!\n\n' +
                      '🛑 *SANKSI PENGAMANAN SIBER*:\n' +
                      '*1 KALI LAGI* menyebarkan file APK asing, nomor Anda akan *LANGSUNG DI-KICK & DI-BLACKLIST* oleh sistem!';
                  } else if (isSaldoScam) {
                    secTitle = '🛡️ *PERINGATAN KERAS DARI CYBER SECURITY: PENIPUAN SALDO & PHISHING* 🛡️';
                    threatHeader = '📌 *Terdeteksi*: Modus Penipuan Saldo Masuk / Link Pencairan Palsu / Phishing';
                    advice = '⚠️ *PERINGATAN KERAS DARI CYBER SECURITY*:\n' +
                      '1. JANGAN PERNAH mengklik tautan/link yang menjanjikan saldo masuk, transfer gratis, hadiah tunai, atau undian!\n' +
                      '2. JANGAN mengisi nomor rekening, PIN, atau kode OTP di tautan tidak resmi.\n\n' +
                      '🛑 *SANKSI PENGAMANAN SIBER*:\n' +
                      'Jika nomor Anda terus menyebarkan link penipuan serupa (indikasi akun telah dibajak), nomor Anda akan *SEKETIKA DI-KICK* demi melindungi rekening anggota grup!';
                  } else {
                    threatHeader = '📌 *Terdeteksi*: Tautan / Konten Phishing Berbahaya';
                    advice = '⚠️ *PERINGATAN KERAS DARI CYBER SECURITY*:\n' +
                      'Tautan mencurigakan dapat mencuri data pribadi dan akun Anda. Jangan klik tautan asing!\n\n' +
                      '🛑 *SANKSI PENGAMANAN SIBER*:\n' +
                      '*1 KALI LAGI* mengirimkan tautan mencurigakan, nomor Anda akan *DI-KICK SEMENTARA* demi keamanan grup!';
                  }

                  const securityWarningText = `${secTitle}\n_SRJ GUARDIAN — SISTEM KEAMANAN SIBER_\n\n` +
                    `🚨 *WASPADA*: Pesan dari @${senderNumber} telah *DIHAPUS OTOMATIS* demi keamanan grup.\n\n` +
                    `${threatHeader}\n\n` +
                    `${advice}`;

                  console.log(`[DAEMON-ACTION] Mengirim peringatan keamanan siber khusus ke grup ${groupJid}`);
                  await sock.sendMessage(groupJid, {
                    text: securityWarningText,
                    mentions: [senderJid]
                  }).catch(e => console.error('Gagal kirim peringatan keamanan ke grup:', e.message));

                } else if (result.moderationLog) {
                  // B. Peringatan Moderasi (Bukan Security Threat)
                  const rule = result.moderationLog.ruleViolation;

                  if (rule === 'JUDI_ONLINE') {
                    // 1. Khusus Judi Online / Judol / Slot Gacor / Togel
                    const groupWarningText = `🎰 *PERINGATAN KERAS DARI CYBER SECURITY: LARANGAN SITUS JUDI ONLINE (JUDOL)* 🎰\n` +
                      `_SRJ GUARDIAN — SISTEM KEAMANAN SIBER_\n\n` +
                      `🚨 *PEMBERITAHUAN SIBER*: Tautan / ajakan judi online dari @${senderNumber} telah *DIHAPUS OTOMATIS* dari grup!\n\n` +
                      `📌 *Terdeteksi*: Promosi Tautan / Ajakan Judi Online (Slot Gacor / Togel / Taruhan Online)\n\n` +
                      `⚠️ *PERINGATAN KERAS DARI CYBER SECURITY*:\n` +
                      `Penyebaran tautan perjudian online melanggar hukum RI (Pasal 27 ayat 2 UU ITE) serta dilarang keras di komunitas SRJ. Nomor pengirim telah dicatat oleh sistem keamanan siber.\n\n` +
                      `🛑 *SANKSI KHUSUS JUDOL*:\n` +
                      `*1 KALI LAGI* terdeteksi membagikan tautan/ajakan judol, nomor Anda akan *LANGSUNG DI-KICK & DIBLOKIR PERMANEN* dari seluruh grup jaringan SRJ!`;

                    console.log(`[DAEMON-ACTION] Mengirim peringatan judi online ke grup ${groupJid}`);
                    await sock.sendMessage(groupJid, {
                      text: groupWarningText,
                      mentions: [senderJid]
                    }).catch(e => console.error('Gagal kirim peringatan judi online ke grup:', e.message));

                  } else if (rule === 'INAPPROPRIATE_BEHAVIOR') {
                    // 2. Dugem, Miras, Mabuk, Prostitusi, Narkoba
                    const groupWarningText = `⛔ *PERINGATAN KETERTIBAN: LARANGAN MAKSIAT & KONTEN TIDAK PANTAS* ⛔\n` +
                      `_SRJ GUARDIAN — PENEGAK ATURAN PAGUYUBAN_\n\n` +
                      `Perhatian Kang/Teh @${senderNumber},\n` +
                      `Pesan Anda telah *DIHAPUS* oleh Cyber Security SRJ.\n\n` +
                      `📌 *Terdeteksi*: Ajakan / Konten Tidak Pantas (Dugem / Miras / Mabuk / Maksiat / Asusila)\n\n` +
                      `⚠️ *PERINGATAN KERAS DARI CYBER SECURITY & PENGURUS*:\n` +
                      `Grup Paguyuban Sunda Rantau Jogja (SRJ) adalah wadah silaturahmi perantau yang tertib dan bermartabat. Dilarang keras mengajak pesta malam/dugem, mabuk miras, atau konten asusila!\n\n` +
                      `🛑 *SANKSI PELANGGARAN ATURAN*:\n` +
                      `*1 KALI LAGI* melakukan tindakan yang sama, hak keanggotaan Anda akan dicabut dan Anda akan *LANGSUNG DI-KICK* dari paguyuban!`;

                    console.log(`[DAEMON-ACTION] Mengirim peringatan maksiat/dugem ke grup ${groupJid}`);
                    await sock.sendMessage(groupJid, {
                      text: groupWarningText,
                      mentions: [senderJid]
                    }).catch(e => console.error('Gagal kirim peringatan perilaku ke grup:', e.message));

                  } else if (rule === 'INSULT') {
                    // 3. Kata Kasar, Makian, Hinaan (TANPA SANKSI KICK - HANYA HIMBAUAN ETIKA)
                    const groupWarningText = `⚠️ *PERINGATAN TATA KRAMA & ETIKA TUTUR KATA* ⚠️\n` +
                      `_SRJ GUARDIAN — PENJAGA KETERTIBAN GRUP_\n\n` +
                      `Sampurasun Kang/Teh @${senderNumber},\n` +
                      `Pesan Anda telah *DIHAPUS* oleh Cyber Security SRJ.\n\n` +
                      `📌 *Terdeteksi*: Penggunaan Kata Kasar / Hinaan / Makian Tidak Pantas\n\n` +
                      `💡 *HIMBAUAN ETIKA*:\n` +
                      `Harap jaga lisan, kesopanan, dan etika tutur kata saat berkomunikasi di grup. Dilarang mencaci, menghina, atau menggunakan kata-kata kotor. Mari saling menghargai sesama warga perantau.`;

                    console.log(`[DAEMON-ACTION] Mengirim peringatan tata krama ke grup ${groupJid}`);
                    await sock.sendMessage(groupJid, {
                      text: groupWarningText,
                      mentions: [senderJid]
                    }).catch(e => console.error('Gagal kirim peringatan tata krama ke grup:', e.message));

                  } else if (rule === 'FLEXING') {
                    // 4. Flexing / Pamer Sombong Merendahkan
                    const groupWarningText = `⚠️ *PERINGATAN KESETARAAN & EMPATI WARGA* ⚠️\n` +
                      `_SRJ GUARDIAN — PENJAGA KETERTIBAN GRUP_\n\n` +
                      `Sampurasun Kang/Teh @${senderNumber},\n` +
                      `Pesan Anda telah *DIHAPUS* oleh Cyber Security SRJ.\n\n` +
                      `📌 *Terdeteksi*: Pamer Kekayaan / Merendahkan Kondisi Anggota Lain\n\n` +
                      `🛑 *SANKSI SOSIAL*:\n` +
                      `Grup ini adalah wadah silaturahmi perantau untuk saling menguatkan. Pelanggaran berulang akan dikenakan sanksi *PEMBATASAN CHAT (MUTE)* di grup!`;

                    console.log(`[DAEMON-ACTION] Mengirim peringatan flexing ke grup ${groupJid}`);
                    await sock.sendMessage(groupJid, {
                      text: groupWarningText,
                      mentions: [senderJid]
                    }).catch(e => console.error('Gagal kirim peringatan flexing ke grup:', e.message));

                  } else {
                    // 5. Provokasi / Adu Domba / Pelanggaran Aturan
                    const groupWarningText = `⚠️ *PERINGATAN KETERTIBAN PAGUYUBAN* ⚠️\n` +
                      `_SRJ GUARDIAN — PENJAGA KETERTIBAN GRUP_\n\n` +
                      `Sampurasun Kang/Teh @${senderNumber},\n` +
                      `Pesan Anda telah *DIHAPUS* oleh Cyber Security SRJ demi ketenteraman bersama.\n\n` +
                      `📌 *Terdeteksi*: Ujaran Bernada Provokasi / Adu Domba / Bikin Gaduh\n\n` +
                      `🛑 *SANKSI PEMBUAT KEGADUHAN*:\n` +
                      `*1 KALI LAGI* memicu keributan atau memprovokasi anggota lain di grup, Anda akan *LANGSUNG DI-KICK* tanpa toleransi!`;

                    console.log(`[DAEMON-ACTION] Mengirim peringatan provokasi ke grup ${groupJid}`);
                    await sock.sendMessage(groupJid, {
                      text: groupWarningText,
                      mentions: [senderJid]
                    }).catch(e => console.error('Gagal kirim peringatan provokasi ke grup:', e.message));
                  }
                }
              }

              // 2. LAPORAN PRIBADI JAPRI KE WHATSAPP ADMIN UTAMA
              const currentDb = readDb();
              const adminPhone = currentDb?.settings?.primaryAdminPhone?.replace(/[^0-9]/g, '');
              if (adminPhone && (result.securityIncident || result.helpReport || result.moderationLog)) {
                let alertMsg = '';
                if (result.securityIncident) {
                  alertMsg = `🛡️ *SRJ GUARDIAN — ALERT KEAMANAN*\n\n` +
                    `⚠️ Ancaman: *${result.securityIncident.threatType}* (${result.securityIncident.riskLevel})\n` +
                    `👥 Grup: ${isGroup ? 'Grup WhatsApp' : 'Private'}\n` +
                    `👤 Pengirim: ${senderName} (+${senderJid.replace(/[^0-9]/g, '')})\n` +
                    `💬 Pesan: "${text}"\n` +
                    `🧠 Analisis: ${result.securityIncident.aiAnalysis}\n` +
                    `🎯 Tindakan: ${result.actionTaken === 'MESSAGE_DELETED' ? 'Otomatis Dihapus dari Grup' : 'Lapor Admin'}`;
                } else if (result.moderationLog) {
                  alertMsg = `⚖️ *SRJ GUARDIAN — PERINGATAN MODERASI*\n\n` +
                    `⚠️ Pelanggaran: *${result.moderationLog.ruleViolation}*\n` +
                    `👥 Grup: ${isGroup ? 'Grup WhatsApp' : 'Private'}\n` +
                    `👤 Pengirim: ${senderName} (+${senderJid.replace(/[^0-9]/g, '')})\n` +
                    `💬 Pesan: "${text}"\n` +
                    `🧠 Analisis: ${result.moderationLog.contextAnalysis}\n\n` +
                    `_Keputusan sanksi ada di tangan Admin (tinjau di dashboard SRJ Guardian)._`;
                } else if (result.helpReport) {
                  alertMsg = `🤝 *SRJ GUARDIAN — AI SOCIAL CARE*\n\n` +
                    `📌 Kategori: *${result.helpReport.category}* (Urgensi: ${result.helpReport.urgency})\n` +
                    `👥 Grup: ${isGroup ? 'Grup WhatsApp' : 'Private'}\n` +
                    `👤 Anggota: ${senderName} (+${senderJid.replace(/[^0-9]/g, '')})\n` +
                    `💬 Pesan: "${result.helpReport.excerpt}"\n` +
                    `📝 Rangkuman: ${result.helpReport.summary}\n\n` +
                    `_Segera japri anggota secara bersahabat sesuai prinsip Silih Asih & Silih Asuh._`;
                }

                if (alertMsg) {
                  await sock.sendMessage(`${adminPhone}@s.whatsapp.net`, { text: alertMsg }).catch(e => console.error('Gagal notif admin:', e.message));
                }
              }
            }
          } catch (apiErr) {
            console.error('[DAEMON] Gagal dispatch ke pipeline:', apiErr.message);
          }
      } catch (err) {
        console.error('[DAEMON] Error handleOneMessage:', err.message);
      }
    }

    // 1. Inbound Messages Listener (baik 'notify' pesan langsung maupun 'append' pesan offline)
    sock.ev.on('messages.upsert', async (m) => {
      try {
        const isBacklog = m.type === 'append';
        for (const msg of m.messages || []) {
          await handleOneMessage(msg, isBacklog);
        }
      } catch (err) {
        console.error('[DAEMON] Error message upsert handling:', err.message);
      }
    });

    // 2. Offline / Messaging History Sync Listener (saat baru tersambung kembali setelah offline/sleep)
    sock.ev.on('messaging-history.set', async ({ messages }) => {
      try {
        if (messages && messages.length > 0) {
          console.log(`[DAEMON-CATCHUP] 📥 Menerima sinkronisasi ${messages.length} pesan riwayat. Memindai pelanggaran yang masuk saat laptop offline/tidur...`);
          for (const msg of messages) {
            await handleOneMessage(msg, true);
          }
          console.log('[DAEMON-CATCHUP] ✅ Pemindaian pesan tertinggal pasca offline selesai!');
        }
      } catch (err) {
        console.error('[DAEMON-CATCHUP] Error processing history set:', err.message);
      }
    });

  } catch (fatalErr) {
    isInitializing = false;
    console.error('[DAEMON] Fatal worker error:', fatalErr.message);
  }
}

// IPC Command Poller (Checks .data/wa_command.json every 250ms)
setInterval(async () => {
  if (!fs.existsSync(CMD_FILE)) return;

  try {
    const raw = fs.readFileSync(CMD_FILE, 'utf-8');
    if (!raw.trim()) return;
    const cmd = JSON.parse(raw);

    // Delete command file immediately to prevent duplicate runs
    fs.unlinkSync(CMD_FILE);

    console.log(`[DAEMON-IPC] Memproses perintah: ${cmd.command} (ID: ${cmd.id})`);

    if (cmd.command === 'REQUEST_PAIRING_CODE') {
      let rawPhone = cmd.phoneNumber || '';
      let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      }

      if (!cleanPhone || cleanPhone.length < 8) {
        fs.writeFileSync(RESP_FILE, JSON.stringify({
          id: cmd.id,
          success: false,
          error: 'Format nomor telepon tidak valid. Gunakan format internasional (contoh: 6281234567890).'
        }, null, 2));
        return;
      }

      if (!currentSock) {
        fs.writeFileSync(RESP_FILE, JSON.stringify({
          id: cmd.id,
          success: false,
          error: 'Koneksi socket WhatsApp belum siap. Silakan coba kembali dalam 3 detik.'
        }, null, 2));
        return;
      }

      try {
        console.log(`[DAEMON-PAIRING] Meminta kode pairing 8 digit untuk: ${cleanPhone}...`);
        const rawCode = await currentSock.requestPairingCode(cleanPhone);
        
        // Format with hyphen: e.g. "ABCD-1234"
        const formattedCode = rawCode?.match(/.{1,4}/g)?.join('-') || rawCode;
        currentPairingCode = formattedCode;

        console.log(`[DAEMON-PAIRING] Kode pairing didapatkan dari WhatsApp: ${formattedCode}`);

        writeWaState({
          status: 'PAIRING',
          pairingCode: formattedCode,
          pairingPhoneNumber: '+' + cleanPhone
        });

        fs.writeFileSync(RESP_FILE, JSON.stringify({
          id: cmd.id,
          success: true,
          pairingCode: formattedCode
        }, null, 2));
      } catch (pairErr) {
        console.error('[DAEMON-PAIRING] Gagal mendapatkan kode pairing:', pairErr.message);
        fs.writeFileSync(RESP_FILE, JSON.stringify({
          id: cmd.id,
          success: false,
          error: pairErr.message || 'Gagal meminta kode pairing dari WhatsApp.'
        }, null, 2));
      }
    } else if (cmd.command === 'REFRESH_QR') {
      console.log('[DAEMON-IPC] Memulai ulang sesi untuk QR code segar...');
      if (currentSock) {
        try { currentSock.end(new Error('Refresh QR')); } catch (e) {}
      }
      setTimeout(() => startWhatsAppDaemon(true), 1000);
      fs.writeFileSync(RESP_FILE, JSON.stringify({ id: cmd.id, success: true }, null, 2));
    } else if (cmd.command === 'SYNC_GROUPS' || cmd.command === 'REFRESH_GROUPS') {
      console.log('[DAEMON-IPC] Memproses permintaan sinkronisasi paksa grup...');
      try {
        let count = 0;
        if (triggerSyncGroups) {
          count = await triggerSyncGroups(true);
        }
        const dbNow = readDb();
        const total = dbNow?.monitoredGroups?.length || count;
        console.log(`[DAEMON-IPC] Sinkronisasi selesai: ${total} grup terdaftar.`);
        fs.writeFileSync(RESP_FILE, JSON.stringify({
          id: cmd.id,
          success: true,
          groupsCount: total,
          message: `Berhasil menemukan dan menyinkronkan ${total} grup WhatsApp.`
        }, null, 2));
      } catch (syncErr) {
        console.error('[DAEMON-IPC] Gagal sinkronisasi grup:', syncErr.message);
        fs.writeFileSync(RESP_FILE, JSON.stringify({
          id: cmd.id,
          success: false,
          error: syncErr.message || 'Gagal sinkronisasi grup.'
        }, null, 2));
      }
    } else if (cmd.command === 'SEND_MESSAGE') {
      console.log(`[DAEMON-IPC] Mengirim pesan manual via socket ke ${cmd.to}...`);
      try {
        if (!currentSock) throw new Error('Socket WhatsApp belum terhubung');
        await currentSock.sendMessage(cmd.to, {
          text: cmd.text,
          mentions: cmd.mentions || []
        });
        fs.writeFileSync(RESP_FILE, JSON.stringify({ id: cmd.id, success: true }, null, 2));
        console.log(`[DAEMON-IPC] ✅ Berhasil kirim pesan manual ke ${cmd.to}`);
      } catch (err) {
        console.error(`[DAEMON-IPC] Gagal kirim pesan manual:`, err.message);
        fs.writeFileSync(RESP_FILE, JSON.stringify({ id: cmd.id, success: false, error: err.message }, null, 2));
      }
    } else if (cmd.command === 'DISCONNECT') {
      console.log('[DAEMON-IPC] Memutuskan sesi WhatsApp...');
      if (currentSock) {
        try { await currentSock.logout(); } catch (e) {}
      }
      if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
      }
      writeWaState({
        status: 'DISCONNECTED',
        phoneNumber: null,
        qrCodeDataUrl: null,
        pairingCode: null
      });
      updateDb((db) => {
        db.whatsappConnection.status = 'DISCONNECTED';
        db.whatsappConnection.phoneNumber = null;
        db.whatsappConnection.qrCodeData = null;
        db.whatsappConnection.coAdminVerified = false;
        db.monitoredGroups = []; // Bersihkan riwayat grup lama agar tidak campur aduk ke nomor lain
      });
      fs.writeFileSync(RESP_FILE, JSON.stringify({ id: cmd.id, success: true }, null, 2));
    }
  } catch (ipcErr) {
    console.error('[DAEMON-IPC] Error:', ipcErr.message);
  }
}, 250);

// Initial state setup
writeWaState({ status: 'PAIRING' });

// Start Daemon
const currentDb = readDb();
const shouldFresh = !currentDb?.whatsappConnection?.phoneNumber;
startWhatsAppDaemon(shouldFresh);
