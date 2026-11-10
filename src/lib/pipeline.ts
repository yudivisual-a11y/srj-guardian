import { extractUrls, scanUrl } from './url-scanner';
import { analyzeContentWithGemini } from './ai-engine';
import { sendAdminNotification } from './notifier';
import { db } from './db';
import { 
  SecurityIncident, 
  ModerationLog, 
  HelpReport, 
  UrlScanResult 
} from '@/types';

export interface IngestMessageParams {
  groupJid: string;
  groupName: string;
  senderJid: string;
  senderName: string;
  messageId: string;
  text: string;
  mediaBase64?: string;
  mediaMimeType?: string;
}

export interface PipelineResult {
  messageId: string;
  processedUrls: UrlScanResult[];
  securityIncident?: SecurityIncident;
  moderationLog?: ModerationLog;
  helpReport?: HelpReport;
  actionTaken: 'NONE' | 'REPORTED_ADMIN' | 'MESSAGE_DELETED';
  summary: string;
}

export async function processIncomingMessage(params: IngestMessageParams): Promise<PipelineResult> {
  const settings = db.getSettings();
  const urls = extractUrls(params.text);
  const scannedUrls: UrlScanResult[] = [];

  // Step 1: Automatic URL Security Scanning
  let hasDangerousUrl = false;
  let hasSuspiciousUrl = false;
  let highestThreatUrl: UrlScanResult | null = null;

  for (const url of urls) {
    const scanResult = await scanUrl(url, settings.safeBrowsingApiKey);
    scannedUrls.push(scanResult);
    db.addUrlScan(scanResult);

    if (scanResult.threatStatus === 'BERBAHAYA') {
      hasDangerousUrl = true;
      highestThreatUrl = scanResult;
    } else if (scanResult.threatStatus === 'MENCURIGAKAN' && !highestThreatUrl) {
      hasSuspiciousUrl = true;
      highestThreatUrl = scanResult;
    }
  }

  // Step 2: AI Multi-Modal Content & Context Moderation
  const aiResult = await analyzeContentWithGemini(
    params.text,
    params.mediaBase64,
    params.mediaMimeType,
    settings.geminiApiKey
  );

  let actionTaken: 'NONE' | 'REPORTED_ADMIN' | 'MESSAGE_DELETED' = 'NONE';
  let createdSecurityIncident: SecurityIncident | undefined;
  let createdModerationLog: ModerationLog | undefined;
  let createdHelpReport: HelpReport | undefined;

  // Step 3: Handle Security Threats (Level 3 or Level 2)
  if (hasDangerousUrl || aiResult.isSecurityThreat) {
    const isDangerous = hasDangerousUrl || aiResult.securityRiskLevel === 'BERBAHAYA';
    actionTaken = 'MESSAGE_DELETED';

    createdSecurityIncident = {
      id: `sec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      groupJid: params.groupJid,
      groupName: params.groupName,
      senderJid: params.senderJid,
      senderName: params.senderName,
      messageId: params.messageId,
      threatType: highestThreatUrl ? (highestThreatUrl.threatReasons.some(r => r.includes('APK')) ? 'MALWARE' : 'PHISHING') : (aiResult.securityThreatType || 'SCAM'),
      riskLevel: isDangerous ? 'BERBAHAYA' : 'MENCURIGAKAN',
      rawContent: params.text,
      aiAnalysis: aiResult.securityAnalysis || (highestThreatUrl ? highestThreatUrl.threatReasons.join('; ') : 'Terdeteksi ancaman siber.'),
      actionTaken,
      adminStatus: 'PENDING',
      detectedUrls: urls
    };
    db.addSecurityIncident(createdSecurityIncident);

    // Dispatch Private Admin Notification
    if (settings.privateNotifyAdmin) {
      await sendAdminNotification({
        reportType: 'KEAMANAN',
        category: createdSecurityIncident.threatType,
        senderIdentity: `${params.senderName} (${params.senderJid})`,
        timestamp: createdSecurityIncident.timestamp,
        relevantContent: params.text,
        aiAnalysis: createdSecurityIncident.aiAnalysis,
        riskLevel: isDangerous ? 'BERBAHAYA' : 'PERLU_DIPERIKSA',
        suggestedAction: isDangerous ? 'Pesan otomatis dihapus. Tinjau akun pengirim jika terindikasi nomor bajakan.' : 'Periksa keabsahan tautan sebelum memutuskan sanksi.'
      });
    }
  }

  // Step 4: Handle Social Care (AI Social Care Pipeline)
  if (aiResult.isSocialCareNeeded) {
    createdHelpReport = {
      id: `help-${Date.now()}`,
      timestamp: new Date().toISOString(),
      groupJid: params.groupJid,
      groupName: params.groupName,
      senderJid: params.senderJid,
      senderName: params.senderName,
      messageId: params.messageId,
      category: aiResult.socialCareCategory || 'INFORMASI_LAIN',
      urgency: aiResult.socialCareUrgency || 'MEDIUM',
      summary: aiResult.socialCareSummary || 'Anggota membutuhkan bantuan di perantauan.',
      excerpt: aiResult.socialCareExcerpt || params.text,
      rawMessage: params.text,
      status: 'NEW'
    };
    db.addHelpReport(createdHelpReport);

    if (settings.privateNotifyAdmin) {
      await sendAdminNotification({
        reportType: 'KEPEDULIAN_SOSIAL',
        category: createdHelpReport.category,
        senderIdentity: `${params.senderName} (${params.senderJid})`,
        timestamp: createdHelpReport.timestamp,
        relevantContent: params.text,
        aiAnalysis: `[${createdHelpReport.urgency}] ${createdHelpReport.summary}`,
        riskLevel: createdHelpReport.urgency === 'CRITICAL' ? 'KRITIS' : 'PERLU_DIPERIKSA',
        suggestedAction: 'Hubungi anggota secara pribadi (japri) dengan empati sesuai prinsip Silih Asah, Silih Asih, Silih Asuh.'
      });
    }
  }

  // Step 5: Handle Moderation Violation
  if (aiResult.isRuleViolation) {
    actionTaken = 'MESSAGE_DELETED';
    createdModerationLog = {
      id: `mod-${Date.now()}`,
      timestamp: new Date().toISOString(),
      groupJid: params.groupJid,
      groupName: params.groupName,
      senderJid: params.senderJid,
      senderName: params.senderName,
      messageId: params.messageId,
      ruleViolation: aiResult.ruleViolationType || 'FLEXING',
      confidenceScore: aiResult.moderationConfidence || 0.8,
      contextAnalysis: aiResult.moderationAnalysis || 'Terindikasi pelanggaran aturan komunitas.',
      rawContent: params.text,
      adminDecision: 'PENDING'
    };
    db.addModerationLog(createdModerationLog);

    if (settings.privateNotifyAdmin) {
      await sendAdminNotification({
        reportType: 'MODERASI',
        category: createdModerationLog.ruleViolation,
        senderIdentity: `${params.senderName} (${params.senderJid})`,
        timestamp: createdModerationLog.timestamp,
        relevantContent: params.text,
        aiAnalysis: createdModerationLog.contextAnalysis,
        riskLevel: 'PERLU_DIPERIKSA',
        suggestedAction: 'Jangan permalukan di grup. Jika perlu, berikan teguran halus via jalur pribadi admin.'
      });
    }
  }

  let summary = 'Pesan telah diproses oleh SRJ Guardian Pipeline.';
  if (createdSecurityIncident) summary = `Keamanan: ${createdSecurityIncident.threatType} (${createdSecurityIncident.riskLevel})`;
  else if (createdHelpReport) summary = `Social Care: ${createdHelpReport.category} (${createdHelpReport.urgency})`;
  else if (createdModerationLog) summary = `Moderasi: ${createdModerationLog.ruleViolation}`;

  return {
    messageId: params.messageId,
    processedUrls: scannedUrls,
    securityIncident: createdSecurityIncident,
    moderationLog: createdModerationLog,
    helpReport: createdHelpReport,
    actionTaken,
    summary
  };
}
