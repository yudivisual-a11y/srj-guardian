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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const isAll = searchParams.get('all') === 'true';

    if (isAll || id === 'all') {
      const count = db.clearModerationLogs();
      return NextResponse.json({
        success: true,
        message: `Seluruh (${count}) data log moderasi berhasil dihapus.`
      });
    }

    if (!id) {
      return NextResponse.json({ error: 'id wajib disertakan untuk menghapus.' }, { status: 400 });
    }

    const deleted = db.deleteModerationLog(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Data log moderasi tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Data log moderasi berhasil dihapus.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
