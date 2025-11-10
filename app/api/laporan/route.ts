import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    console.log('=== LAPORAN API START ===');
    console.log('Database URL exists:', !!process.env.DATABASE_URL);
    
    const { searchParams } = new URL(request.url);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));

    const jenis = searchParams.get('jenis');
    const unitBisnis = searchParams.get('unit_bisnis');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = Number(searchParams.get('limit')) || 50;

    const finalLimit = Math.min(Math.max(limit, 1), 100);

    let sqlQuery = `
      SELECT 
        Id_laporan as id_laporan,
        Jenis_laporan as jenis_laporan,
        periode_laporan,
        unit_blenis as unit_bisnis,
        total_pengeluaran,
        total_pendapatan,
        id_stok
      FROM laporan
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (jenis) {
      paramCount++;
      sqlQuery += ` AND Jenis_laporan = $${paramCount}`;
      params.push(jenis);
    }

    if (unitBisnis) {
      paramCount++;
      sqlQuery += ` AND unit_bisnis = $${paramCount}`;
      params.push(unitBisnis);
    }

    if (startDate) {
      paramCount++;
      sqlQuery += ` AND periode_laporan >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      sqlQuery += ` AND periode_laporan <= $${paramCount}`;
      params.push(endDate);
    }

    sqlQuery += ` ORDER BY periode_laporan DESC, Id_laporan DESC`;
    paramCount++;
    sqlQuery += ` LIMIT $${paramCount}`;
    params.push(finalLimit);

    console.log('Final SQL Query:', sqlQuery);
    console.log('Query Params:', params);

    const result = await query(sqlQuery, params);
    console.log('Query result rows:', result.rows.length);

    // Transform data - HAPUS kategori dan nama_stok
    const fixedRows = result.rows.map((row: any) => ({
      id_laporan: row.id_laporan,
      jenis_laporan: row.jenis_laporan,
      periode_laporan: row.periode_laporan,
      unit_bisnis: row.unit_bisnis,
      total_pengeluaran: parseFloat(row.total_pengeluaran) || 0,
      total_pendapatan: parseFloat(row.total_pendapatan) || 0,
      id_stok: row.id_stok
      // HAPUS: kategori, nama_stok, jumlah_stok, harga_satuan, periodic_laporan_date
    }));

    console.log('=== LAPORAN API SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      data: fixedRows,
      total: fixedRows.length
    });

  } catch (error: any) {
    console.error('=== LAPORAN API ERROR ===');
    console.error('Error details:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal mengambil data laporan',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}