// app/api/stok/route.ts - COMPLETE FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { query, checkDatabaseConnection } from '@/lib/db';

// Cache untuk fallback data (simple in-memory cache)
let cache = {
  data: null as any,
  timestamp: 0,
  ttl: 30000 // 30 seconds
};

// GET /api/stok - Ambil semua stok dengan fallback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    console.log('🔍 GET Query parameters:', { page, limit, search, offset });

    // Check database connection first
    const isDbHealthy = await checkDatabaseConnection();
    
    if (!isDbHealthy) {
      console.warn('⚠️ Database unhealthy, using cache fallback');
      
      // Return cached data if available
      if (cache.data && Date.now() - cache.timestamp < cache.ttl) {
        return NextResponse.json({
          success: true,
          data: cache.data,
          pagination: { page, limit, total: cache.data.length, totalPages: 1 },
          cached: true,
          message: 'Using cached data (database temporarily unavailable)'
        });
      }
      
      throw new Error('Database connection failed');
    }

    let sql = `
      SELECT 
        id_stok,
        nama_stok,
        satuan_stok,
        supplier_stok,
        tanggal_stok,
        jumlah_stok,
        "Harga_stok"
      FROM stok 
    `;
    
    const params: any[] = [];
    let whereClause = '';

    if (search) {
      whereClause = ` WHERE nama_stok ILIKE $1 OR supplier_stok ILIKE $1 OR satuan_stok ILIKE $1`;
      params.push(`%${search}%`);
    }

    sql += whereClause;
    sql += ` ORDER BY id_stok DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    console.log('🔵 Executing query with params:', { params });
    
    const result = await query(sql, params);
    console.log('✅ Query successful, rows:', result.rows.length);
    
    // Hitung total dengan query terpisah untuk performa
    let countSql = 'SELECT COUNT(*) as total FROM stok';
    const countParams: any[] = [];
    
    if (search) {
      countSql += ' WHERE nama_stok ILIKE $1 OR supplier_stok ILIKE $1 OR satuan_stok ILIKE $1';
      countParams.push(`%${search}%`);
    }
    
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Update cache
    cache = {
      data: result.rows,
      timestamp: Date.now(),
      ttl: 30000
    };

    console.log('✅ API GET Response:', {
      dataCount: result.rows.length,
      total,
      totalPages
    });

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
    
  } catch (error: any) {
    console.error('🚨 API GET Error:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    // Fallback to cached data
    if (cache.data) {
      console.warn('🔄 Falling back to cached data');
      return NextResponse.json({
        success: true,
        data: cache.data,
        pagination: { page: 1, limit: cache.data.length, total: cache.data.length, totalPages: 1 },
        cached: true,
        message: 'Using cached data due to database error'
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal memuat data stok',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Database temporarily unavailable'
      },
      { status: 503 } // Service Unavailable
    );
  }
}

// POST /api/stok - Tambah stok baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📝 POST Request - Raw Body:', JSON.stringify(body, null, 2));
    
    const { 
      nama_stok, 
      satuan_stok, 
      supplier_stok, 
      tanggal_stok, 
      jumlah_stok, 
      Harga_stok 
    } = body;

    // ✅ Validasi required fields
    if (!nama_stok) {
      return NextResponse.json(
        { success: false, error: 'Nama stok wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi dan konversi tipe data
    const jumlahNumber = Number(jumlah_stok);
    const hargaNumber = Number(Harga_stok);

    if (isNaN(jumlahNumber) || jumlahNumber < 0) {
      return NextResponse.json(
        { success: false, error: 'Jumlah stok harus berupa angka positif' },
        { status: 400 }
      );
    }

    if (isNaN(hargaNumber) || hargaNumber < 0) {
      return NextResponse.json(
        { success: false, error: 'Harga stok harus berupa angka positif' },
        { status: 400 }
      );
    }

    // Data yang akan di-insert
    const insertData = {
      nama_stok: nama_stok.trim(),
      satuan_stok: (satuan_stok || 'pcs').trim(),
      supplier_stok: (supplier_stok || 'Tidak ada supplier').trim(),
      tanggal_stok: tanggal_stok || new Date().toISOString().split('T')[0],
      jumlah_stok: jumlahNumber,
      Harga_stok: hargaNumber
    };

    console.log('✅ Validation passed - Inserting data:', insertData);

    // Execute INSERT query
    const result = await query(
      `INSERT INTO stok (nama_stok, satuan_stok, supplier_stok, tanggal_stok, jumlah_stok, "Harga_stok") 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        insertData.nama_stok,
        insertData.satuan_stok,
        insertData.supplier_stok,
        insertData.tanggal_stok,
        insertData.jumlah_stok,
        insertData.Harga_stok
      ]
    );

    // Invalidate cache
    cache.data = null;

    console.log('✅ POST Success - New ID:', result.rows[0]?.id_stok);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Stok berhasil ditambahkan'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ POST API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal menambahkan stok',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/stok - Update stok
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID stok harus disertakan' },
        { status: 400 }
      );
    }

    const { 
      nama_stok, 
      satuan_stok, 
      supplier_stok, 
      tanggal_stok, 
      jumlah_stok, 
      Harga_stok 
    } = body;

    // Validasi required fields
    if (!nama_stok) {
      return NextResponse.json(
        { success: false, error: 'Nama stok wajib diisi' },
        { status: 400 }
      );
    }

    // Update data
    const updateData = {
      nama_stok: nama_stok.trim(),
      satuan_stok: (satuan_stok || 'pcs').trim(),
      supplier_stok: (supplier_stok || 'Tidak ada supplier').trim(),
      tanggal_stok: tanggal_stok || new Date().toISOString().split('T')[0],
      jumlah_stok: Number(jumlah_stok) || 0,
      Harga_stok: Number(Harga_stok) || 0
    };

    const result = await query(
      `UPDATE stok 
       SET nama_stok = $1, satuan_stok = $2, supplier_stok = $3, 
           tanggal_stok = $4, jumlah_stok = $5, "Harga_stok" = $6
       WHERE id_stok = $7 
       RETURNING *`,
      [
        updateData.nama_stok,
        updateData.satuan_stok,
        updateData.supplier_stok,
        updateData.tanggal_stok,
        updateData.jumlah_stok,
        updateData.Harga_stok,
        parseInt(id)
      ]
    );

    // Invalidate cache
    cache.data = null;

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Stok berhasil diupdate'
    });

  } catch (error: any) {
    console.error('❌ PUT API Error:', error);
    
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

// DELETE /api/stok - Hapus stok
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID stok harus disertakan' },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM stok WHERE id_stok = $1 RETURNING *',
      [parseInt(id)]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Data stok tidak ditemukan' },
        { status: 404 }
      );
    }

    // Invalidate cache
    cache.data = null;

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Stok berhasil dihapus'
    });

  } catch (error: any) {
    console.error('❌ DELETE API Error:', error);
    
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