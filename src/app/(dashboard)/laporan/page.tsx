"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

interface BulanData { bulan: string; pemasukan: number; pengeluaran: number; }
interface KategoriData { nama: string; total: number; }

const WARNA_PIE = ["#4B0082", "#7C3AED", "#2563EB", "#059669", "#D97706"];

const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

const formatSingkat = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
};

export default function LaporanPage() {
  const [bulanan, setBulanan] = useState<BulanData[]>([]);
  const [topKategori, setTopKategori] = useState<KategoriData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  useEffect(() => {
    fetch("/api/transaksi/summary")
      .then((r) => r.json())
      .then((data) => {
        setBulanan(data.bulanan || []);
        setTopKategori(data.topKategori || []);
        setLoading(false);
      });
  }, []);

  const bulanIni = bulanan[bulanan.length - 1];
  const selisih = bulanIni ? bulanIni.pemasukan - bulanIni.pengeluaran : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm text-xs">
        <p className="font-medium text-gray-700 mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name === "pemasukan" ? "Pemasukan" : "Pengeluaran"}: {formatRupiah(p.value)}
          </p>
        ))}
      </div>
    );
  };

  if (loading) return <p className="text-sm text-gray-400 text-center py-20">Memuat...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Laporan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan keuangan 6 bulan terakhir</p>
      </div>

      {/* Summary bulan ini */}
      {bulanIni && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-green-700 font-medium">Pemasukan</p>
            <p className="text-base font-semibold text-green-700 mt-1">{formatRupiah(bulanIni.pemasukan)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-xs text-red-600 font-medium">Pengeluaran</p>
            <p className="text-base font-semibold text-red-600 mt-1">{formatRupiah(bulanIni.pengeluaran)}</p>
          </div>
          <div className={`rounded-xl p-4 ${selisih >= 0 ? "bg-purple-50" : "bg-orange-50"}`}>
            <p className={`text-xs font-medium ${selisih >= 0 ? "text-purple-700" : "text-orange-600"}`}>
              {selisih >= 0 ? "Surplus" : "Defisit"}
            </p>
            <p className={`text-base font-semibold mt-1 ${selisih >= 0 ? "text-purple-700" : "text-orange-600"}`}>
              {formatRupiah(Math.abs(selisih))}
            </p>
          </div>
        </div>
      )}

      {/* Grafik Bulanan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-gray-700">Pemasukan vs Pengeluaran</p>
          <div className="flex gap-1 border border-gray-200 rounded-lg p-0.5">
            <button onClick={() => setChartType("bar")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition
                ${chartType === "bar" ? "bg-[#4B0082] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              Bar
            </button>
            <button onClick={() => setChartType("line")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition
                ${chartType === "line" ? "bg-[#4B0082] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              Line
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          {chartType === "bar" ? (
            <BarChart data={bulanan} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatSingkat} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pemasukan" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pengeluaran" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={bulanan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatSingkat} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="pemasukan" stroke="#059669" strokeWidth={2} dot={{ r: 4, fill: "#059669" }} />
              <Line type="monotone" dataKey="pengeluaran" stroke="#DC2626" strokeWidth={2} dot={{ r: 4, fill: "#DC2626" }} />
            </LineChart>
          )}
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex gap-4 justify-center mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span className="text-xs text-gray-500">Pemasukan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-xs text-gray-500">Pengeluaran</span>
          </div>
        </div>
      </div>

      {/* Top Kategori Pengeluaran */}
      {topKategori.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-5">Top Pengeluaran Bulan Ini</p>
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Pie Chart */}
            <div className="w-full lg:w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={topKategori} dataKey="total" nameKey="nama"
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {topKategori.map((_, i) => (
                      <Cell key={i} fill={WARNA_PIE[i % WARNA_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatRupiah(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* List */}
            <div className="w-full lg:w-1/2 space-y-3">
              {topKategori.map((k, i) => {
                const total = topKategori.reduce((a, b) => a + b.total, 0);
                const persen = total > 0 ? Math.round((k.total / total) * 100) : 0;
                return (
                  <div key={k.nama}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: WARNA_PIE[i % WARNA_PIE.length] }} />
                        <span className="text-xs text-gray-700">{k.nama}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{persen}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${persen}%`, backgroundColor: WARNA_PIE[i % WARNA_PIE.length] }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 text-right">{formatRupiah(k.total)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tabel detail per bulan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Detail per Bulan</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-medium pb-3">Bulan</th>
                <th className="text-right text-xs text-gray-400 font-medium pb-3">Pemasukan</th>
                <th className="text-right text-xs text-gray-400 font-medium pb-3">Pengeluaran</th>
                <th className="text-right text-xs text-gray-400 font-medium pb-3">Selisih</th>
              </tr>
            </thead>
            <tbody>
              {[...bulanan].reverse().map((b) => {
                const s = b.pemasukan - b.pengeluaran;
                return (
                  <tr key={b.bulan} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-gray-700 font-medium">{b.bulan}</td>
                    <td className="py-3 text-right text-green-600">{formatRupiah(b.pemasukan)}</td>
                    <td className="py-3 text-right text-red-500">{formatRupiah(b.pengeluaran)}</td>
                    <td className={`py-3 text-right font-medium ${s >= 0 ? "text-purple-700" : "text-orange-500"}`}>
                      {s >= 0 ? "+" : ""}{formatRupiah(s)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}