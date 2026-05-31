"use client";

import { useEffect, useState } from "react";

interface Hutang {
  id: string;
  nama: string;
  jumlah: number;
  sudahDibayar: number;
  jatuhTempo: string | null;
  tipe: "HUTANG" | "PIUTANG";
  catatan: string | null;
}

export default function HutangPage() {
  const [hutangs, setHutangs] = useState<Hutang[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"HUTANG" | "PIUTANG">("HUTANG");
  const [showForm, setShowForm] = useState(false);
  const [showBayar, setShowBayar] = useState(false);
  const [editTarget, setEditTarget] = useState<Hutang | null>(null);
  const [bayarTarget, setBayarTarget] = useState<Hutang | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Hutang | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [nama, setNama] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [sudahDibayar, setSudahDibayar] = useState("");
  const [jatuhTempo, setJatuhTempo] = useState("");
  const [tipe, setTipe] = useState<"HUTANG" | "PIUTANG">("HUTANG");
  const [catatan, setCatatan] = useState("");
  const [jumlahBayar, setJumlahBayar] = useState("");

  const fetchHutangs = async () => {
    const res = await fetch("/api/hutang");
    const data = await res.json();
    setHutangs(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchHutangs(); }, []);

  const resetForm = () => {
    setNama(""); setJumlah(""); setSudahDibayar("");
    setJatuhTempo(""); setCatatan(""); setTipe(activeTab);
    setEditTarget(null); setShowForm(false); setError("");
  };

  const resetBayar = () => {
    setJumlahBayar(""); setBayarTarget(null); setShowBayar(false); setError("");
  };

  const openEdit = (h: Hutang) => {
    setEditTarget(h);
    setNama(h.nama);
    setJumlah(String(Number(h.jumlah)));
    setSudahDibayar(String(Number(h.sudahDibayar)));
    setJatuhTempo(h.jatuhTempo ? new Date(h.jatuhTempo).toISOString().split("T")[0] : "");
    setTipe(h.tipe);
    setCatatan(h.catatan || "");
    setShowForm(true);
  };

  const openBayar = (h: Hutang) => {
    setBayarTarget(h);
    setJumlahBayar("");
    setShowBayar(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const url = editTarget ? `/api/hutang/${editTarget.id}` : "/api/hutang";
    const method = editTarget ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama,
        jumlah: parseFloat(jumlah),
        sudahDibayar: parseFloat(sudahDibayar) || 0,
        jatuhTempo: jatuhTempo || null,
        tipe,
        catatan: catatan || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Terjadi kesalahan");
      setSubmitting(false);
      return;
    }

    await fetchHutangs();
    resetForm();
    setSubmitting(false);
  };

  const handleBayar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bayarTarget) return;
    setSubmitting(true);
    setError("");

    const tambahan = parseFloat(jumlahBayar);
    const sudahDibayarBaru = Math.min(
      Number(bayarTarget.sudahDibayar) + tambahan,
      Number(bayarTarget.jumlah)
    );

    const res = await fetch(`/api/hutang/${bayarTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: bayarTarget.nama,
        jumlah: Number(bayarTarget.jumlah),
        sudahDibayar: sudahDibayarBaru,
        jatuhTempo: bayarTarget.jatuhTempo,
        tipe: bayarTarget.tipe,
        catatan: bayarTarget.catatan,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Terjadi kesalahan");
      setSubmitting(false);
      return;
    }

    await fetchHutangs();
    resetBayar();
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/hutang/${deleteTarget.id}`, { method: "DELETE" });
    await fetchHutangs();
    setDeleteTarget(null);
    setDeleting(false);
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const formatTanggal = (str: string) =>
    new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const hitungSisaHari = (jatuhTempo: string) => {
    const diff = new Date(jatuhTempo).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filtered = hutangs.filter((h) => h.tipe === activeTab);
  const totalJumlah = filtered.reduce((a, h) => a + Number(h.jumlah), 0);
  const totalSudahDibayar = filtered.reduce((a, h) => a + Number(h.sudahDibayar), 0);
  const totalSisa = totalJumlah - totalSudahDibayar;
  const sudahLunas = filtered.filter((h) => Number(h.sudahDibayar) >= Number(h.jumlah)).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Hutang & Piutang</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pantau hutang dan piutang kamu</p>
        </div>
        <button onClick={() => { resetForm(); setTipe(activeTab); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#4B0082] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#3a0066] transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah
        </button>
      </div>

      {/* Tab */}
      <div className="flex rounded-lg border border-gray-200 p-1 gap-1 mb-5 max-w-xs">
        {(["HUTANG", "PIUTANG"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition
              ${activeTab === t
                ? t === "HUTANG" ? "bg-red-500 text-white" : "bg-green-500 text-white"
                : "text-gray-500 hover:bg-gray-50"}`}>
            {t === "HUTANG" ? "Hutang" : "Piutang"}
          </button>
        ))}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`rounded-xl p-4 ${activeTab === "HUTANG" ? "bg-red-50" : "bg-green-50"}`}>
            <p className={`text-xs font-medium ${activeTab === "HUTANG" ? "text-red-600" : "text-green-700"}`}>
              Total {activeTab === "HUTANG" ? "Hutang" : "Piutang"}
            </p>
            <p className={`text-base font-semibold mt-1 ${activeTab === "HUTANG" ? "text-red-600" : "text-green-700"}`}>
              {formatRupiah(totalJumlah)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-700 font-medium">
              {activeTab === "HUTANG" ? "Sudah Dibayar" : "Sudah Diterima"}
            </p>
            <p className="text-base font-semibold text-blue-700 mt-1">{formatRupiah(totalSudahDibayar)}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-xs text-purple-700 font-medium">Sisa</p>
            <p className="text-base font-semibold text-purple-700 mt-1">{formatRupiah(totalSisa)}</p>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Memuat...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">{activeTab === "HUTANG" ? "💸" : "💰"}</p>
          <p className="text-sm">
            Belum ada data {activeTab === "HUTANG" ? "hutang" : "piutang"}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((h) => {
            const persen = Math.min(Math.round((Number(h.sudahDibayar) / Number(h.jumlah)) * 100), 100);
            const lunas = Number(h.sudahDibayar) >= Number(h.jumlah);
            const sisaHari = h.jatuhTempo ? hitungSisaHari(h.jatuhTempo) : null;
            const mepet = sisaHari !== null && sisaHari <= 7 && !lunas;
            const terlambat = sisaHari !== null && sisaHari < 0 && !lunas;

            return (
              <div key={h.id} className={`bg-white rounded-xl border p-4
                ${terlambat ? "border-red-300" : mepet ? "border-amber-200" : "border-gray-100"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800">{h.nama}</p>
                      {lunas && (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                          ✓ Lunas
                        </span>
                      )}
                      {terlambat && (
                        <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">
                          Terlambat
                        </span>
                      )}
                      {mepet && (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                          ⚠ {sisaHari}h lagi
                        </span>
                      )}
                    </div>
                    {h.jatuhTempo && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Jatuh tempo: {formatTanggal(h.jatuhTempo)}
                      </p>
                    )}
                    {h.catatan && <p className="text-xs text-gray-400">{h.catatan}</p>}
                  </div>
                  <div className="flex gap-1">
                    {!lunas && (
                      <button onClick={() => openBayar(h)} title={activeTab === "HUTANG" ? "Bayar" : "Terima"}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    )}
                    <button onClick={() => openEdit(h)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => setDeleteTarget(h)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${lunas ? "bg-green-500" : terlambat ? "bg-red-500" : mepet ? "bg-amber-400" : "bg-[#4B0082]"}`}
                    style={{ width: `${persen}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <p className="text-xs text-gray-400">
                    {formatRupiah(Number(h.sudahDibayar))} / {formatRupiah(Number(h.jumlah))}
                  </p>
                  <p className="text-xs font-medium text-gray-600">
                    {lunas ? "Lunas" : `Sisa ${formatRupiah(Number(h.jumlah) - Number(h.sudahDibayar))}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form Tambah/Edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">
                {editTarget ? "Edit Data" : "Tambah Hutang/Piutang"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              {/* Tipe toggle */}
              <div className="flex rounded-lg border border-gray-200 p-1 gap-1">
                {(["HUTANG", "PIUTANG"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTipe(t)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition
                      ${tipe === t
                        ? t === "HUTANG" ? "bg-red-500 text-white" : "bg-green-500 text-white"
                        : "text-gray-500 hover:bg-gray-50"}`}>
                    {t === "HUTANG" ? "Hutang" : "Piutang"}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {tipe === "HUTANG" ? "Nama Pemberi Hutang" : "Nama Peminjam"}
                </label>
                <input type="text" value={nama} onChange={(e) => setNama(e.target.value)}
                  placeholder={tipe === "HUTANG" ? "cth: Bank BCA, Pak Budi" : "cth: Andi, Siti"}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Jumlah</label>
                <input type="number" value={jumlah} onChange={(e) => setJumlah(e.target.value)}
                  placeholder="0" min="1" required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {tipe === "HUTANG" ? "Sudah Dibayar" : "Sudah Diterima"}{" "}
                  <span className="text-gray-400">(opsional)</span>
                </label>
                <input type="number" value={sudahDibayar} onChange={(e) => setSudahDibayar(e.target.value)}
                  placeholder="0" min="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Jatuh Tempo <span className="text-gray-400">(opsional)</span>
                </label>
                <input type="date" value={jatuhTempo} onChange={(e) => setJatuhTempo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Catatan <span className="text-gray-400">(opsional)</span>
                </label>
                <input type="text" value={catatan} onChange={(e) => setCatatan(e.target.value)}
                  placeholder="cth: KPR rumah, pinjaman modal usaha"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-[#4B0082] text-white font-medium py-2.5 rounded-lg text-sm hover:bg-[#3a0066] transition disabled:opacity-50">
                {submitting ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Tambah"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bayar/Terima */}
      {showBayar && bayarTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">
                {bayarTarget.tipe === "HUTANG" ? "Catat Pembayaran" : "Catat Penerimaan"}
              </h2>
              <button onClick={resetBayar} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={`rounded-xl p-4 mb-4 ${bayarTarget.tipe === "HUTANG" ? "bg-red-50" : "bg-green-50"}`}>
              <p className={`text-sm font-medium ${bayarTarget.tipe === "HUTANG" ? "text-red-800" : "text-green-800"}`}>
                {bayarTarget.nama}
              </p>
              <p className={`text-xs mt-1 ${bayarTarget.tipe === "HUTANG" ? "text-red-600" : "text-green-600"}`}>
                Sisa: {formatRupiah(Number(bayarTarget.jumlah) - Number(bayarTarget.sudahDibayar))}
              </p>
            </div>

            <form onSubmit={handleBayar} className="space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {bayarTarget.tipe === "HUTANG" ? "Jumlah Dibayar" : "Jumlah Diterima"}
                </label>
                <input type="number" value={jumlahBayar} onChange={(e) => setJumlahBayar(e.target.value)}
                  placeholder="0" min="1" required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-[#4B0082] text-white font-medium py-2.5 rounded-lg text-sm hover:bg-[#3a0066] transition disabled:opacity-50">
                {submitting ? "Menyimpan..." : "Simpan"}
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
            <h3 className="font-semibold text-gray-800 text-center mb-1">Hapus Data?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Data <span className="font-medium text-gray-700">{deleteTarget.nama}</span> akan dihapus permanen.
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