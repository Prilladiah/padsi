import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "File tidak ditemukan" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      return NextResponse.json({ success: false, error: "Sheet Excel kosong" }, { status: 400 });
    }

    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Data Excel kosong" }, { status: 400 });
    }

    console.log("📋 Headers dari Excel:");
    if (rows[0]) console.log(Object.keys(rows[0])); // tampilkan semua kolom dari Excel

    let imported = 0;

    for (const r of rows) {
      console.log("🔹 Row Excel:", r); // tampilkan semua row

      const tanggalRaw = r['tanggal'] ?? r['Tanggal'] ?? r['TANGGAL'] ?? r['Target Date']?.toString().trim();
      const unit_bisnis = r['unit_bisnis'] ?? r['Unit_Bisnis'] ?? r['Unit Bisnis']?.toString().trim();
      const metode_pembayaran = r['metode_pembayaran'] ?? r['Metode_Pembayaran'] ?? r['Metode Pembayaran']?.toString().trim();
      const subtotal_pendapatan = Number(
        r['subtotal_pendapatan'] ?? r['Subtotal_Pendapatan'] ?? r['total'] ?? r['Total'] ?? 0
      );

      if (!tanggalRaw || !unit_bisnis || !metode_pembayaran || isNaN(subtotal_pendapatan)) {
        console.warn("⚠️ Row dilewati (tidak valid):", r);
        continue;
      }

      const tanggal = new Date(tanggalRaw).toISOString().split("T")[0];

      try {
        await query(
          `INSERT INTO pendapatan (tanggal, unit_bisnis, metode_pembayaran, subtotal_pendapatan)
           VALUES ($1, $2, $3, $4)`,
          [tanggal, unit_bisnis, metode_pembayaran, subtotal_pendapatan]
        );
        imported++;
      } catch (dbErr) {
        console.error("❌ Gagal insert row:", r, dbErr);
      }
    }

    console.log("✅ Imported rows:", imported);
    return NextResponse.json({ success: true, data: { imported } });
  } catch (err: any) {
    console.error("❌ ERROR Upload:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Terjadi kesalahan di server" },
      { status: 500 }
    );
  }
}
