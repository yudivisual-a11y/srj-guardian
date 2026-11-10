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
