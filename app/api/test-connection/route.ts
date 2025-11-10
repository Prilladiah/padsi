import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 Searching for available tables...');
    
    // Test 1: Basic connection
    const test1 = await query('SELECT NOW() as waktu_sekarang');
    
    // Test 2: Cek SEMUA tabel yang ada di database
    const test2 = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    // Test 3: Cek tabel yang mungkin berisi data laporan
    const test3 = await query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND (table_name LIKE '%laporan%' OR table_name LIKE '%lap%' OR table_name LIKE '%stok%')
      ORDER BY table_name, ordinal_position
    `);

    return NextResponse.json({
      success: true,
      connection: '✅ Terhubung ke NeonDB',
      currentTime: test1.rows[0].waktu_sekarang,
      allTables: test2.rows.map((row: any) => row.table_name),
      possibleLaporanTables: test3.rows
    });

  } catch (error: any) {
    console.error('❌ Connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: '❌ Gagal terhubung ke database',
      details: error.message,
      databaseUrl: process.env.DATABASE_URL ? '✅ Ada' : '❌ Tidak ada'
    }, { status: 500 });
  }
}