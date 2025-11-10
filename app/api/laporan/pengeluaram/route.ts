import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = Number(searchParams.get('limit')) || 100;

    // Query untuk mengambil data pengeluaran dari stok
    let sqlQuery = `
      SELECT 
        s.id_stok as id_laporan,
        'Pengeluaran' as jenis_laporan,
        s.tanggal_stok as periode_laporan,
        'Toko Utama' as unit_bisnis,
        (s.jumlah_stok * s.Harga_stok) as total_pengeluaran,
        0 as total_pendapatan,
        s.id_stok,
        s.nama_stok,
        s.supplier_stok as kategori,
        s.jumlah_stok,
        s.Harga_stok as harga_satuan
      FROM stok s
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (startDate) {
      sqlQuery += ` AND s.tanggal_stok >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      sqlQuery += ` AND s.tanggal_stok <= $${paramCount++}`;
      params.push(endDate);
    }

    sqlQuery += ` ORDER BY s.tanggal_stok DESC, s.id_stok DESC`;
    sqlQuery += ` LIMIT $${paramCount++}`;
    params.push(limit);

    console.log('Executing pengeluaran dari stok query:', sqlQuery);
    console.log('With params:', params);

    const result = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error: any) {
    console.error('Laporan Pengeluaran dari Stok Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal mengambil data pengeluaran dari stok',
        details: error.message 
      },
      { status: 500 }
    );
  }
}