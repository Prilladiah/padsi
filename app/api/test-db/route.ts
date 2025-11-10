// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT NOW() AS time');
    return NextResponse.json({
      success: true,
      message: 'KONEKSI KE NEON BERHASIL!',
      time: result.rows[0].time,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}