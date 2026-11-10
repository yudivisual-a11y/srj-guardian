const { spawn } = require('child_process');

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
