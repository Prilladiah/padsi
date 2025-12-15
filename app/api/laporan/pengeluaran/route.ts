import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const unitBisnis = searchParams.get('unitBisnis') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    
    console.log('📊 Fetching laporan pengeluaran from stok...');
    console.log('Params:', { limit, page, unitBisnis, startDate, endDate });

    // Hitung offset untuk pagination
    const offset = (page - 1) * limit;

    // Bangun query dinamis
    let whereConditions: string[] = ['s.jumlah_stok > 0 AND s.Harga_stok > 0'];
    const queryParams: any[] = [];

    if (unitBisnis && unitBisnis !== 'all' && unitBisnis !== '') {
      whereConditions.push(`s.unit_bisnis = $${queryParams.length + 1}`);
      queryParams.push(unitBisnis);
    }

    if (startDate) {
      whereConditions.push(`s.tanggal_stok >= $${queryParams.length + 1}`);
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`s.tanggal_stok <= $${queryParams.length + 1}`);
      queryParams.push(endDate);
    }

    // Query untuk menghitung total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM stok s
      WHERE ${whereConditions.join(' AND ')}
    `;

    // Query untuk data
    const dataQuery = `
      SELECT 
        s.id_stok,
        s.nama_stok,
        s.unit_bisnis,
        s.supplier_stok,
        s.tanggal_stok,
        s.jumlah_stok,
        s.Harga_stok,
        (s.jumlah_stok::numeric * s.Harga_stok::numeric) as total_pengeluaran,
        COALESCE(s.metode_pembayaran, 'Tunai') as metode_pembayaran,
        EXTRACT(YEAR FROM s.tanggal_stok::date) as tahun,
        EXTRACT(MONTH FROM s.tanggal_stok::date) as bulan,
        EXTRACT(DAY FROM s.tanggal_stok::date) as hari
      FROM stok s
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY s.tanggal_stok DESC, s.id_stok DESC
      LIMIT $${queryParams.length + 1}
      OFFSET $${queryParams.length + 2}
    `;

    // Eksekusi query
    queryParams.push(limit, offset);
    
    console.log('Executing count query:', countQuery);
    console.log('Count params:', queryParams.slice(0, -2));
    
    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const totalItems = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(totalItems / limit);

    console.log('Executing data query:', dataQuery);
    console.log('Data params:', queryParams);
    
    const dataResult = await query(dataQuery, queryParams);

    // Transformasi data ke format laporan
    const laporanData = dataResult.rows.map((row: any) => ({
      id_laporan: row.id_stok,
      jenis_laporan: 'Pengeluaran',
      periode_laporan: row.tanggal_stok,
      unit_bisnis: row.unit_bisnis,
      total_pengeluaran: parseFloat(row.total_pengeluaran) || 0,
      total_pendapatan: 0,
      id_stok: row.id_stok,
      nama_stok: row.nama_stok,
      unit_bisnis_stok: row.unit_bisnis,
      supplier_stok: row.supplier_stok,
      jumlah_stok: row.jumlah_stok,
      Harga_stok: row.Harga_stok,
      metode_pembayaran: row.metode_pembayaran,
      tahun: row.tahun,
      bulan: row.bulan,
      hari: row.hari
    }));

    // Hitung total pengeluaran
    const totalPengeluaran = laporanData.reduce((sum, item) => sum + item.total_pengeluaran, 0);

    console.log(`✅ Generated ${laporanData.length} pengeluaran records from ${totalItems} total items`);
    console.log(`💰 Total pengeluaran: Rp ${totalPengeluaran.toLocaleString('id-ID')}`);

    return NextResponse.json({
      success: true,
      data: laporanData,
      meta: {
        total: totalItems,
        page,
        limit,
        totalPages,
        totalPengeluaran
      }
    });

  } catch (error: any) {
    console.error('❌ Laporan Pengeluaran Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal mengambil data pengeluaran dari stok',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}