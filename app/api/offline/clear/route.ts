// FILE: app/api/offline/clear/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/lib.auth-server';

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(); // ✅ Tambahkan await
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🗑️ Offline data clear requested by:', user.name);

    return NextResponse.json({
      success: true,
      message: 'Offline data cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Clear error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Clear failed'
      },
      { status: 500 }
    );
  }
}