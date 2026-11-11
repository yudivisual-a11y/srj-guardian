import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const groups = db.getMonitoredGroups();
  return NextResponse.json({
    success: true,
    data: groups
  });
}

export async function PATCH(req: Request) {
  try {
    const { groupId } = await req.json();
    if (!groupId) {
      return NextResponse.json({ error: 'groupId wajib disertakan.' }, { status: 400 });
    }

    const toggled = db.toggleGroupActive(groupId);
    if (!toggled) {
      return NextResponse.json({ error: 'Grup tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Status pemantauan grup berhasil diubah.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { isActive } = await req.json();
    const count = db.setAllGroupsActive(Boolean(isActive));
    return NextResponse.json({
      success: true,
      count,
      message: `Semua (${count}) grup berhasil di-${isActive ? 'aktifkan' : 'nonaktifkan'}.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.groupJid || !body.groupName) {
      return NextResponse.json({ error: 'groupJid dan groupName wajib diisi.' }, { status: 400 });
    }

    const newGroup = db.addMonitoredGroup({
      id: `grp-${Date.now()}`,
      groupJid: body.groupJid,
      groupName: body.groupName,
      isActive: true,
      autoScanUrls: true,
      autoModContent: true,
      socialCareEnabled: true,
      autoDeleteThreats: Boolean(body.autoDeleteThreats),
      rulesSummary: body.rulesSummary || 'SILIH ASAH, SILIH ASIH, SILIH ASUH.',
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: newGroup,
      message: 'Grup baru berhasil didaftarkan untuk pemantauan.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
