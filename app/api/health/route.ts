// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as version');
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        time: result.rows[0].current_time,
        version: result.rows[0].version
      }
    });
  } catch (error: any) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      database: {
        connected: false,
        error: error.message
      }
    }, { status: 500 });
  }
}