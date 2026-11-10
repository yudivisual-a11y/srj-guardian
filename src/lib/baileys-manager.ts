import path from 'path';
import fs from 'fs';
import { db } from './db';

const DATA_DIR = path.join(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'wa_state.json');
const CMD_FILE = path.join(DATA_DIR, 'wa_command.json');
const RESP_FILE = path.join(DATA_DIR, 'wa_response.json');
const QR_FILE = path.join(DATA_DIR, 'current_qr.txt');

export interface LiveWhatsAppState {
  status: 'DISCONNECTED' | 'PAIRING' | 'CONNECTED' | 'ERROR';
  phoneNumber: string | null;
  maskedPhoneNumber: string | null;
  customAlias: string;
  qrCodeDataUrl: string | null;
  pairingCode: string | null;
  lastConnectedAt: string | null;
  errorMessage?: string;
  discoveredGroupsCount: number;
}

class BaileysManager {
  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private maskPhone(phone: string | null): string | null {
    if (!phone || phone.length < 8) return null;
    const clean = phone.replace(/[^0-9]/g, '');
    const prefix = clean.slice(0, 4);
    const suffix = clean.slice(-3);
    return `+${prefix} ••••-••${suffix} [PRIVASI DILINDUNGI]`;
  }

  public getState(): LiveWhatsAppState {
    this.ensureDataDir();
    const dbConn = db.getWhatsAppConnection();
    let stateFromFile: any = {};

    if (fs.existsSync(STATE_FILE)) {
      try {
        stateFromFile = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      } catch (e) {
        // fallback
      }
    }

    let liveQr: string | null = stateFromFile.qrCodeDataUrl || null;
    if (!liveQr && fs.existsSync(QR_FILE)) {
      try {
        liveQr = fs.readFileSync(QR_FILE, 'utf-8');
      } catch (e) {}
    }

    const phone = stateFromFile.phoneNumber || dbConn.phoneNumber || null;
    const isConnected = stateFromFile.status === 'CONNECTED' || dbConn.status === 'CONNECTED';
    const isPairing = !isConnected && (stateFromFile.status === 'PAIRING' || Boolean(liveQr) || Boolean(stateFromFile.pairingCode));

    const status: LiveWhatsAppState['status'] = isConnected 
      ? 'CONNECTED' 
      : (isPairing ? 'PAIRING' : 'DISCONNECTED');

    return {
      status,
      phoneNumber: phone,
      maskedPhoneNumber: this.maskPhone(phone),
      customAlias: dbConn.instanceName || 'SRJ GUARDIAN (Official Bot)',
      qrCodeDataUrl: isConnected ? null : (liveQr || dbConn.qrCodeData),
      pairingCode: isConnected ? null : (stateFromFile.pairingCode || null),
      lastConnectedAt: stateFromFile.lastConnectedAt || dbConn.lastConnectedAt || null,
      discoveredGroupsCount: db.getMonitoredGroups().length
    };
  }

  public async requestPairingCode(phoneNumber: string): Promise<string> {
    this.ensureDataDir();
    const cmdId = `cmd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Remove any stale response file
    if (fs.existsSync(RESP_FILE)) {
      try { fs.unlinkSync(RESP_FILE); } catch (e) {}
    }

    // Write command for daemon to process
    const commandPayload = {
      id: cmdId,
      command: 'REQUEST_PAIRING_CODE',
      phoneNumber,
      timestamp: Date.now()
    };
    fs.writeFileSync(CMD_FILE, JSON.stringify(commandPayload, null, 2), 'utf-8');

    // Wait for response from daemon (poll up to 10 seconds)
    const startTime = Date.now();
    while (Date.now() - startTime < 10000) {
      await new Promise(r => setTimeout(r, 200));

      if (fs.existsSync(RESP_FILE)) {
        try {
          const resp = JSON.parse(fs.readFileSync(RESP_FILE, 'utf-8'));
          if (resp.id === cmdId) {
            fs.unlinkSync(RESP_FILE);
            if (resp.success && resp.pairingCode) {
              return resp.pairingCode;
            } else {
              throw new Error(resp.error || 'Gagal meminta kode pairing dari WhatsApp.');
            }
          }
        } catch (readErr: any) {
          if (readErr.message.includes('Gagal meminta')) throw readErr;
        }
      }
    }

    throw new Error('Timeout: Daemon WhatsApp tidak merespons dalam 10 detik. Pastikan worker aktif.');
  }

  public async startPairing(): Promise<{ pairingMethod: string }> {
    this.ensureDataDir();
    const cmdId = `cmd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const commandPayload = {
      id: cmdId,
      command: 'REFRESH_QR',
      timestamp: Date.now()
    };
    fs.writeFileSync(CMD_FILE, JSON.stringify(commandPayload, null, 2), 'utf-8');

    return { pairingMethod: 'QR' };
  }

  public async disconnect(): Promise<void> {
    this.ensureDataDir();
    const cmdId = `cmd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const commandPayload = {
      id: cmdId,
      command: 'DISCONNECT',
      timestamp: Date.now()
    };
    fs.writeFileSync(CMD_FILE, JSON.stringify(commandPayload, null, 2), 'utf-8');
    
    // Clear state files
    if (fs.existsSync(STATE_FILE)) {
      try {
        fs.writeFileSync(STATE_FILE, JSON.stringify({ status: 'DISCONNECTED', phoneNumber: null, qrCodeDataUrl: null, pairingCode: null }, null, 2));
      } catch (e) {}
    }
    if (fs.existsSync(QR_FILE)) {
      try { fs.unlinkSync(QR_FILE); } catch (e) {}
    }
  }
}

export const baileysManager = new BaileysManager();
