import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/stok/[id] - Ambil stok by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    const result = await query(
      'SELECT * FROM stok WHERE id = $1',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Stok tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT /api/stok/[id] - Update stok
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();
    const { nama, jumlah, kategori, deskripsi, harga_beli, harga_jual } = body;

    const result = await query(
      `UPDATE stok 
       SET nama = $1, jumlah = $2, kategori = $3, deskripsi = $4, 
           harga_beli = $5, harga_jual = $6, updated_at = NOW()
       WHERE id = $7 
       RETURNING *`,
      [nama, parseInt(jumlah), kategori, deskripsi, harga_beli, harga_jual, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Stok tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Stok berhasil diupdate'
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/stok/[id] - Hapus stok
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    const result = await query(
      'DELETE FROM stok WHERE id = $1 RETURNING *',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Stok tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Stok berhasil dihapus'
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}