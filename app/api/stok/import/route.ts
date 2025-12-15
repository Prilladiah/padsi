// app/api/stok/import/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Database connection (example with PostgreSQL)
// import { db } from '@/lib/db';

// Mock database for demonstration
const stokDatabase: any[] = [];

export async function POST(request: NextRequest) {
  console.log('=== IMPORT STOK API CALLED ===');
  
  try {
    // Parse request body
    const body = await request.json();
    
    console.log('📥 Data diterima:', body);
    
    // VALIDASI DATA
    // 1. Validasi required fields
    if (!body.nama_stok || body.nama_stok.trim() === '') {
      console.log('❌ Validasi gagal: nama_stok kosong');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gagal menambahkan stok',
          message: 'Nama stok tidak boleh kosong',
          detail: 'Field "nama_stok" harus diisi'
        },
        { status: 400 }
      );
    }
    
    if (!body.unit_bisnis || body.unit_bisnis.trim() === '') {
      console.log('❌ Validasi gagal: unit_bisnis kosong');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gagal menambahkan stok',
          message: 'Unit bisnis tidak boleh kosong',
          detail: 'Field "unit_bisnis" harus diisi'
        },
        { status: 400 }
      );
    }
    
    // 2. Validasi tipe data
    const jumlah_stok = Number(body.jumlah_stok);
    const Harga_stok = Number(body.Harga_stok);
    
    if (isNaN(jumlah_stok)) {
      console.log('❌ Validasi gagal: jumlah_stok bukan angka');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gagal menambahkan stok',
          message: 'Jumlah stok harus angka',
          detail: `Nilai "${body.jumlah_stok}" tidak valid untuk jumlah stok`
        },
        { status: 400 }
      );
    }
    
    if (isNaN(Harga_stok)) {
      console.log('❌ Validasi gagal: Harga_stok bukan angka');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gagal menambahkan stok',
          message: 'Harga stok harus angka',
          detail: `Nilai "${body.Harga_stok}" tidak valid untuk harga stok`
        },
        { status: 400 }
      );
    }
    
    // 3. Validasi nilai
    if (jumlah_stok < 0) {
      console.log('❌ Validasi gagal: jumlah_stok negatif');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gagal menambahkan stok',
          message: 'Jumlah stok tidak boleh negatif',
          detail: 'Jumlah stok minimal 0'
        },
        { status: 400 }
      );
    }
    
    if (Harga_stok < 0) {
      console.log('❌ Validasi gagal: Harga_stok negatif');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gagal menambahkan stok',
          message: 'Harga stok tidak boleh negatif',
          detail: 'Harga stok minimal 0'
        },
        { status: 400 }
      );
    }
    
    // 4. Format tanggal
    let tanggal_stok: string;
    try {
      if (body.tanggal_stok && body.tanggal_stok.trim() !== '') {
        const dateStr = body.tanggal_stok;
        let date: Date;
        
        // Coba parse berbagai format tanggal
        if (dateStr.includes('/')) {
          // Format DD/MM/YYYY
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            date = new Date(dateStr);
          }
        } else if (dateStr.includes('-')) {
          // Format YYYY-MM-DD
          date = new Date(dateStr);
        } else {
          date = new Date(dateStr);
        }
        
        if (isNaN(date.getTime())) {
          tanggal_stok = new Date().toISOString().split('T')[0];
        } else {
          tanggal_stok = date.toISOString().split('T')[0];
        }
      } else {
        tanggal_stok = new Date().toISOString().split('T')[0];
      }
    } catch (error) {
      console.log('⚠️ Format tanggal error, menggunakan tanggal hari ini');
      tanggal_stok = new Date().toISOString().split('T')[0];
    }
    
    // 5. Format supplier default
    const supplier_stok = body.supplier_stok?.trim() || 'Supplier Umum';
    
    // SIMPAN KE DATABASE
    const stokData = {
      // id_stok akan di-generate oleh database
      nama_stok: body.nama_stok.trim(),
      unit_bisnis: body.unit_bisnis.trim(),
      supplier_stok,
      tanggal_stok,
      jumlah_stok,
      Harga_stok,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('💾 Data untuk disimpan:', stokData);
    
    // === CONTOH: Simpan ke database PostgreSQL ===
    /*
    try {
      const result = await db.query(
        `INSERT INTO stok (
          nama_stok, unit_bisnis, supplier_stok, tanggal_stok, 
          jumlah_stok, Harga_stok, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          stokData.nama_stok,
          stokData.unit_bisnis,
          stokData.supplier_stok,
          stokData.tanggal_stok,
          stokData.jumlah_stok,
          stokData.Harga_stok,
          stokData.created_at,
          stokData.updated_at
        ]
      );
      
      const insertedData = result.rows[0];
      console.log('✅ Data berhasil disimpan ke database:', insertedData);
      
      return NextResponse.json({
        success: true,
        message: 'Stok berhasil ditambahkan',
        data: insertedData
      });
      
    } catch (dbError: any) {
      console.error('❌ Database error:', dbError);
      
      // Handle specific database errors
      let errorMessage = 'Gagal menyimpan ke database';
      let detail = dbError.message;
      
      if (dbError.code === '23505') { // Unique constraint violation
        errorMessage = 'Data duplikat';
        detail = 'Stok dengan nama dan supplier yang sama sudah ada';
      } else if (dbError.code === '23502') { // Not null violation
        errorMessage = 'Data tidak lengkap';
        detail = 'Beberapa field required tidak diisi';
      } else if (dbError.code === '23503') { // Foreign key violation
        errorMessage = 'Data referensi tidak ditemukan';
        detail = 'Data terkait tidak ditemukan di database';
      } else if (dbError.code === '22003') { // Numeric value out of range
        errorMessage = 'Nilai angka tidak valid';
        detail = 'Nilai harga atau jumlah terlalu besar';
      } else if (dbError.code === '22P02') { // Invalid text representation
        errorMessage = 'Format data tidak valid';
        detail = 'Terdapat format data yang tidak sesuai';
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          message: detail,
          detail: dbError.message
        },
        { status: 500 }
      );
    }
    */
    
    // === UNTUK DEMO: Simpan ke array mock database ===
    try {
      // Cek duplikasi
      const isDuplicate = stokDatabase.some(
        item => 
          item.nama_stok === stokData.nama_stok && 
          item.supplier_stok === stokData.supplier_stok
      );
      
      if (isDuplicate) {
        console.log('⚠️ Data duplikat ditemukan');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Data duplikat',
            message: 'Stok dengan nama dan supplier yang sama sudah ada',
            detail: 'Gunakan fitur update untuk mengubah stok yang sudah ada'
          },
          { status: 409 }
        );
      }
      
      // Generate ID
      const newId = stokDatabase.length + 1;
      const dataToSave = {
        id_stok: newId,
        ...stokData,
        kode: `#${String(newId).padStart(2, '0')}STOK`
      };
      
      // Simpan ke mock database
      stokDatabase.push(dataToSave);
      
      console.log('✅ Data berhasil disimpan (mock):', dataToSave);
      console.log('📊 Total data dalam database:', stokDatabase.length);
      
      return NextResponse.json({
        success: true,
        message: 'Stok berhasil ditambahkan',
        data: dataToSave
      });
      
    } catch (error: any) {
      console.error('❌ Mock database error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gagal menambahkan stok',
          message: error.message || 'Terjadi kesalahan saat menyimpan data',
          detail: JSON.stringify(error)
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Terjadi kesalahan pada server',
        message: error.message || 'Unknown error',
        detail: error.stack || 'No stack trace'
      },
      { status: 500 }
    );
  }
}

// GET endpoint untuk debugging
export async function GET(request: NextRequest) {
  console.log('=== DEBUG: GET /api/stok/import ===');
  return NextResponse.json({
    success: true,
    message: 'Import API is working',
    database_count: stokDatabase.length,
    sample_data: stokDatabase.slice(0, 5)
  });
}