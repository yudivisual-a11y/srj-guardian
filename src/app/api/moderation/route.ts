import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const logs = db.getModerationLogs();
  return NextResponse.json({
    success: true,
    data: logs
  });
}

export async function PATCH(req: Request) {
  try {
    const { id, decision, reviewedBy } = await req.json();
    if (!id || !decision) {
      return NextResponse.json({ error: 'id dan decision wajib disertakan.' }, { status: 400 });
    }

    const updated = db.updateModerationDecision(id, decision, reviewedBy || 'Admin SRJ');
    if (!updated) {
      return NextResponse.json({ error: 'Log moderasi tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Keputusan moderasi berhasil disimpan.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
