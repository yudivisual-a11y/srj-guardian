export type ThreatStatus = 'AMAN' | 'MENCURIGAKAN' | 'BERBAHAYA';

export type ThreatType = 
  | 'PHISHING' 
  | 'MALWARE' 
  | 'SCAM' 
  | 'INAPPROPRIATE_MEDIA' 
  | 'SUSPICIOUS_LINK' 
  | 'SPAM' 
  | 'CREDENTIAL_THEFT';

export type RuleViolationType = 
  | 'FLEXING' 
  | 'INSULT' 
  | 'PROVOCATION' 
  | 'BULLYING' 
  | 'SPAM_PROMO' 
  | 'SILIH_ASIH_BREACH' 
  | 'HOAX'
  | 'INAPPROPRIATE_BEHAVIOR'
  | 'JUDI_ONLINE';

export type SocialCareCategory = 
  | 'PEKERJAAN' 
  | 'BANTUAN_SOSIAL' 
  | 'KESEHATAN_DARURAT' 
  | 'TEMPAT_TINGGAL' 
  | 'INFORMASI_LAIN';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type WhatsAppStatus = 'CONNECTED' | 'DISCONNECTED' | 'PAIRING' | 'ERROR';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: 'SUPER_ADMIN' | 'MODERATOR_ADMIN' | 'SOCIAL_CARE_VOLUNTEER';
  createdAt: string;
  lastLogin?: string;
}

export interface WhatsAppConnection {
  id: string;
  instanceName: string;
  phoneNumber: string | null;
  botName: string;
  status: WhatsAppStatus;
  qrCodeData: string | null;
  lastConnectedAt: string | null;
  coAdminVerified: boolean;
  webhookSecret?: string;
  updatedAt: string;
}

export interface MonitoredGroup {
  id: string;
  groupJid: string;
  groupName: string;
  isActive: boolean;
  autoScanUrls: boolean;
  autoModContent: boolean;
  socialCareEnabled: boolean;
  autoDeleteThreats: boolean;
  rulesSummary: string;
  createdAt: string;
}

export interface SecurityIncident {
  id: string;
  timestamp: string;
  groupJid: string;
  groupName: string;
  senderJid: string;
  senderName: string;
  messageId: string;
  threatType: ThreatType;
  riskLevel: ThreatStatus;
  rawContent: string;
  mediaUrl?: string;
  aiAnalysis: string;
  actionTaken: 'NONE' | 'REPORTED_ADMIN' | 'MESSAGE_DELETED' | 'PENDING_ADMIN_DECISION';
  adminStatus: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_POSITIVE';
  detectedUrls?: string[];
}

export interface ModerationLog {
  id: string;
  timestamp: string;
  groupJid: string;
  groupName: string;
  senderJid: string;
  senderName: string;
  messageId: string;
  ruleViolation: RuleViolationType;
  confidenceScore: number;
  contextAnalysis: string;
  rawContent: string;
  adminDecision: 'PENDING' | 'NO_ACTION' | 'WARNED_PRIVATELY' | 'SANCTIONED' | 'DISMISSED';
  reviewedBy?: string;
}

export interface HelpReport {
  id: string;
  timestamp: string;
  groupJid: string;
  groupName: string;
  senderJid: string;
  senderName: string;
  messageId: string;
  category: SocialCareCategory;
  urgency: UrgencyLevel;
  summary: string;
  excerpt: string;
  rawMessage: string;
  adminNotes?: string;
  status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'RESOLVED';
  assignedAdmin?: string;
}

export interface UrlScanResult {
  id: string;
  timestamp: string;
  url: string;
  normalizedUrl: string;
  domain: string;
  threatStatus: ThreatStatus;
  riskScore: number; // 0 - 100
  redirectChain: string[];
  threatReasons: string[];
  vendorResults: {
    googleSafeBrowsing?: { status: string; matches?: string[] };
    virusTotal?: { positives: number; total: number };
    ssrfProtection?: { checked: boolean; isPrivateOrLocal: boolean };
    heuristicAnalyzer?: { flags: string[]; calculatedScore: number };
  };
  ipAddress?: string;
  ssrfSafe: boolean;
}

export interface SystemSettings {
  aiSensitivity: 'low' | 'balanced' | 'strict';
  geminiApiKey: string;
  safeBrowsingApiKey: string;
  primaryAdminPhone: string;
  autoDeleteDangerous: boolean;
  privateNotifyAdmin: boolean;
  enableImageScan: boolean;
  enableVideoScan: boolean;
}

export interface AdminNotificationPayload {
  reportType: 'KEAMANAN' | 'MODERASI' | 'KEPEDULIAN_SOSIAL';
  category: string;
  senderIdentity: string;
  timestamp: string;
  relevantContent: string;
  aiAnalysis: string;
  riskLevel: 'AMAN' | 'PERLU_DIPERIKSA' | 'BERBAHAYA' | 'KRITIS';
  suggestedAction: string;
}



