import { NextResponse } from 'next/server';
import { WhatsAppGateway } from '@/lib/whatsapp-service';

// Meta Webhook Verification Endpoint (Hub Challenge)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const EXPECTED_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'srj_guardian_verify_token_2026';

  if (mode === 'subscribe' && token === EXPECTED_VERIFY_TOKEN) {
    console.log('[WEBHOOK] Meta Webhook challenge verified successfully.');
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verifikasi Webhook Meta gagal. Token tidak cocok.' }, { status: 403 });
}

// Inbound WhatsApp Webhook payload handler
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Standard Meta WhatsApp Cloud API format parser
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];
      const contact = value?.contacts?.[0];

      if (message) {
        const text = message.text?.body || message.caption || '';
        const senderJid = `${message.from}@s.whatsapp.net`;
        const senderName = contact?.profile?.name || message.from;
        const messageId = message.id;

        // Note: For cloud API, group messages may come if in authorized beta group
        const groupJid = message.group_id ? `${message.group_id}@g.us` : '1203630491827361@g.us';

        await WhatsAppGateway.handleIncomingGroupMessage({
          groupJid,
          groupName: 'SUNDA RANTAU JOGJA',
          senderJid,
          senderName,
          messageId,
          text
        });

        return NextResponse.json({ status: 'EVENT_RECEIVED' });
      }
    }

    // Direct multi-device worker forward format
    if (body.event === 'messages.upsert' && body.data) {
      await WhatsAppGateway.handleIncomingGroupMessage(body.data);
      return NextResponse.json({ status: 'PROCESSED' });
    }

    return NextResponse.json({ status: 'IGNORED_NON_MESSAGE' });
  } catch (error: any) {
    console.error('[WEBHOOK] Inbound error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
