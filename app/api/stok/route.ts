// app/api/stok/route.ts - VERSI DENGAN 4 DATA ASLI
import { NextRequest, NextResponse } from 'next/server';

// Mock database - HANYA 4 DATA ASLI
let stokDatabase = [
  {
    id_stok: 1,
    nama_stok: 'Cup Paper 120',
    unit_bisnis: 'Cafe',
    supplier_stok: 'Supplier Packaging',
    tanggal_stok: '2024-01-06',
    jumlah_stok: 10,
    Harga_stok: 0,
  },
  {
    id_stok: 2,
    nama_stok: 'Gula Pasir',
    unit_bisnis: 'Cafe',
    supplier_stok: 'Supplier Gula Maris',
    tanggal_stok: '2024-01-06',
    jumlah_stok: 50,
    Harga_stok: 50000,
  },
  {
    id_stok: 3,
    nama_stok: 'Susu Full Cream',
    unit_bisnis: 'Cafe',
    supplier_stok: 'PT Susu Segar',
    tanggal_stok: '2024-01-06',
    jumlah_stok: 10,
    Harga_stok: 30000,
  },
  {
    id_stok: 4,
    nama_stok: 'Kopi Arabika',
    unit_bisnis: 'Cafe',
    supplier_stok: 'Supplier Kopi Juwa',
    tanggal_stok: '2024-01-06',
    jumlah_stok: 50,
    Harga_stok: 20000,
  },
];

// GET: Ambil semua stok
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    
    // Filter berdasarkan search
    let filteredData = [...stokDatabase];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.nama_stok.toLowerCase().includes(searchLower) ||
        item.supplier_stok.toLowerCase().includes(searchLower) ||
        item.unit_bisnis.toLowerCase().includes(searchLower) ||
        String(item.jumlah_stok).includes(searchLower) ||
        String(item.Harga_stok).includes(searchLower)
      );
    }
    
    // Sorting berdasarkan tanggal terbaru
    filteredData.sort((a, b) => 
      new Date(b.tanggal_stok).getTime() - new Date(a.tanggal_stok).getTime()
    );
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    // Format response
    return NextResponse.json({
      success: true,
      data: paginatedData,
    });
    
  } catch (error: any) {
    console.error('GET stok error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal mengambil data stok',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST: Tambah stok baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('POST stok request:', body);
    
    // Validasi
    if (!body.nama_stok || String(body.nama_stok).trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nama stok wajib diisi' },
        { status: 400 }
      );
    }
    
    if (!body.unit_bisnis || String(body.unit_bisnis).trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Unit bisnis wajib diisi' },
        { status: 400 }
      );
    }
    
    if (!body.jumlah_stok || Number(body.jumlah_stok) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Jumlah stok harus lebih dari 0' },
        { status: 400 }
      );
    }
    
    if (body.Harga_stok === undefined || Number(body.Harga_stok) < 0) {
      return NextResponse.json(
        { success: false, error: 'Harga tidak boleh negatif' },
        { status: 400 }
      );
    }
    
    // Generate ID baru
    const newId = stokDatabase.length > 0 
      ? Math.max(...stokDatabase.map(item => item.id_stok)) + 1 
      : 1;
    
    const newStok = {
      id_stok: newId,
      nama_stok: body.nama_stok.trim(),
      unit_bisnis: body.unit_bisnis.trim(),
      supplier_stok: body.supplier_stok?.trim() || 'Tidak ada supplier',
      tanggal_stok: body.tanggal_stok || new Date().toISOString().split('T')[0],
      jumlah_stok: Number(body.jumlah_stok),
      Harga_stok: Number(body.Harga_stok) || 0,
    };
    
    // Cek duplikasi
    const isDuplicate = stokDatabase.some(item => 
      item.nama_stok.toLowerCase() === newStok.nama_stok.toLowerCase() && 
      item.supplier_stok.toLowerCase() === newStok.supplier_stok.toLowerCase() &&
      item.unit_bisnis.toLowerCase() === newStok.unit_bisnis.toLowerCase()
    );
    
    if (isDuplicate) {
      return NextResponse.json(
        { success: false, error: 'Stok dengan nama, supplier, dan unit bisnis yang sama sudah ada' },
        { status: 409 }
      );
    }
    
    // Simpan ke database
    stokDatabase.push(newStok);
    
    console.log('Stok berhasil ditambahkan:', newStok);
    
    return NextResponse.json({
      success: true,
      message: 'Stok berhasil ditambahkan',
      data: newStok
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('POST stok error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal menambahkan stok',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT: Update stok
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');
    const body = await request.json();
    
    console.log('PUT stok request:', { id, body });
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID stok tidak valid' },
        { status: 400 }
      );
    }
    
    // Cari stok
    const index = stokDatabase.findIndex(item => item.id_stok === id);
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Stok tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Validasi
    if (body.jumlah_stok !== undefined && Number(body.jumlah_stok) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Jumlah stok harus lebih dari 0' },
        { status: 400 }
      );
    }
    
    if (body.Harga_stok !== undefined && Number(body.Harga_stok) < 0) {
      return NextResponse.json(
        { success: false, error: 'Harga tidak boleh negatif' },
        { status: 400 }
      );
    }
    
    // Update data
    const updatedStok = {
      ...stokDatabase[index],
      nama_stok: body.nama_stok?.trim() || stokDatabase[index].nama_stok,
      unit_bisnis: body.unit_bisnis?.trim() || stokDatabase[index].unit_bisnis,
      supplier_stok: body.supplier_stok?.trim() || stokDatabase[index].supplier_stok,
      tanggal_stok: body.tanggal_stok || stokDatabase[index].tanggal_stok,
      jumlah_stok: body.jumlah_stok !== undefined ? Number(body.jumlah_stok) : stokDatabase[index].jumlah_stok,
      Harga_stok: body.Harga_stok !== undefined ? Number(body.Harga_stok) : stokDatabase[index].Harga_stok,
    };
    
    stokDatabase[index] = updatedStok;
    
    console.log('Stok berhasil diperbarui:', updatedStok);
    
    return NextResponse.json({
      success: true,
      message: 'Stok berhasil diperbarui',
      data: updatedStok
    });
    
  } catch (error: any) {
    console.error('PUT stok error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal memperbarui stok',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE: Hapus stok
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');
    
    console.log('DELETE stok request:', { id });
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID stok tidak valid' },
        { status: 400 }
      );
    }
    
    // Cari stok
    const index = stokDatabase.findIndex(item => item.id_stok === id);
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Stok tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Hapus dari database
    const deletedStok = stokDatabase[index];
    stokDatabase = stokDatabase.filter(item => item.id_stok !== id);
    
    console.log('Stok berhasil dihapus:', deletedStok);
    
    return NextResponse.json({
      success: true,
      message: 'Stok berhasil dihapus',
      data: deletedStok
    });
    
  } catch (error: any) {
    console.error('DELETE stok error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal menghapus stok',
        details: error.message 
      },
      { status: 500 }
    );
  }
}