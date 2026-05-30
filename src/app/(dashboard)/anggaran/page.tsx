"use client";

import { useEffect, useState } from "react";

interface Kategori { id: string; nama: string; icon: string; tipe: string; }
interface Anggaran {
  id: string;
  jumlah: number;
  bulan: number;
  tahun: number;
  realisasi: number;
  persentase: number;
  terlampaui: boolean;
  kategori: Kategori;
}

const NAMA_BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

export default function AnggaranPage() {
  const now = new Date();
  const [anggarans, setAnggarans] = useState<Anggaran[]>([]);
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Anggaran | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Anggaran | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [jumlahForm, setJumlahForm] = useState("");
  const [kategoriId, setKategoriId] = useState("");

  const fetchAnggarans = async () => {
    setLoading(true);
    const [a, k] = await Promise.all([
      fetch(`/api/anggaran?bulan=${bulan}&tahun=${tahun}`).then((r) => r.json()),
      fetch("/api/kategori").then((r) => r.json()),
    ]);
    setAnggarans(Array.isArray(a) ? a : []);
    setKategoris(Array.isArray(k) ? k : []);
    setLoading(false);
  };

  useEffect(() => { fetchAnggarans(); }, [bulan, tahun]);

  const resetForm = () => {
    setJumlahForm(""); setKategoriId("");
    setEditTarget(null); setShowForm(false); setError("");
  };

  const openEdit = (a: Anggaran) => {
    setEditTarget(a);
    setJumlahForm(String(Number(a.jumlah)));
    setKategoriId(a.kategori.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const url = editTarget ? `/api/anggaran/${editTarget.id}` : "/api/anggaran";
    const method = editTarget ? "PATCH" : "POST";
    const body = editTarget
      ? { jumlah: parseFloat(jumlahForm) }
      : { jumlah: parseFloat(jumlahForm), bulan, tahun, kategoriId };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Terjadi kesalahan");
      setSubmitting(false);
      return;
    }

    await fetchAnggarans();
    resetForm();
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/anggaran/${deleteTarget.id}`, { method: "DELETE" });
    await fetchAnggarans();
    setDeleteTarget(null);
    setDeleting(false);
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const kategoriPengeluaran = kategoris.filter((k) => k.tipe === "PENGELUARAN");
  const sudahAdaKategori = anggarans.map((a) => a.kategori.id);
  const kategoriTersedia = kategoriPengeluaran.filter((k) => !sudahAdaKategori.includes(k.id));

  const totalAnggaran = anggarans.reduce((a, b) => a + Number(b.jumlah), 0);
  const totalRealisasi = anggarans.reduce((a, b) => a + b.realisasi, 0);
  const jumlahTerlampaui = anggarans.filter((a) => a.terlampaui).length;

  const tahunOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Anggaran</h1>
          <p className="text-sm text-gray-500 mt-0.5">Atur batas pengeluaran per kategori</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          disabled={kategoriTersedia.length === 0}
          className="flex items-center gap-2 bg-[#4B0082] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#3a0066] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah
        </button>
      </div>

      {/* Pilih bulan & tahun */}
      <div className="flex gap-2 mb-6">
        <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          {NAMA_BULAN.map((n, i) => (
            <option key={i} value={i + 1}>{n}</option>
          ))}
        </select>
        <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          {tahunOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Summary */}
      {anggarans.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-xs text-purple-700 font-medium">Total Anggaran</p>
            <p className="text-base font-semibold text-purple-700 mt-1">{formatRupiah(totalAnggaran)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-700 font-medium">Terpakai</p>
            <p className="text-base font-semibold text-blue-700 mt-1">{formatRupiah(totalRealisasi)}</p>
          </div>
          <div className={`rounded-xl p-4 ${jumlahTerlampaui > 0 ? "bg-red-50" : "bg-green-50"}`}>
            <p className={`text-xs font-medium ${jumlahTerlampaui > 0 ? "text-red-600" : "text-green-700"}`}>
              Terlampaui
            </p>
            <p className={`text-base font-semibold mt-1 ${jumlahTerlampaui > 0 ? "text-red-600" : "text-green-700"}`}>
              {jumlahTerlampaui} kategori
            </p>
          </div>
        </div>
      )}

      {/* List Anggaran */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Memuat...</p>
      ) : anggarans.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm">Belum ada anggaran untuk {NAMA_BULAN[bulan - 1]} {tahun}.</p>
          {kategoriPengeluaran.length === 0 && (
            <p className="text-xs mt-2 text-amber-500">Buat kategori pengeluaran dulu di halaman Kategori.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {anggarans.map((a) => (
            <div key={a.id} className={`bg-white rounded-xl border p-4
              ${a.terlampaui ? "border-red-200" : "border-gray-100"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-lg">
                    {a.kategori.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.kategori.nama}</p>
                    <p className="text-xs text-gray-400">
                      {formatRupiah(a.realisasi)} / {formatRupiah(Number(a.jumlah))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {a.terlampaui && (
                    <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium mr-1">
                      Terlampaui
                    </span>
                  )}
                  <button onClick={() => openEdit(a)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleteTarget(a)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${a.terlampaui ? "bg-red-500" : a.persentase >= 80 ? "bg-amber-400" : "bg-[#4B0082]"}`}
                  style={{ width: `${a.persentase}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <p className="text-xs text-gray-400">{a.persentase}% terpakai</p>
                <p className={`text-xs font-medium ${a.terlampaui ? "text-red-500" : "text-gray-500"}`}>
                  {a.terlampaui
                    ? `Lebih ${formatRupiah(a.realisasi - Number(a.jumlah))}`
                    : `Sisa ${formatRupiah(Number(a.jumlah) - a.realisasi)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">
                {editTarget ? "Edit Anggaran" : "Tambah Anggaran"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              {!editTarget && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                  <select value={kategoriId} onChange={(e) => setKategoriId(e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Pilih kategori</option>
                    {kategoriTersedia.map((k) => (
                      <option key={k.id} value={k.id}>{k.icon} {k.nama}</option>
                    ))}
                  </select>
                </div>
              )}

              {editTarget && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                  <span className="text-xl">{editTarget.kategori.icon}</span>
                  <p className="text-sm font-medium text-gray-700">{editTarget.kategori.nama}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Batas Anggaran untuk {NAMA_BULAN[bulan - 1]} {tahun}
                </label>
                <input type="number" value={jumlahForm} onChange={(e) => setJumlahForm(e.target.value)}
                  placeholder="0" min="1" required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-[#4B0082] text-white font-medium py-2.5 rounded-lg text-sm hover:bg-[#3a0066] transition disabled:opacity-50">
                {submitting ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Tambah Anggaran"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 text-center mb-1">Hapus Anggaran?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Anggaran <span className="font-medium text-gray-700">{deleteTarget.kategori.nama}</span> untuk {NAMA_BULAN[deleteTarget.bulan - 1]} {deleteTarget.tahun} akan dihapus.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50 transition">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-500 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50">
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}