export interface Stok {
  id_stok: number;
  nama_stok: string;
  harga_stok: string;
  jumlah_stok: number;
  satuan_stok: string;
  supplier_stok: string;
  tanggal_stok: string;
}

export interface LaporanPendapatan {
  tanggal: string;
  unit_bisnis: string;
  metode_pembayaran: string;
  sub_total: string;
}

export interface LaporanPengeluaran {
  tanggal: string;
  unit_bisnis: string;
  stok: string;
  jumlah: number;
  metode_pembayaran: string;
  sub_total: string;
}

export interface LaporanStok {
  tanggal: string;
  nama_produk: string;
  harga: string;
  supplier: string;
  sisa_stok: number;
}

export interface User {
  username: string;
  role: 'manager' | 'staff';
  nama: string;
}