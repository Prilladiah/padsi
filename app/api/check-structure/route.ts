import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Cek struktur tabel laporan
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'laporan' 
      ORDER BY ordinal_position
    `);

    return NextResponse.json({
      success: true,
      structure: result.rows
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal mengambil struktur tabel',
        details: error.message 
      },
      { status: 500 }
    );
  }
}