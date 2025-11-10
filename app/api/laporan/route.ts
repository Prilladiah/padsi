import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    console.log('🔗 Starting Laporan API...');
    
    const { searchParams } = new URL(request.url);
    const jenis = searchParams.get('jenis');
    const limit = Number(searchParams.get('limit')) || 50;

    // GUNAKAN NAMA TABEL DAN KOLOM YANG SESUAI DENGAN NEONDB
    let sqlQuery = `
      SELECT 
        "Intl...lapscan --root=0:6..." as id_laporan,
        "Prangblazan" as jenis_laporan,
        "periodic_lapscan --root=0:6..." as periode_laporan,
        "Intl...blanks --root=0:6:9..." as unit_bisnis,
        "Intl...prangblazan --root=0:6:9..." as total_pengeluaran,
        "Intl...gardepatan --root=0:6:9..." as total_pendapatan,
        "id_stok --root=0:6:9:9" as id_stok
      FROM lapscan
      WHERE 1=1
    `;

    const params: any[] = [];

    if (jenis) {
      sqlQuery += ` AND "Prangblazan" = $1`;
      params.push(jenis);
    }

    sqlQuery += ` ORDER BY "periodic_lapscan --root=0:6..." DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    console.log('📊 Executing Query:', sqlQuery);
    console.log('🔧 Query Params:', params);

    const result = await query(sqlQuery, params);
    console.log(`✅ Found ${result.rows.length} records`);

    // Transform data
    const transformedData = result.rows.map((row: any) => ({
      id_laporan: row.id_laporan,
      jenis_laporan: 'Pengeluaran', // Force to Pengeluaran
      periode_laporan: row.periode_laporan,
      unit_bisnis: row.unit_bisnis,
      total_pengeluaran: parseFloat(row.total_pengeluaran) || 0,
      total_pendapatan: parseFloat(row.total_pendapatan) || 0,
      id_stok: row.id_stok
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: transformedData.length
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