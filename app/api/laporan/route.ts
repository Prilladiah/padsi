// app/api/laporan/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting Laporan API...');
    
    const { searchParams } = new URL(request.url);
    const jenis = searchParams.get('jenis');
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    // Cek apakah kolom metode_pembayaran ada di tabel
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'laporan' AND column_name = 'metode_pembayaran'
    `;
    
    const columnCheck = await query(checkColumnQuery);
    const hasMetodePembayaran = columnCheck.rows.length > 0;

    console.log('Has metode_pembayaran column:', hasMetodePembayaran);

    // Query dengan atau tanpa metode_pembayaran
    let sqlQuery = `
      SELECT 
        id_laporan,
        jenis_laporan,
        periode_laporan,
        unit_bisnis,
        total_pengeluaran,
        total_pendapatan,
        id_stok
        ${hasMetodePembayaran ? ', metode_pembayaran' : ''}
      FROM laporan
      WHERE 1=1
    `;

    const params: any[] = [];

    if (jenis) {
      sqlQuery += ` AND jenis_laporan = $1`;
      params.push(jenis);
    }

    sqlQuery += ` ORDER BY periode_laporan DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    console.log('📊 Executing query...');
    const result = await query(sqlQuery, params);
    
    const queryTime = Date.now() - startTime;
    console.log(`✅ Query completed in ${queryTime}ms, found ${result.rows.length} records`);

    // Transform dengan metode_pembayaran
    const transformedData = result.rows.map((row: any) => ({
      id_laporan: +row.id_laporan,
      jenis_laporan: row.jenis_laporan,
      periode_laporan: row.periode_laporan,
      unit_bisnis: row.unit_bisnis,
      total_pengeluaran: +(row.total_pengeluaran || 0),
      total_pendapatan: +(row.total_pendapatan || 0),
      id_stok: +row.id_stok,
      metode_pembayaran: hasMetodePembayaran ? (row.metode_pembayaran || 'Tunai') : 'Tunai'
    }));

    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: transformedData,
      total: transformedData.length,
      performance: {
        queryTime: `${queryTime}ms`,
        totalTime: `${totalTime}ms`
      }
    });

  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ API failed after ${totalTime}ms:`, error);
    console.error('Full error:', error.message);
    console.error('Stack:', error.stack);
    
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