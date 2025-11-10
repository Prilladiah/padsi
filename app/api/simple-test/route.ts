import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Coba query yang sangat sederhana
    const result = await query('SELECT 1+1 as test_result');
    
    // Coba akses tabel stok yang kita tahu ada
    const stokResult = await query('SELECT COUNT(*) as total_stok FROM stok');
    
    // Coba lihat isi stok
    const stokData = await query('SELECT id_stok, nama_stok, jumlah_stok, Harga_stok FROM stok LIMIT 3');

    return NextResponse.json({
      success: true,
      connection: '✅ Database Connected',
      testResult: result.rows[0].test_result,
      totalStok: stokResult.rows[0].total_stok,
      sampleStok: stokData.rows
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Database error',
      details: error.message
    }, { status: 500 });
  }
}