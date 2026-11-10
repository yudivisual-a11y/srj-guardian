import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const incidents = db.getSecurityIncidents();
  return NextResponse.json({
    success: true,
    data: incidents
  });
}

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'id dan status wajib disertakan.' }, { status: 400 });
    }

    const updated = db.updateSecurityIncidentStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Insiden tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Status insiden berhasil diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
