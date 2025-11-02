'use client';

import { useRouter } from 'next/navigation';

export default function HapusStok() {
  const router = useRouter();

  const handleDelete = () => {
    if (window.confirm('Yakin hapus?')) {
      // hapus data
      router.push('/dashboard/stok');
    }
  };

  return (
    <button onClick={handleDelete}>Hapus</button>
  );
}