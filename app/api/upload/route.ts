// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validasi tipe file
    if (!['stok', 'laporan', 'offline'].includes(fileType)) {
      return NextResponse.json(
        { success: false, error: 'Tipe file tidak valid' },
        { status: 400 }
      );
    }

    // Process file berdasarkan tipe
    const fileText = await file.text();
    let parsedData: any[] = [];

    if (file.name.endsWith('.csv')) {
      // Parse CSV
      const lines = fileText.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        return NextResponse.json(
          { success: false, error: 'File CSV tidak memiliki data' },
          { status: 400 }
        );
      }

      const headers = lines[0].split(',').map(header => 
        header.trim().toLowerCase().replace(/\s+/g, '_')
      );
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          if (values[index] !== undefined && values[index] !== '') {
            row[header] = values[index];
          }
        });

        if (Object.keys(row).length > 0) {
          parsedData.push(row);
        }
      }
    } else if (file.name.endsWith('.json')) {
      // Parse JSON
      try {
        const data = JSON.parse(fileText);
        
        if (data.data_type === 'stok_update' && data.stok) {
          parsedData = data.stok;
        } else if (data.data_type === 'laporan_harian' && data.laporan) {
          parsedData = data.laporan;
        } else if (data.data_type === 'offline_sync' && data.offline_data) {
          parsedData = data.offline_data;
        } else if (Array.isArray(data)) {
          parsedData = data;
        }
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Format JSON tidak valid' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Format file tidak didukung' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File berhasil diproses',
      data: parsedData,
      totalRecords: parsedData.length
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}