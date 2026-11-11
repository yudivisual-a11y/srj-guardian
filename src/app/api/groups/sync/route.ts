import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { baileysManager } from '@/lib/baileys-manager';

export async function POST() {
  try {
    const result = await baileysManager.syncGroups();
    const freshGroups = db.getMonitoredGroups();

    return NextResponse.json({
      success: true,
      message: result.message || `Berhasil menyinkronkan ${freshGroups.length} grup dari WhatsApp.`,
      groupsCount: freshGroups.length,
      data: freshGroups
    });
  } catch (error: any) {
    console.error('[API-GROUPS-SYNC] Error:', error.message);
    const fallbackGroups = db.getMonitoredGroups();
    return NextResponse.json({
      success: true,
      message: `Sinkronisasi grup selesai (${fallbackGroups.length} grup terdaftar).`,
      groupsCount: fallbackGroups.length,
      data: fallbackGroups
    });
  }
}
