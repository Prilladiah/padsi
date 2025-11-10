// app/api/laporan/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    console.log('🚀 Starting Laporan API...');
    
    const { searchParams } = new URL(request.url);
    const jenis = searchParams.get('jenis');
    const limit = Number(searchParams.get('limit')) || 50;

    const finalLimit = Math.min(Math.max(limit, 1), 100);

    // GUNAKAN TABEL laporan YANG SUDAH TERBUKTI ADA
    let sqlQuery = `
      SELECT 
        id_laporan,
        jenis_laporan,
        periode_laporan,
        unit_bisnis,
        total_pengeluaran,
        total_pendapatan,
        id_stok
      FROM laporan
      WHERE 1=1
    `;

    const params: any[] = [];

    if (jenis) {
      sqlQuery += ` AND jenis_laporan = $1`;
      params.push(jenis);
    }

    sqlQuery += ` ORDER BY periode_laporan DESC, id_laporan DESC`;
    sqlQuery += ` LIMIT $${params.length + 1}`;
    params.push(finalLimit);

    console.log('📊 Executing Query:', sqlQuery);
    console.log('🔧 Query Params:', params);

    const result = await query(sqlQuery, params);
    console.log(`✅ Found ${result.rows.length} records from laporan table`);

    // Transform data
    const transformedData = result.rows.map((row: any) => ({
      id_laporan: row.id_laporan,
      jenis_laporan: row.jenis_laporan,
      periode_laporan: row.periode_laporan,
      unit_bisnis: row.unit_bisnis,
      total_pengeluaran: parseFloat(row.total_pengeluaran) || 0,
      total_pendapatan: parseFloat(row.total_pendapatan) || 0,
      id_stok: row.id_stok
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: transformedData.length,
      source: 'laporan_table'
    });

  } catch (error: any) {
    console.error('❌ Laporan API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal mengambil data laporan',
        details: error.message
      },
      { status: 500 }
    );
  }
}