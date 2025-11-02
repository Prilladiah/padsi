// types/index.ts
export interface User {
  name: string;
  role: 'manager' | 'staff';
}

export interface StokItem {
  id: string;
  nama: string;
  kategori: string;
  jumlah: number;
  satuan: string;
  harga: number;
  tanggal_masuk: string;
}