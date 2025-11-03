export interface StokItem {
  id: string;
  nama: string;
  supplier: string;
  jumlah: number;
  satuan: string;
  harga: number;
  tanggal_masuk: string;
}

export interface LaporanItem {
  id: string;
  stok_id: string;
  nama_barang: string;
  supplier: string;
  jumlah_masuk: number;
  jumlah_keluar: number;
  sisa_stok: number;
  satuan: string;
  harga_satuan: number;
  total_nilai: number;
  tanggal: string;
  jenis_transaksi: 'masuk' | 'keluar';
  keterangan?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'staff';
}

