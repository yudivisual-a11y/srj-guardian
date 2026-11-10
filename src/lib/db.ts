import fs from 'fs';
import path from 'path';
import { 
  SecurityIncident, 
  ModerationLog, 
  HelpReport, 
  UrlScanResult, 
  WhatsAppConnection, 
  MonitoredGroup, 
  SystemSettings,
  AdminUser 
} from '@/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'srj_guardian_db.json');

export interface DatabaseState {
  admins: AdminUser[];
  whatsappConnection: WhatsAppConnection;
  monitoredGroups: MonitoredGroup[];
  securityIncidents: SecurityIncident[];
  moderationLogs: ModerationLog[];
  helpReports: HelpReport[];
  urlScans: UrlScanResult[];
  settings: SystemSettings;
}

// Clean, authentic initial state with ZERO mock/fake records
const cleanInitialDatabase: DatabaseState = {
  admins: [
    {
      id: 'adm-primary',
      email: 'admin@sundarantaujogja.id',
      name: 'Admin Utama SRJ',
      phoneNumber: '',
      role: 'SUPER_ADMIN',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }
  ],
  whatsappConnection: {
    id: 'conn-primary',
    instanceName: 'SRJ_GUARDIAN_PROD',
    phoneNumber: null,
    botName: 'SRJ GUARDIAN',
    status: 'DISCONNECTED',
    qrCodeData: null,
    lastConnectedAt: null,
    coAdminVerified: false,
    updatedAt: new Date().toISOString(),
  },
  monitoredGroups: [],
  securityIncidents: [],
  moderationLogs: [],
  helpReports: [],
  urlScans: [],
  settings: {
    aiSensitivity: 'balanced',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    safeBrowsingApiKey: process.env.SAFE_BROWSING_API_KEY || '',
    primaryAdminPhone: process.env.PRIMARY_ADMIN_PHONE || '',
    autoDeleteDangerous: true,
    privateNotifyAdmin: true,
    enableImageScan: true,
    enableVideoScan: true,
  }
};

class DatabaseManager {
  private state: DatabaseState;

  constructor() {
    this.ensureDataDir();
    this.state = this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public load(): DatabaseState {
    try {
      this.ensureDataDir();
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.error('[DB] Failed reading db file:', err);
    }
    this.save(cleanInitialDatabase);
    return cleanInitialDatabase;
  }

  public resetToClean(): DatabaseState {
    this.save(cleanInitialDatabase);
    this.state = cleanInitialDatabase;
    return this.state;
  }

  private save(data: DatabaseState) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed saving db file:', err);
    }
  }

  public getState(): DatabaseState {
    this.state = this.load();
    return this.state;
  }

  // Security Incidents
  public getSecurityIncidents(): SecurityIncident[] {
    this.state = this.load();
    return this.state.securityIncidents || [];
  }

  public addSecurityIncident(incident: SecurityIncident): SecurityIncident {
    this.state = this.load();
    if (!this.state.securityIncidents) this.state.securityIncidents = [];
    this.state.securityIncidents.unshift(incident);
    this.save(this.state);
    return incident;
  }

  public updateSecurityIncidentStatus(id: string, status: SecurityIncident['adminStatus']): boolean {
    this.state = this.load();
    const item = this.state.securityIncidents.find(i => i.id === id);
    if (item) {
      item.adminStatus = status;
      this.save(this.state);
      return true;
    }
    return false;
  }

  // Moderation Logs
  public getModerationLogs(): ModerationLog[] {
    this.state = this.load();
    return this.state.moderationLogs || [];
  }

  public addModerationLog(log: ModerationLog): ModerationLog {
    this.state = this.load();
    if (!this.state.moderationLogs) this.state.moderationLogs = [];
    this.state.moderationLogs.unshift(log);
    this.save(this.state);
    return log;
  }

  public updateModerationDecision(id: string, decision: ModerationLog['adminDecision'], reviewedBy: string): boolean {
    this.state = this.load();
    const item = this.state.moderationLogs.find(m => m.id === id);
    if (item) {
      item.adminDecision = decision;
      item.reviewedBy = reviewedBy;
      this.save(this.state);
      return true;
    }
    return false;
  }

  // Help Reports (Social Care)
  public getHelpReports(): HelpReport[] {
    this.state = this.load();
    return this.state.helpReports || [];
  }

  public addHelpReport(report: HelpReport): HelpReport {
    this.state = this.load();
    if (!this.state.helpReports) this.state.helpReports = [];
    this.state.helpReports.unshift(report);
    this.save(this.state);
    return report;
  }

  public updateHelpReport(id: string, status: HelpReport['status'], notes?: string, assignedAdmin?: string): boolean {
    this.state = this.load();
    const item = this.state.helpReports.find(h => h.id === id);
    if (item) {
      item.status = status;
      if (notes !== undefined) item.adminNotes = notes;
      if (assignedAdmin !== undefined) item.assignedAdmin = assignedAdmin;
      this.save(this.state);
      return true;
    }
    return false;
  }

  // URL Scans
  public getUrlScans(): UrlScanResult[] {
    this.state = this.load();
    return this.state.urlScans || [];
  }

  public addUrlScan(scan: UrlScanResult): UrlScanResult {
    this.state = this.load();
    if (!this.state.urlScans) this.state.urlScans = [];
    this.state.urlScans.unshift(scan);
    this.save(this.state);
    return scan;
  }

  // WhatsApp Connection
  public getWhatsAppConnection(): WhatsAppConnection {
    this.state = this.load();
    return this.state.whatsappConnection;
  }

  public updateWhatsAppConnection(update: Partial<WhatsAppConnection>): WhatsAppConnection {
    this.state = this.load();
    this.state.whatsappConnection = {
      ...this.state.whatsappConnection,
      ...update,
      updatedAt: new Date().toISOString()
    };
    this.save(this.state);
    return this.state.whatsappConnection;
  }

  // Monitored Groups
  public getMonitoredGroups(): MonitoredGroup[] {
    this.state = this.load();
    return this.state.monitoredGroups || [];
  }

  public toggleGroupActive(groupId: string): boolean {
    this.state = this.load();
    const group = this.state.monitoredGroups.find(g => g.id === groupId);
    if (group) {
      group.isActive = !group.isActive;
      this.save(this.state);
      return true;
    }
    return false;
  }

  public addMonitoredGroup(group: MonitoredGroup): MonitoredGroup {
    this.state = this.load();
    if (!this.state.monitoredGroups) this.state.monitoredGroups = [];
    this.state.monitoredGroups.push(group);
    this.save(this.state);
    return group;
  }

  // Settings
  public getSettings(): SystemSettings {
    this.state = this.load();
    return this.state.settings;
  }

  public updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.state = this.load();
    this.state.settings = { ...this.state.settings, ...settings };
    this.save(this.state);
    return this.state.settings;
  }
}

export const db = new DatabaseManager();
