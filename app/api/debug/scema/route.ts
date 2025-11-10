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
      columns: result.rows
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal cek struktur tabel' },
      { status: 500 }
    );
  }
}