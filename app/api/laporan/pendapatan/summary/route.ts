import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("📊 Summary endpoint dipanggil");

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const data = [
      { tanggal: "2024-01-15", unit_bisnis: "Toko A", metode_pembayaran: "Tunai", subtotal_pendapatan: 1500000 },
      { tanggal: "2024-01-16", unit_bisnis: "Toko B", metode_pembayaran: "Qris", subtotal_pendapatan: 2500000 },
      { tanggal: "2024-01-17", unit_bisnis: "Toko C", metode_pembayaran: "Transfer", subtotal_pendapatan: 3200000 },
    ];

    let filtered = data;
    if (startDate) filtered = filtered.filter(x => x.tanggal >= startDate);
    if (endDate) filtered = filtered.filter(x => x.tanggal <= endDate);

    const totalPendapatan = filtered.reduce(
      (sum, row) => sum + row.subtotal_pendapatan,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        totalPendapatan,
        totalTransactions: filtered.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Summary gagal" },
      { status: 500 }
    );
  }
}
