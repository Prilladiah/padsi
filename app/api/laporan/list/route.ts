import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('📄 API list dipanggil');

  const dummyData = [
    {
      tanggal: "2024-01-15",
      unit_bisnis: "Toko A",
      metode_pembayaran: "Tunai",
      subtotal_pendapatan: 1500000,
    },
    {
      tanggal: "2024-01-16",
      unit_bisnis: "Toko B",
      metode_pembayaran: "Qris",
      subtotal_pendapatan: 2500000,
    },
    {
      tanggal: "2024-01-17",
      unit_bisnis: "Toko C",
      metode_pembayaran: "Transfer",
      subtotal_pendapatan: 3200000,
    }
  ];

  return NextResponse.json({
    success: true,
    data: dummyData,
  });
}
