import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// GET /api/stok - Ambil semua stok
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    let sql = `
      SELECT * FROM stok 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      sql += ` AND (nama ILIKE $${paramCount} OR kategori ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    
    // Hitung total untuk pagination
    const countResult = await query(
      'SELECT COUNT(*) FROM stok WHERE nama ILIKE $1',
      [`%${search}%`]
    );
    
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/stok - Tambah stok baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama, jumlah, kategori, deskripsi, harga_beli, harga_jual } = body;

    // Validasi required fields
    if (!nama || !jumlah || !kategori) {
      return NextResponse.json(
        { success: false, error: 'Nama, jumlah, dan kategori harus diisi' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO stok (nama, jumlah, kategori, deskripsi, harga_beli, harga_jual) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [nama, parseInt(jumlah), kategori, deskripsi, harga_beli, harga_jual]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Stok berhasil ditambahkan'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Database error:', error);
    
    // Handle duplicate key atau constraint errors
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Data sudah ada' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}