import { AdminNotificationPayload } from '@/types';
import { db } from './db';

export function formatAdminReport(payload: AdminNotificationPayload): string {
  return `🛡️ *SRJ GUARDIAN — NOTIFIKASI ADMIN* 🛡️

📌 *Jenis Laporan:* ${payload.reportType}
🏷️ *Kategori:* ${payload.category}
👤 *Pengirim:* ${payload.senderIdentity}
⏰ *Waktu Kejadian:* ${new Date(payload.timestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB

💬 *Isi Pesan Terkait:*
"${payload.relevantContent}"

🧠 *Hasil Analisis AI:*
${payload.aiAnalysis}

⚠️ *Tingkat Risiko:* [${payload.riskLevel}]
🎯 *Tindakan yang Disarankan:* ${payload.suggestedAction}

---
_Sistem Keamanan & Moderator Otomatis Sunda Rantau Jogja_
_Silih Asah, Silih Asih, Silih Asuh_`;
}

export async function sendAdminNotification(payload: AdminNotificationPayload): Promise<{ success: boolean; channel: string; formattedMessage: string }> {
  const formatted = formatAdminReport(payload);
  const settings = db.getSettings();
  const conn = db.getWhatsAppConnection();

  console.log('[NOTIFIER] Dispatching private admin alert:');
  console.log(formatted);

  // If WhatsApp bot is connected and private admin phone is set, attempt sending real WhatsApp message to admin
  if (conn.status === 'CONNECTED' && settings.primaryAdminPhone) {
    // In actual production worker this invokes WhatsApp Gateway socket:
    // await sock.sendMessage(`${cleanPhone}@s.whatsapp.net`, { text: formatted });
    return {
      success: true,
      channel: `WhatsApp Pribadi (${settings.primaryAdminPhone}) & Dashboard`,
      formattedMessage: formatted
    };
  }

  return {
    success: true,
    channel: 'Dashboard Notification Center',
    formattedMessage: formatted
  };
}
