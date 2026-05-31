"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

interface BulanData { bulan: string; pemasukan: number; pengeluaran: number; }
interface KategoriData { nama: string; total: number; }
interface TransaksiRow {
  tanggal: string; tipe: string; kategori: string;
  dompet: string; jumlah: number; catatan: string;
}

const WARNA_PIE = ["#4B0082", "#7C3AED", "#2563EB", "#059669", "#D97706"];
const NAMA_BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const formatSingkat = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
};

export default function LaporanPage() {
  const now = new Date();
  const [bulanan, setBulanan] = useState<BulanData[]>([]);
  const [topKategori, setTopKategori] = useState<KategoriData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [exportBulan, setExportBulan] = useState(now.getMonth() + 1);
  const [exportTahun, setExportTahun] = useState(now.getFullYear());
  const [exporting, setExporting] = useState(false);

  const tahunOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

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

  const fetchExportData = async () => {
    const res = await fetch(`/api/laporan/export?bulan=${exportBulan}&tahun=${exportTahun}`);
    return await res.json();
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const data = await fetchExportData();
      const { rows, summary, periode } = data;

      const header = ["Tanggal", "Tipe", "Kategori", "Dompet", "Jumlah", "Catatan"];
      const csvRows = [
        `Laporan Keuangan - ${NAMA_BULAN[periode.bulan - 1]} ${periode.tahun}`,
        "",
        header.join(","),
        ...rows.map((r: TransaksiRow) =>
          [r.tanggal, r.tipe, r.kategori, r.dompet, r.jumlah, `"${r.catatan}"`].join(",")
        ),
        "",
        `Total Pemasukan,${summary.totalPemasukan}`,
        `Total Pengeluaran,${summary.totalPengeluaran}`,
        `Selisih,${summary.selisih}`,
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-${NAMA_BULAN[periode.bulan - 1].toLowerCase()}-${periode.tahun}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const data = await fetchExportData();
      const { rows, summary, periode } = data;

      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const namaBulan = NAMA_BULAN[periode.bulan - 1];

      // Header
      doc.setFillColor(75, 0, 130);
      doc.rect(0, 0, 210, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Keuanganku", 14, 13);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Laporan Keuangan — ${namaBulan} ${periode.tahun}`, 14, 22);

      // Summary boxes
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);

      const boxes = [
        { label: "Pemasukan", value: formatRupiah(summary.totalPemasukan), color: [5, 150, 105] as [number, number, number] },
        { label: "Pengeluaran", value: formatRupiah(summary.totalPengeluaran), color: [220, 38, 38] as [number, number, number] },
        { label: summary.selisih >= 0 ? "Surplus" : "Defisit", value: formatRupiah(Math.abs(summary.selisih)), color: [75, 0, 130] as [number, number, number] },
      ];

      boxes.forEach((box, i) => {
        const x = 14 + i * 62;
        doc.setFillColor(...box.color);
        doc.roundedRect(x, 36, 58, 20, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(box.label, x + 4, 44);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(box.value, x + 4, 51);
        doc.setFont("helvetica", "normal");
      });

      // Tabel transaksi
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Detail Transaksi", 14, 68);

      autoTable(doc, {
        startY: 72,
        head: [["Tanggal", "Tipe", "Kategori", "Dompet", "Jumlah", "Catatan"]],
        body: rows.map((r: TransaksiRow) => [
          r.tanggal,
          r.tipe === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran",
          r.kategori,
          r.dompet,
          formatRupiah(r.jumlah),
          r.catatan,
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [75, 0, 130], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 245, 255] },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 24 },
          2: { cellWidth: 28 },
          3: { cellWidth: 28 },
          4: { cellWidth: 32 },
          5: { cellWidth: "auto" },
        },
        didParseCell: (hookData) => {
          if (hookData.column.index === 1 && hookData.section === "body") {
            const val = hookData.cell.raw as string;
            hookData.cell.styles.textColor =
              val === "Pemasukan" ? [5, 150, 105] : [220, 38, 38];
          }
        },
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Keuanganku — Digenerate pada ${new Date().toLocaleDateString("id-ID")} — Halaman ${i} dari ${pageCount}`,
          14,
          doc.internal.pageSize.height - 8
        );
      }

      doc.save(`laporan-${namaBulan.toLowerCase()}-${periode.tahun}.pdf`);
    } finally {
      setExporting(false);
    }
  };

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

      {/* Export Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Export Laporan</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Bulan</label>
            <select value={exportBulan} onChange={(e) => setExportBulan(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              {NAMA_BULAN.map((n, i) => (
                <option key={i} value={i + 1}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Tahun</label>
            <select value={exportTahun} onChange={(e) => setExportTahun(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              {tahunOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} disabled={exporting}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? "..." : "CSV"}
            </button>
            <button onClick={exportPDF} disabled={exporting}
              className="flex items-center gap-2 bg-[#4B0082] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#3a0066] transition disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? "..." : "PDF"}
            </button>
          </div>
        </div>
      </div>

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

      {/* Top Kategori */}
      {topKategori.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-5">Top Pengeluaran Bulan Ini</p>
          <div className="flex flex-col lg:flex-row gap-6 items-center">
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