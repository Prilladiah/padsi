// FILE: app/api/offline/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/lib.auth-server';

interface ValidationError {
  id: string;
  errors: string[];
}

interface ValidationResult {
  valid: string[];
  invalid: ValidationError[];
  total: number;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(); // ✅ Tambahkan await
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data } = await request.json();

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: 'Data must be an array' },
        { status: 400 }
      );
    }

    const validation: ValidationResult = {
      valid: [],
      invalid: [],
      total: data.length
    };

    for (const item of data) {
      const errors = validateStokItem(item);
      
      if (errors.length === 0) {
        validation.valid.push(item.id);
      } else {
        validation.invalid.push({
          id: item.id,
          errors
        });
      }
    }

    return NextResponse.json({
      success: true,
      validation,
      message: `${validation.valid.length} of ${validation.total} items are valid`
    });

  } catch (error) {
    console.error('❌ Validation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      },
      { status: 500 }
    );
  }
}

function validateStokItem(item: any): string[] {
  const errors: string[] = [];

  if (!item.nama || typeof item.nama !== 'string' || item.nama.trim() === '') {
    errors.push('Nama stok is required');
  }

  if (!item.supplier || typeof item.supplier !== 'string') {
    errors.push('Supplier is required');
  }

  if (typeof item.jumlah !== 'number' || item.jumlah < 0) {
    errors.push('Jumlah must be a non-negative number');
  }

  if (!item.satuan || typeof item.satuan !== 'string') {
    errors.push('Satuan is required');
  }

  if (typeof item.harga !== 'number' || item.harga < 0) {
    errors.push('Harga must be a non-negative number');
  }

  if (!item.tanggal_masuk) {
    errors.push('Tanggal masuk is required');
  }

  return errors;
}