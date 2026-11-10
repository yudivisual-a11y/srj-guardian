import { NextResponse } from 'next/server';
import { scanUrl } from '@/lib/url-scanner';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Parameter url wajib diisi.' },
        { status: 400 }
      );
    }

    const settings = db.getSettings();
    const result = await scanUrl(url.trim(), settings.safeBrowsingApiKey);
    
    // Save to historical URL scan log
    db.addUrlScan(result);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[API] /api/pipeline/scan-url error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memindai URL.' },
      { status: 500 }
    );
  }
}
