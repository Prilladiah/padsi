import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    console.log('🗑️ DELETE Dynamic Route - ID:', id);

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, error: 'ID tidak valid' },
        { status: 400 }
      );
    }

    // Cek existence
    const checkResult = await query(
      'SELECT id_stok FROM stok WHERE id_stok = $1',
      [parseInt(id)]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    // Delete
    const result = await query(
      'DELETE FROM stok WHERE id_stok = $1 RETURNING *',
      [parseInt(id)]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Stok berhasil dihapus'
    });

  } catch (error: any) {
    console.error('❌ DELETE Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal menghapus stok',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT untuk update
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // ... kode update
  } catch (error: any) {
    console.error('❌ PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengupdate stok' },
      { status: 500 }
    );
  }
}