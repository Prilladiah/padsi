// app/api/laporan/pengeluaran/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 100;

    // Cek apakah kolom metode_pembayaran ada di tabel stok
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stok' AND column_name = 'metode_pembayaran'
    `;
    
    const columnCheck = await query(checkColumnQuery);
    const hasMetodePembayaran = columnCheck.rows.length > 0;

    console.log('Stok has metode_pembayaran column:', hasMetodePembayaran);

    // Query untuk mengambil data pengeluaran dari stok
    let sqlQuery = `
      SELECT 
        s.id_stok as id_laporan,
        'Pengeluaran' as jenis_laporan,
        s.tanggal_stok as periode_laporan,
        'Toko Utama' as unit_bisnis,
        (s.jumlah_stok::numeric * s.Harga_stok::numeric) as total_pengeluaran,
        0 as total_pendapatan,
        s.id_stok
        ${hasMetodePembayaran ? ', COALESCE(s.metode_pembayaran, \'Tunai\') as metode_pembayaran' : ''}
      FROM stok s
      WHERE s.jumlah_stok::numeric > 0
    `;

    const params: any[] = [];

    sqlQuery += ` ORDER BY s.tanggal_stok DESC, s.id_stok DESC`;
    sqlQuery += ` LIMIT $1`;
    params.push(limit);

    console.log('Executing pengeluaran dari stok query');

    const result = await query(sqlQuery, params);

    const transformedData = result.rows.map((row: any) => ({
      id_laporan: row.id_laporan,
      jenis_laporan: row.jenis_laporan,
      periode_laporan: row.periode_laporan,
      unit_bisnis: row.unit_bisnis,
      total_pengeluaran: parseFloat(row.total_pengeluaran) || 0,
      total_pendapatan: 0,
      id_stok: row.id_stok,
      metode_pembayaran: hasMetodePembayaran ? (row.metode_pembayaran || 'Tunai') : 'Tunai'
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: transformedData.length
    });

  } catch (error: any) {
    console.error('Laporan Pengeluaran dari Stok Error:', error);
    console.error('Full error:', error.message);
    console.error('Stack:', error.stack);
    
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