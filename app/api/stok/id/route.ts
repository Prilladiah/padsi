// app/api/stok/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ✅ Helper function untuk menentukan satuan
function getSatuanStok(namaStok: string): string {
  const nama = namaStok.toLowerCase();
  
  if (nama.includes('cup') || nama.includes('gelas') || nama.includes('paper')) {
    return 'pcs';
  }
  if (nama.includes('susu') || nama.includes('air') || nama.includes('sirup') || nama.includes('cream')) {
    return 'liter';
  }
  return 'kg';
}

// GET /api/stok/[id] - Get single stok item
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ [key: string]: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams.id;

    console.log('📥 GET Dynamic Route - ID:', id);

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, error: 'ID tidak valid' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT 
        id_stok,
        kode,
        nama_stok,
        unit_bisnis,
        supplier_stok,
        tanggal_stok,
        jumlah_stok,
        "Harga_stok"
       FROM stok WHERE id_stok = $1`,
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    // ✅ FIXED: Kembalikan data tanpa mapping satuan_stok
    // Frontend akan handle satuan sendiri berdasarkan nama_stok
    const responseData = {
      ...result.rows[0]
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error: any) {
    console.error('❌ GET Dynamic Route Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal mengambil data stok',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/stok/[id] - Update stok item
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ [key: string]: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams.id;
    const body = await request.json();
    
    console.log('✏️ PUT Dynamic Route - ID:', id, 'Body:', body);

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, error: 'ID tidak valid' },
        { status: 400 }
      );
    }

    const { 
      nama_stok, 
      unit_bisnis, 
      supplier_stok, 
      tanggal_stok, 
      jumlah_stok, 
      Harga_stok 
    } = body;

    if (!nama_stok) {
      return NextResponse.json(
        { success: false, error: 'Nama stok wajib diisi' },
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

    const updateData = {
      nama_stok: nama_stok.trim(),
      unit_bisnis: (unit_bisnis || 'Cafe').trim(),
      supplier_stok: (supplier_stok || 'Tidak ada supplier').trim(),
      tanggal_stok: tanggal_stok || new Date().toISOString().split('T')[0],
      jumlah_stok: Number(jumlah_stok) || 0,
      Harga_stok: Number(Harga_stok) || 0
    };

    // Update
    const result = await query(
      `UPDATE stok 
       SET nama_stok = $1, unit_bisnis = $2, supplier_stok = $3, 
           tanggal_stok = $4, jumlah_stok = $5, "Harga_stok" = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_stok = $7 
       RETURNING *`,
      [
        updateData.nama_stok,
        updateData.unit_bisnis,
        updateData.supplier_stok,
        updateData.tanggal_stok,
        updateData.jumlah_stok,
        updateData.Harga_stok,
        parseInt(id)
      ]
    );

    // ✅ FIXED: Kembalikan data tanpa mapping
    const responseData = {
      ...result.rows[0]
    };

    console.log('✅ PUT Dynamic Route Success:', responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Stok berhasil diupdate'
    });

  } catch (error: any) {
    console.error('❌ PUT Dynamic Route Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal mengupdate stok',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/stok/[id] - Delete stok item
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ [key: string]: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams.id;
    
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

    console.log('✅ DELETE Dynamic Route Success - Deleted ID:', id);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Stok berhasil dihapus'
    });

  } catch (error: any) {
    console.error('❌ DELETE Dynamic Route Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal menghapus stok',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}