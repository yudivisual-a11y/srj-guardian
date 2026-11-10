import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const settings = db.getSettings();
  // Mask sensitive API keys partially
  const masked = {
    ...settings,
    geminiApiKeyMasked: settings.geminiApiKey ? `${settings.geminiApiKey.slice(0, 6)}...${settings.geminiApiKey.slice(-4)}` : 'Belum Dikonfigurasi',
    safeBrowsingApiKeyMasked: settings.safeBrowsingApiKey ? `${settings.safeBrowsingApiKey.slice(0, 6)}...${settings.safeBrowsingApiKey.slice(-4)}` : 'Belum Dikonfigurasi'
  };

  return NextResponse.json({
    success: true,
    data: masked
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updatePayload: Record<string, any> = {};

    if (body.aiSensitivity) updatePayload.aiSensitivity = body.aiSensitivity;
    if (body.geminiApiKey !== undefined) updatePayload.geminiApiKey = body.geminiApiKey;
    if (body.safeBrowsingApiKey !== undefined) updatePayload.safeBrowsingApiKey = body.safeBrowsingApiKey;
    if (body.primaryAdminPhone !== undefined) updatePayload.primaryAdminPhone = body.primaryAdminPhone;
    if (body.autoDeleteDangerous !== undefined) updatePayload.autoDeleteDangerous = Boolean(body.autoDeleteDangerous);
    if (body.privateNotifyAdmin !== undefined) updatePayload.privateNotifyAdmin = Boolean(body.privateNotifyAdmin);
    if (body.enableImageScan !== undefined) updatePayload.enableImageScan = Boolean(body.enableImageScan);
    if (body.enableVideoScan !== undefined) updatePayload.enableVideoScan = Boolean(body.enableVideoScan);

    const updated = db.updateSettings(updatePayload);

    return NextResponse.json({
      success: true,
      message: 'Pengaturan sistem SRJ Guardian berhasil disimpan.',
      data: updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
