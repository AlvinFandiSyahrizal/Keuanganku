"use client";

import { useEffect, useState } from "react";

interface Kategori {
  id: string;
  nama: string;
  icon: string;
  warna: string;
  tipe: "PEMASUKAN" | "PENGELUARAN";
}

const ICON_OPTIONS = [
  "🍔","🚗","🏠","💊","📚","🎮","✈️","👕",
  "💡","📱","🎵","🏋️","💰","💸","🎁","🏥",
  "🛒","☕","🍕","⛽","🎬","💼","🐾","🌿",
];

const WARNA_OPTIONS = [
  "#4B0082","#7C3AED","#2563EB","#059669",
  "#D97706","#DC2626","#DB2777","#0891B2",
];

export default function KategoriPage() {
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Kategori | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kategori | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"PENGELUARAN" | "PEMASUKAN">("PENGELUARAN");

  const [nama, setNama] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const [warna, setWarna] = useState("#4B0082");
  const [tipe, setTipe] = useState<"PEMASUKAN" | "PENGELUARAN">("PENGELUARAN");

  const fetchKategoris = async () => {
    const res = await fetch("/api/kategori");
    const data = await res.json();
    setKategoris(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchKategoris(); }, []);

  const resetForm = () => {
    setNama(""); setIcon("🏷️"); setWarna("#4B0082");
    setTipe(activeTab); setEditTarget(null);
    setShowForm(false); setError("");
  };

  const openAdd = () => {
    resetForm();
    setTipe(activeTab);
    setShowForm(true);
  };

  const openEdit = (k: Kategori) => {
    setEditTarget(k);
    setNama(k.nama);
    setIcon(k.icon);
    setWarna(k.warna);
    setTipe(k.tipe);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const url = editTarget ? `/api/kategori/${editTarget.id}` : "/api/kategori";
    const method = editTarget ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, icon, warna, tipe }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Terjadi kesalahan");
      setSubmitting(false);
      return;
    }

    await fetchKategoris();
    resetForm();
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/kategori/${deleteTarget.id}`, { method: "DELETE" });
    await fetchKategoris();
    setDeleteTarget(null);
    setDeleting(false);
  };

  const filtered = kategoris.filter((k) => k.tipe === activeTab);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Kategori</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola kategori transaksi kamu</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-[#4B0082] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#3a0066] transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah
        </button>
      </div>

      {/* Tab */}
      <div className="flex rounded-lg border border-gray-200 p-1 gap-1 mb-5 max-w-xs">
        {(["PENGELUARAN", "PEMASUKAN"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition
              ${activeTab === t
                ? t === "PEMASUKAN" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                : "text-gray-500 hover:bg-gray-50"}`}>
            {t === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran"}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Memuat...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="text-sm">Belum ada kategori {activeTab === "PEMASUKAN" ? "pemasukan" : "pengeluaran"}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((k) => (
            <div key={k.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: k.warna + "20" }}>
                  {k.icon}
                </div>
                <p className="font-medium text-gray-800 text-sm">{k.nama}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(k)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => setDeleteTarget(k)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">
                {editTarget ? "Edit Kategori" : "Tambah Kategori"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              {/* Tipe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe</label>
                <div className="flex rounded-lg border border-gray-200 p-1 gap-1">
                  {(["PENGELUARAN", "PEMASUKAN"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTipe(t)}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition
                        ${tipe === t
                          ? t === "PEMASUKAN" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          : "text-gray-500 hover:bg-gray-50"}`}>
                      {t === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Kategori</label>
                <input type="text" value={nama} onChange={(e) => setNama(e.target.value)}
                  placeholder="cth: Makan, Transportasi, Gaji"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div className="grid grid-cols-8 gap-1.5">
                  {ICON_OPTIONS.map((ic) => (
                    <button key={ic} type="button" onClick={() => setIcon(ic)}
                      className={`w-full aspect-square rounded-lg text-xl flex items-center justify-center border-2 transition
                        ${icon === ic ? "border-purple-600 bg-purple-50" : "border-gray-100 hover:border-gray-300"}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Warna</label>
                <div className="flex gap-2 flex-wrap">
                  {WARNA_OPTIONS.map((w) => (
                    <button key={w} type="button" onClick={() => setWarna(w)}
                      className={`w-8 h-8 rounded-full border-4 transition
                        ${warna === w ? "border-gray-400 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: w }} />
                  ))}
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-[#4B0082] text-white font-medium py-2.5 rounded-lg text-sm hover:bg-[#3a0066] transition disabled:opacity-50">
                {submitting ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Tambah Kategori"}
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
            <h3 className="font-semibold text-gray-800 text-center mb-1">Hapus Kategori?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Kategori <span className="font-medium text-gray-700">{deleteTarget.nama}</span> akan dihapus. Transaksi yang memakai kategori ini tidak akan terhapus.
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