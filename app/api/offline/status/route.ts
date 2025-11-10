// FILE: app/api/offline/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/lib.auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(); // ✅ Tambahkan await
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiUrl}/stok?page=1&limit=1`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const isOnline = response.ok;

      return NextResponse.json({
        success: true,
        online: isOnline,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      return NextResponse.json({
        success: true,
        online: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    }

  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      },
      { status: 500 }
    );
  }
}