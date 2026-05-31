"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Dompet { id: string; nama: string; saldo: number; icon: string; warna: string; }
interface Transaksi {
  id: string;
  jumlah: number;
  tipe: "PEMASUKAN" | "PENGELUARAN";
  tanggal: string;
  catatan: string | null;
  kategori: { nama: string; icon: string } | null;
  dompet: { nama: string; icon: string };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dompets, setDompets] = useState<Dompet[]>([]);
  const [transaksis, setTransaksis] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [d, t] = await Promise.all([
        fetch("/api/dompet").then((r) => r.json()),
        fetch("/api/transaksi").then((r) => r.json()),
      ]);
      setDompets(Array.isArray(d) ? d : []);
      setTransaksis(Array.isArray(t) ? t : []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

  const formatTanggal = (str: string) =>
    new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const now = new Date();
  const bulanIni = transaksis.filter((t) => {
    const d = new Date(t.tanggal);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalSaldo = dompets.reduce((a, d) => a + Number(d.saldo), 0);
  const pemasukanBulanIni = bulanIni.filter((t) => t.tipe === "PEMASUKAN").reduce((a, t) => a + Number(t.jumlah), 0);
  const pengeluaranBulanIni = bulanIni.filter((t) => t.tipe === "PENGELUARAN").reduce((a, t) => a + Number(t.jumlah), 0);
  const transaksiTerbaru = transaksis.slice(0, 5);

  const namaBulan = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-20">Memuat...</p>;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          Halo, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ringkasan keuangan kamu hari ini</p>
      </div>

      {/* Total Saldo */}
      <div className="bg-[#4B0082] rounded-2xl p-6 text-white">
        <p className="text-white/60 text-sm">Total semua saldo</p>
        <p className="text-4xl font-semibold mt-2">{formatRupiah(totalSaldo)}</p>
        <p className="text-white/50 text-xs mt-2">{dompets.length} dompet aktif</p>

        {/* Dompet list mini */}
        {dompets.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {dompets.map((d) => (
              <div key={d.id} className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-base">{d.icon}</span>
                <div>
                  <p className="text-xs text-white/70">{d.nama}</p>
                  <p className="text-sm font-medium text-white">{formatRupiah(Number(d.saldo))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary bulan ini */}
      <div>
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{namaBulan}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <p className="text-xs text-green-700 dark:text-green-400 font-medium">Pemasukan</p>
            </div>
            <p className="text-lg font-semibold text-green-700 dark:text-green-400">{formatRupiah(pemasukanBulanIni)}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">Pengeluaran</p>
            </div>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">{formatRupiah(pengeluaranBulanIni)}</p>
          </div>
        </div>
      </div>

      {/* Selisih bulan ini */}
      {(pemasukanBulanIni > 0 || pengeluaranBulanIni > 0) && (
        <div className={`rounded-xl p-4 flex items-center justify-between
            ${pemasukanBulanIni >= pengeluaranBulanIni
              ? "bg-green-50 dark:bg-green-950/20"
              : "bg-red-50 dark:bg-red-950/20"}`}>
          <p className={`text-sm font-medium ${pemasukanBulanIni >= pengeluaranBulanIni ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {pemasukanBulanIni >= pengeluaranBulanIni ? "Surplus bulan ini" : "Defisit bulan ini"}
          </p>
          <p className={`text-base font-semibold ${pemasukanBulanIni >= pengeluaranBulanIni ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {formatRupiah(Math.abs(pemasukanBulanIni - pengeluaranBulanIni))}
          </p>
        </div>
      )}

      {/* Transaksi terbaru */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Transaksi terbaru</p>
          <a href="/transaksi" className="text-xs text-purple-700 dark:text-purple-400 hover:underline">Lihat semua</a>
        </div>

        {transaksiTerbaru.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transaksiTerbaru.map((t) => (
              <div key={t.id} className="bg-white dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 p-3.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base
                    ${t.tipe === "PEMASUKAN" ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"}`}>
                    {t.kategori?.icon || (t.tipe === "PEMASUKAN" ? "💰" : "💸")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {t.kategori?.nama || (t.tipe === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran")}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {t.dompet.icon} {t.dompet.nama} · {formatTanggal(t.tanggal)}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${t.tipe === "PEMASUKAN" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                  {t.tipe === "PEMASUKAN" ? "+" : "-"}{formatRupiah(Number(t.jumlah))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
