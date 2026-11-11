const { spawn } = require('child_process');
const fs = require('fs');

// macOS Caffeinate Keepawake: jaga sistem tetap aktif saat layar padam
if (process.platform === 'darwin') {
  try {
    if (fs.existsSync('/usr/bin/caffeinate')) {
      const caf = spawn('/usr/bin/caffeinate', ['-i', '-s', '-m', '-w', String(process.pid)], {
        detached: true,
        stdio: 'ignore'
      });
      caf.unref();
      console.log('[RUNNER-POWER] ☕ macOS Caffeinate aktif! Sistem terlindungi dari sleep saat layar padam.');
    }
  } catch (e) {}
}

console.log('====================================================');
console.log('  SRJ GUARDIAN — 24/7 CLOUD PRODUCTION RUNNER       ');
console.log('  Memulai Web Dashboard + WhatsApp Baileys Daemon   ');
console.log('====================================================');

const port = process.env.PORT || 3000;

// 1. Jalankan Next.js Web Dashboard
const nextProcess = spawn('npx', ['next', 'start', '-p', String(port)], {
  stdio: 'inherit',
  env: process.env
});

nextProcess.on('exit', (code) => {
  console.error(`[RUNNER] Next.js keluar dengan kode ${code}`);
  process.exit(code || 1);
});

// 2. Jalankan WhatsApp Background Daemon (dengan auto-restart jika putus)
function startDaemon() {
  console.log('[RUNNER] Memulai WhatsApp Daemon Worker...');
  const daemonProcess = spawn('node', ['scripts/daemon.js'], {
    stdio: 'inherit',
    env: process.env
  });

  daemonProcess.on('exit', (code) => {
    console.warn(`[RUNNER] WhatsApp Daemon terhenti (kode: ${code}). Memulai ulang dalam 4 detik...`);
    setTimeout(startDaemon, 4000);
  });
}

// Berikan jeda 2 detik agar Next.js siap terlebih dahulu sebelum daemon melakukan fetch
setTimeout(startDaemon, 2000);

// 3. Self-Keepalive (Mencegah Free Tier Cloud seperti Render tertidur / sleep)
const selfUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
if (selfUrl) {
  console.log(`[RUNNER] Keepalive aktif untuk URL: ${selfUrl}`);
  setInterval(() => {
    try {
      const client = selfUrl.startsWith('https') ? require('https') : require('http');
      client.get(`${selfUrl}/api/health`, (res) => {
        // Discard data
        res.on('data', () => {});
      }).on('error', (err) => {
        // Abaikan error ping
      });
    } catch (e) {}
  }, 4 * 60 * 1000); // Ping setiap 4 menit
}

