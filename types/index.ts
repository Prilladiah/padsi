export interface StokItem {
  id: string;
  nama: string;
  supplier: string;
  jumlah: number;
  satuan: string;
  harga: number;
  tanggal_masuk: string;
}

// types/index.ts
export interface LaporanItem {
  id: string;
  tanggal: string;
  nama_barang: string;
  harga_satuan: number;
  supplier: string;
  sisa_stok: number;
  satuan: string;
}

export type User = {
  role: 'manager' | 'staff';
  name?: string;
  username?: string;
};