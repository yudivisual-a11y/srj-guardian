import { NextResponse } from 'next/server';
import { processIncomingMessage } from '@/lib/pipeline';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.text && !body.mediaBase64) {
      return NextResponse.json(
        { error: 'Pesan wajib memiliki konten teks atau berkas media.' },
        { status: 400 }
      );
    }

    const result = await processIncomingMessage({
      groupJid: body.groupJid || '1203630491827361@g.us',
      groupName: body.groupName || 'SUNDA RANTAU JOGJA (OFFICIAL PUSAT)',
      senderJid: body.senderJid || '628123456789@s.whatsapp.net',
      senderName: body.senderName || 'Warga Rantau',
      messageId: body.messageId || `MSG-${Date.now()}`,
      text: body.text || '',
      mediaBase64: body.mediaBase64,
      mediaMimeType: body.mediaMimeType
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[API] /api/pipeline/ingest error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memproses pesan di pipeline SRJ Guardian.' },
      { status: 500 }
    );
  }
}
