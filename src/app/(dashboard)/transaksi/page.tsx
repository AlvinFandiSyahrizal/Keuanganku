"use client";

import { useEffect, useState, useMemo } from "react";

interface Dompet { id: string; nama: string; icon: string; }
interface Kategori { id: string; nama: string; icon: string; tipe: string; }
interface Transaksi {
  id: string;
  jumlah: number;
  catatan: string | null;
  tanggal: string;
  tipe: "PEMASUKAN" | "PENGELUARAN";
  dompet: Dompet;
  dompetId: string;
  kategori: Kategori | null;
  kategoriId: string | null;
}

export default function TransaksiPage() {
  const [transaksis, setTransaksis] = useState<Transaksi[]>([]);
  const [dompets, setDompets] = useState<Dompet[]>([]);
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaksi | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaksi | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [tipe, setTipe] = useState<"PEMASUKAN" | "PENGELUARAN">("PENGELUARAN");
  const [jumlah, setJumlah] = useState("");
  const [catatan, setCatatan] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [dompetId, setDompetId] = useState("");
  const [kategoriId, setKategoriId] = useState("");

  // Filter state
  const [filterTipe, setFilterTipe] = useState<"SEMUA" | "PEMASUKAN" | "PENGELUARAN">("SEMUA");
  const [filterDompet, setFilterDompet] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterDari, setFilterDari] = useState("");
  const [filterSampai, setFilterSampai] = useState("");

  const fetchAll = async () => {
    const [t, d, k] = await Promise.all([
      fetch("/api/transaksi").then((r) => r.json()),
      fetch("/api/dompet").then((r) => r.json()),
      fetch("/api/kategori").then((r) => r.json()),
    ]);
    setTransaksis(Array.isArray(t) ? t : []);
    setDompets(Array.isArray(d) ? d : []);
    setKategoris(Array.isArray(k) ? k : []);
    if (d.length > 0) setDompetId(d[0].id);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setJumlah(""); setCatatan(""); setTipe("PENGELUARAN");
    setTanggal(new Date().toISOString().split("T")[0]);
    setKategoriId(""); setShowForm(false); setError("");
    setEditTarget(null);
    if (dompets.length > 0) setDompetId(dompets[0].id);
  };

  const resetFilter = () => {
    setFilterTipe("SEMUA"); setFilterDompet("");
    setFilterKategori(""); setFilterDari(""); setFilterSampai("");
  };

  const openEdit = (t: Transaksi) => {
    setEditTarget(t);
    setTipe(t.tipe);
    setJumlah(String(Number(t.jumlah)));
    setCatatan(t.catatan || "");
    setTanggal(new Date(t.tanggal).toISOString().split("T")[0]);
    setDompetId(t.dompetId);
    setKategoriId(t.kategoriId || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const url = editTarget ? `/api/transaksi/${editTarget.id}` : "/api/transaksi";
    const method = editTarget ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jumlah: parseFloat(jumlah), catatan, tanggal, tipe,
        dompetId, kategoriId: kategoriId || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Terjadi kesalahan");
      setSubmitting(false);
      return;
    }

    await fetchAll();
    resetForm();
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/transaksi/${deleteTarget.id}`, { method: "DELETE" });
    await fetchAll();
    setDeleteTarget(null);
    setDeleting(false);
  };

  // Filter logic
  const filtered = useMemo(() => {
    return transaksis.filter((t) => {
      if (filterTipe !== "SEMUA" && t.tipe !== filterTipe) return false;
      if (filterDompet && t.dompetId !== filterDompet) return false;
      if (filterKategori && t.kategoriId !== filterKategori) return false;
      if (filterDari && new Date(t.tanggal) < new Date(filterDari)) return false;
      if (filterSampai && new Date(t.tanggal) > new Date(filterSampai + "T23:59:59")) return false;
      return true;
    });
  }, [transaksis, filterTipe, filterDompet, filterKategori, filterDari, filterSampai]);

  const isFiltered = filterTipe !== "SEMUA" || filterDompet || filterKategori || filterDari || filterSampai;

  const totalPemasukan = filtered.filter((t) => t.tipe === "PEMASUKAN").reduce((a, t) => a + Number(t.jumlah), 0);
  const totalPengeluaran = filtered.filter((t) => t.tipe === "PENGELUARAN").reduce((a, t) => a + Number(t.jumlah), 0);
  const filteredKategoriForm = kategoris.filter((k) => k.tipe === tipe);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

  const formatTanggal = (str: string) =>
    new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Transaksi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Catat pemasukan & pengeluaran kamu</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition
              ${isFiltered
                ? "bg-purple-50 border-purple-300 text-purple-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filter {isFiltered && <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />}
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-[#4B0082] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#3a0066] transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah
          </button>
        </div>
      </div>

      {/* Panel Filter */}
      {showFilter && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Filter Transaksi</p>
            {isFiltered && (
              <button onClick={resetFilter}
                className="text-xs text-red-500 hover:underline">Reset filter</button>
            )}
          </div>

          {/* Tipe */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipe</label>
            <div className="flex gap-2">
              {(["SEMUA", "PEMASUKAN", "PENGELUARAN"] as const).map((t) => (
                <button key={t} onClick={() => setFilterTipe(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                    ${filterTipe === t
                      ? "bg-[#4B0082] text-white border-[#4B0082]"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                  {t === "SEMUA" ? "Semua" : t === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Dompet */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Dompet</label>
              <select value={filterDompet} onChange={(e) => setFilterDompet(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Semua dompet</option>
                {dompets.map((d) => (
                  <option key={d.id} value={d.id}>{d.icon} {d.nama}</option>
                ))}
              </select>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Kategori</label>
              <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Semua kategori</option>
                {kategoris.map((k) => (
                  <option key={k.id} value={k.id}>{k.icon} {k.nama}</option>
                ))}
              </select>
            </div>

            {/* Dari */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Dari tanggal</label>
              <input type="date" value={filterDari} onChange={(e) => setFilterDari(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>

            {/* Sampai */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Sampai tanggal</label>
              <input type="date" value={filterSampai} onChange={(e) => setFilterSampai(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-700 font-medium">
            {isFiltered ? "Pemasukan (filter)" : "Total Pemasukan"}
          </p>
          <p className="text-lg font-semibold text-green-700 mt-1">{formatRupiah(totalPemasukan)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs text-red-700 font-medium">
            {isFiltered ? "Pengeluaran (filter)" : "Total Pengeluaran"}
          </p>
          <p className="text-lg font-semibold text-red-700 mt-1">{formatRupiah(totalPengeluaran)}</p>
        </div>
      </div>

      {/* Jumlah hasil filter */}
      {isFiltered && (
        <p className="text-xs text-gray-400 mb-3">
          Menampilkan <span className="font-medium text-gray-600">{filtered.length}</span> dari {transaksis.length} transaksi
        </p>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Memuat...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">{isFiltered ? "🔍" : "📋"}</p>
          <p className="text-sm">{isFiltered ? "Tidak ada transaksi yang sesuai filter." : "Belum ada transaksi."}</p>
          {isFiltered && (
            <button onClick={resetFilter} className="text-xs text-purple-600 mt-2 hover:underline">Reset filter</button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                  ${t.tipe === "PEMASUKAN" ? "bg-green-50" : "bg-red-50"}`}>
                  {t.kategori?.icon || (t.tipe === "PEMASUKAN" ? "💰" : "💸")}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {t.kategori?.nama || (t.tipe === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran")}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.dompet.icon} {t.dompet.nama} · {formatTanggal(t.tanggal)}
                  </p>
                  {t.catatan && <p className="text-xs text-gray-400">{t.catatan}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <p className={`text-sm font-semibold mr-1 ${t.tipe === "PEMASUKAN" ? "text-green-600" : "text-red-500"}`}>
                  {t.tipe === "PEMASUKAN" ? "+" : "-"}{formatRupiah(Number(t.jumlah))}
                </p>
                <button onClick={() => openEdit(t)}
                  className="p-1.5 rounded-lg text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => setDeleteTarget(t)}
                  className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-400 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Tambah/Edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">
                {editTarget ? "Edit Transaksi" : "Tambah Transaksi"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex rounded-lg border border-gray-200 p-1 gap-1">
                {(["PENGELUARAN", "PEMASUKAN"] as const).map((tp) => (
                  <button key={tp} type="button" onClick={() => { setTipe(tp); setKategoriId(""); }}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition
                      ${tipe === tp
                        ? tp === "PEMASUKAN" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        : "text-gray-500 hover:bg-gray-50"}`}>
                    {tp === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran"}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah</label>
                <input type="number" value={jumlah} onChange={(e) => setJumlah(e.target.value)}
                  placeholder="0" min="0" required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dompet</label>
                <select value={dompetId} onChange={(e) => setDompetId(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {dompets.map((d) => (
                    <option key={d.id} value={d.id}>{d.icon} {d.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kategori <span className="text-gray-400">(opsional)</span>
                </label>
                <select value={kategoriId} onChange={(e) => setKategoriId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Tanpa kategori</option>
                  {filteredKategoriForm.map((k) => (
                    <option key={k.id} value={k.id}>{k.icon} {k.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Catatan <span className="text-gray-400">(opsional)</span>
                </label>
                <input type="text" value={catatan} onChange={(e) => setCatatan(e.target.value)}
                  placeholder="cth: makan siang, gaji, dll"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-[#4B0082] text-white font-medium py-2.5 rounded-lg text-sm hover:bg-[#3a0066] transition disabled:opacity-50">
                {submitting ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Simpan Transaksi"}
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
            <h3 className="font-semibold text-gray-800 text-center mb-1">Hapus Transaksi?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Saldo dompet <span className="font-medium text-gray-700">{deleteTarget.dompet.nama}</span> akan dikembalikan otomatis.
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