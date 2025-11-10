import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Cek data dari tabel stok (yang kita tahu ada)
    const stokData = await query('SELECT * FROM stok LIMIT 5');
    
    // Cek data dari semua tabel yang mungkin berisi laporan
    const tableNames = ['laporan', 'lapscan', 'lap', 'report', 'reports', 'lapor', 'laporans'];
    
    let tableResults: any = {};
    
    for (const tableName of tableNames) {
      try {
        const result = await query(`SELECT * FROM ${tableName} LIMIT 2`);
        tableResults[tableName] = {
          exists: true,
          data: result.rows
        };
      } catch (error) {
        tableResults[tableName] = {
          exists: false,
          error: (error as Error).message
        };
      }
    }

    return NextResponse.json({
      success: true,
      stokSample: stokData.rows,
      tableCheck: tableResults
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}