import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { baileysManager } from '@/lib/baileys-manager';

export async function GET() {
  const liveState = baileysManager.getState();
  const dbConn = db.getWhatsAppConnection();

  return NextResponse.json({
    success: true,
    data: {
      status: liveState.status,
      phoneNumber: liveState.phoneNumber,
      maskedPhoneNumber: liveState.maskedPhoneNumber,
      customAlias: liveState.customAlias || dbConn.instanceName,
      qrCodeDataUrl: liveState.qrCodeDataUrl,
      pairingCode: liveState.pairingCode,
      instanceName: dbConn.instanceName,
      coAdminVerified: dbConn.coAdminVerified,
      lastConnectedAt: liveState.lastConnectedAt || dbConn.lastConnectedAt
    }
  });
}

export async function POST(req: Request) {
  try {
    const { action, phoneNumber } = await req.json();

    if (action === 'START_PAIRING') {
      db.updateWhatsAppConnection({ status: 'PAIRING' });
      const result = await baileysManager.startPairing();
      return NextResponse.json({
        success: true,
        message: 'Mode pairing QR aktif.',
        data: result
      });
    }

    if (action === 'REQUEST_PAIRING_CODE') {
      if (!phoneNumber || phoneNumber.trim().length < 8) {
        return NextResponse.json({ error: 'Masukkan nomor WhatsApp bot yang valid (contoh: +6281234567890).' }, { status: 400 });
      }

      console.log(`[API-WA] Requesting Pairing Code for: ${phoneNumber}`);
      const code = await baileysManager.requestPairingCode(phoneNumber);

      return NextResponse.json({
        success: true,
        message: 'Kode pairing WhatsApp berhasil didapatkan.',
        data: { pairingCode: code }
      });
    }

    if (action === 'CONFIRM_PAIRING') {
      if (!phoneNumber) {
        return NextResponse.json({ error: 'Nomor WhatsApp wajib diisi.' }, { status: 400 });
      }
      db.updateWhatsAppConnection({
        status: 'CONNECTED',
        phoneNumber,
        qrCodeData: null,
        lastConnectedAt: new Date().toISOString(),
        coAdminVerified: true
      });

      return NextResponse.json({
        success: true,
        message: 'Nomor WhatsApp bot berhasil dikonfirmasi.'
      });
    }

    return NextResponse.json({ error: 'Action tidak valid.' }, { status: 400 });
  } catch (error: any) {
    console.error('[API-WA] Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses permintaan pairing.' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await baileysManager.disconnect();
    db.updateWhatsAppConnection({
      status: 'DISCONNECTED',
      phoneNumber: null,
      qrCodeData: null,
      coAdminVerified: false
    });

    return NextResponse.json({
      success: true,
      message: 'Sesi WhatsApp bot telah diputuskan.'
    });
  } catch (error: any) {
    console.error('[API-WA-DELETE] Error:', error);
    return NextResponse.json({ error: 'Gagal memutuskan sesi WhatsApp.' }, { status: 500 });
  }
}
