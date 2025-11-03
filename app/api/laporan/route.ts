import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// GET - Ambil semua laporan
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun') || new Date().getFullYear().toString();
    const jenis = searchParams.get('jenis');

    let sql = `SELECT * FROM laporan WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    // Filter tahun
    if (tahun) {
      paramCount++;
      sql += ` AND EXTRACT(YEAR FROM tanggal) = $${paramCount}`;
      params.push(parseInt(tahun));
    }

    // Filter bulan
    if (bulan) {
      paramCount++;
      sql += ` AND EXTRACT(MONTH FROM tanggal) = $${paramCount}`;
      params.push(parseInt(bulan));
    }

    // Filter jenis
    if (jenis) {
      paramCount++;
      sql += ` AND jenis = $${paramCount}`;
      params.push(jenis);
    }

    sql += ` ORDER BY tanggal DESC`;

    const result = await query(sql, params);
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data' },
      { status: 500 }
    );
  }
}

// POST - Buat laporan baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { judul, deskripsi, jenis } = body;

    // Validasi input
    if (!judul) {
      return NextResponse.json(
        { success: false, error: 'Judul harus diisi' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO laporan (judul, deskripsi, jenis) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [judul, deskripsi, jenis || 'umum']
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Laporan berhasil dibuat'
    }, { status: 201 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat laporan' },
      { status: 500 }
    );
  }
}