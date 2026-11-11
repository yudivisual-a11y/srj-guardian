import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const reports = db.getHelpReports();
  return NextResponse.json({
    success: true,
    data: reports
  });
}

export async function PATCH(req: Request) {
  try {
    const { id, status, notes, assignedAdmin } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'id dan status wajib disertakan.' }, { status: 400 });
    }

    const updated = db.updateHelpReport(id, status, notes, assignedAdmin);
    if (!updated) {
      return NextResponse.json({ error: 'Laporan bantuan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Status penanganan bantuan diperbarui.' });
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
      const count = db.clearHelpReports();
      return NextResponse.json({
        success: true,
        message: `Seluruh (${count}) data permohonan bantuan social care berhasil dihapus.`
      });
    }

    if (!id) {
      return NextResponse.json({ error: 'id wajib disertakan untuk menghapus.' }, { status: 400 });
    }

    const deleted = db.deleteHelpReport(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Data laporan bantuan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Data laporan bantuan berhasil dihapus.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
