import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Helper functions
const normalizeMetodePembayaran = (metode: string): string => {
  if (!metode) return 'Lainnya';
  
  const metodeStr = String(metode).trim().toLowerCase();
  
  if (metodeStr === '0815' || metodeStr === 'qris' || metodeStr === 'qris code') {
    return 'QRIS';
  }
  if (metodeStr === 'cash' || metodeStr === 'tunai') {
    return 'Tunai';
  }
  if (metodeStr === 'transfer' || metodeStr === 'bank transfer') {
    return 'Transfer';
  }
  
  // Capitalize first letter
  return metodeStr.charAt(0).toUpperCase() + metodeStr.slice(1);
};

const normalizeUnitBisnis = (unit: string): string => {
  if (!unit) return 'Unknown';
  
  const unitStr = String(unit).trim().toLowerCase();
  
  if (unitStr === 'badminton' || unitStr === 'badminton court') {
    return 'Badminton';
  }
  // Add more normalizations as needed
  
  return unitStr.charAt(0).toUpperCase() + unitStr.slice(1);
};

const parseDate = (dateStr: any): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

// GET - untuk mengambil SEMUA data
export async function GET(request: NextRequest) {
  console.log("🚀 GET /api/laporan/pendapatan - FETCH ALL DATA");
  
  try {
    // Test connection
    try {
      await query("SELECT 1 as test", []);
      console.log("✅ Database connection OK");
    } catch (dbError: any) {
      console.error("❌ Database connection failed:", dbError.message);
      
      // Fallback data untuk development
      const fallbackData = Array.from({ length: 10 }, (_, i) => ({
        tanggal: `2024-0${Math.floor(i/3) + 1}-${(i % 30) + 1}`.replace(/-(\d)$/, '-0$1'),
        unit_bisnis: 'Badminton',
        metode_pembayaran: ['QRIS', 'Tunai', 'Transfer'][i % 3],
        subtotal_pendapatan: 120000,
        created_at: new Date().toISOString()
      }));
      
      return NextResponse.json({
        success: true,
        data: fallbackData,
        total: 1200000,
        pagination: {
          total: 10,
          page: 1,
          limit: 100,
          totalPages: 1
        }
      });
    }

    // Ambil SEMUA data tanpa pagination untuk sinkronisasi penuh
    const dataQuery = `
      SELECT 
        tanggal,
        unit_bisnis as unit_bisnis,
        metode_pembayaran,
        subtotal_pendapatan,
        created_at
      FROM pendapatan 
      ORDER BY tanggal DESC
    `;
    
    console.log("📋 Executing query for ALL data...");
    
    const dataResult = await query(dataQuery, []);
    
    console.log(`✅ Found ${dataResult.rows.length} rows in database`);
    
    // Normalize semua data
    const normalizedData = dataResult.rows.map((row: any, index: number) => {
      const metode = normalizeMetodePembayaran(row.metode_pembayaran);
      const unit = normalizeUnitBisnis(row.unit_bisnis || row.unit_bisnis);
      
      return {
        tanggal: parseDate(row.tanggal),
        target_date: parseDate(row.tanggal),
        unit_bisnis: unit,
        metode_pembayaran: metode,
        subtotal_pendapatan: parseFloat(row.subtotal_pendapatan) || 0,
        created_at: row.created_at || new Date().toISOString(),
        _id: index + 1 // ID sementara untuk key React
      };
    });
    
    // Hitung total
    const totalPendapatan = normalizedData.reduce(
      (sum, row) => sum + row.subtotal_pendapatan, 
      0
    );
    
    console.log(`📊 Data summary: ${normalizedData.length} rows, Total: Rp ${totalPendapatan.toLocaleString()}`);
    
    return NextResponse.json({
      success: true,
      data: normalizedData,
      total: totalPendapatan,
      pagination: {
        total: normalizedData.length,
        page: 1,
        limit: normalizedData.length,
        totalPages: 1
      },
      summary: {
        totalRecords: normalizedData.length,
        totalRevenue: totalPendapatan,
        byPaymentMethod: normalizedData.reduce((acc, row) => {
          acc[row.metode_pembayaran] = (acc[row.metode_pembayaran] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
    
  } catch (error: any) {
    console.error("❌ GET endpoint error:", error.message);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch data",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST - untuk upload Excel
export async function POST(request: NextRequest) {
  console.log("📥 POST /api/laporan/pendapatan - UPLOAD");
  
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: "Tidak ada file yang diupload"
      }, { status: 400 });
    }
    
    console.log("📁 Processing file:", file.name, `(${file.size} bytes)`);
    
    // Parse Excel
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
    
    console.log(`📊 Found ${rows.length} rows in file`);
    
    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "File Excel kosong"
      }, { status: 400 });
    }
    
    // Log first few rows
    console.log("🔍 Sample data (first 3 rows):");
    rows.slice(0, 3).forEach((row, i) => {
      console.log(`  Row ${i + 1}:`, row);
    });
    
    // Process data
    let imported = 0;
    let updated = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Extract dengan berbagai kemungkinan nama kolom
        const tanggalRaw = row.tanggal || row.Tanggal || row.TANGGAL || row.date || row.Date || row.DATE;
        const subtotalRaw = row.subtotal_pendapatan || row.subtotal || row.Subtotal || row.SUBTOTAL || 
                          row.pendapatan || row.Pendapatan || row.PENDAPATAN || row.amount || row.Amount;
        const metodeRaw = row.metode_pembayaran || row.metode || row.Metode || row.METODE || 
                         row.pembayaran || row.Pembayaran || row.PEMBAYARAN || 
                         row.payment || row.Payment || row.PAYMENT;
        const unitRaw = row.unit_bisnis || row.unit || row.Unit || row.UNIT || 
                       row.unit_bisnis || row.bisnis || row.Bisnis || row.BISNIS ||
                       row.business || row.Business || row.BUSINESS;
        
        // Validate
        if (!tanggalRaw || subtotalRaw === undefined || !metodeRaw || !unitRaw) {
          errors.push(`Baris ${i + 1}: Kolom tidak lengkap`);
          continue;
        }
        
        // Parse tanggal
        const tanggal = parseDate(tanggalRaw);
        
        // Parse subtotal
        let subtotal: number;
        try {
          if (typeof subtotalRaw === 'string') {
            const cleaned = subtotalRaw
              .replace(/[^\d.,-]/g, '')
              .replace(/\./g, '')
              .replace(',', '.');
            subtotal = parseFloat(cleaned);
          } else {
            subtotal = Number(subtotalRaw);
          }
          
          if (isNaN(subtotal) || subtotal <= 0) {
            errors.push(`Baris ${i + 1}: Jumlah tidak valid: ${subtotalRaw}`);
            continue;
          }
        } catch {
          errors.push(`Baris ${i + 1}: Format jumlah tidak valid: ${subtotalRaw}`);
          continue;
        }
        
        // Normalize
        const unit_bisnis = normalizeUnitBisnis(unitRaw);
        const metode_pembayaran = normalizeMetodePembayaran(metodeRaw);
        
        // Insert/Update ke database
        const result = await query(
          `INSERT INTO pendapatan (tanggal, unit_bisnis, metode_pembayaran, subtotal_pendapatan)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (tanggal, unit_bisnis, metode_pembayaran) 
           DO UPDATE SET 
             subtotal_pendapatan = EXCLUDED.subtotal_pendapatan,
             created_at = CURRENT_TIMESTAMP
           RETURNING (xmax = 0) as inserted`,
          [tanggal, unit_bisnis, metode_pembayaran, subtotal]
        );
        
        if (result.rows[0]?.inserted) {
          imported++;
        } else {
          updated++;
        }
        
      } catch (rowError: any) {
        console.error(`❌ Error processing row ${i + 1}:`, rowError.message);
        errors.push(`Baris ${i + 1}: ${rowError.message}`);
      }
    }
    
    console.log(`✅ Upload result: ${imported} new, ${updated} updated, ${errors.length} errors`);
    
    return NextResponse.json({
      success: true,
      data: {
        imported,
        updated,
        totalRows: rows.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        errorCount: errors.length
      },
      message: `Berhasil memproses ${rows.length} data (${imported} baru, ${updated} diperbarui)`
    });
    
  } catch (error: any) {
    console.error("❌ POST endpoint error:", error.message);
    
    return NextResponse.json({
      success: false,
      error: "Upload failed",
      details: error.message
    }, { status: 500 });
  }
}