import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const jenis = searchParams.get('jenis');
    const unitBisnis = searchParams.get('unit_bisnis');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = Number(searchParams.get('limit')) || 50;

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
    let paramCount = 1;

    if (jenis) {
      sqlQuery += ` AND jenis_laporan = $${paramCount++}`;
      params.push(jenis);
    }

    if (unitBisnis) {
      sqlQuery += ` AND unit_bisnis = $${paramCount++}`;
      params.push(unitBisnis);
    }

    if (startDate) {
      sqlQuery += ` AND periode_laporan >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      sqlQuery += ` AND periode_laporan <= $${paramCount++}`;
      params.push(endDate);
    }

    sqlQuery += ` ORDER BY periode_laporan DESC, id_laporan DESC`;
    sqlQuery += ` LIMIT $${paramCount++}`;
    params.push(limit);

    console.log('Executing laporan query:', sqlQuery);
    console.log('With params:', params);

    const result = await query(sqlQuery, params);

    // Tambahkan field yang diharapkan frontend dengan nilai default
    const fixedRows = result.rows.map((row: any) => ({
      ...row,
      kategori: row.kategori || '-',
      nama_stok: row.nama_stok || '-',
      jumlah_stok: row.jumlah_stok || 0,
      harga_satuan: row.harga_satuan || 0
    }));

    return NextResponse.json({
      success: true,
      data: fixedRows,
      total: fixedRows.length
    });

  } catch (error: any) {
    console.error('Laporan GET Error:', error);
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