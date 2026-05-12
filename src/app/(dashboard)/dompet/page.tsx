"use client";

import { useEffect, useState } from "react";

interface Dompet {
  id: string;
  nama: string;
  saldo: number;
  icon: string;
  warna: string;
}

const ICON_OPTIONS = ["💳", "🏦", "💰", "👛", "🏧", "💵", "🪙", "📱"];
const WARNA_OPTIONS = [
  "#4B0082", "#7C3AED", "#2563EB", "#059669",
  "#D97706", "#DC2626", "#DB2777", "#0891B2",
];

export default function DompetPage() {
  const [dompets, setDompets] = useState<Dompet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Dompet | null>(null);
  const [editTarget, setEditTarget] = useState<Dompet | null>(null);
  const [nama, setNama] = useState("");
  const [saldo, setSaldo] = useState("");
  const [icon, setIcon] = useState("💳");
  const [warna, setWarna] = useState("#4B0082");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const fetchDompets = async () => {
    const res = await fetch("/api/dompet");
    const data = await res.json();
    setDompets(data);
    setLoading(false);
  };

  useEffect(() => { fetchDompets(); }, []);

  const resetForm = () => {
    setNama(""); setSaldo(""); setIcon("💳"); setWarna("#4B0082");
    setEditTarget(null); setShowForm(false); setError("");
  };

  const openEdit = (d: Dompet) => {
    setEditTarget(d);
    setNama(d.nama);
    setIcon(d.icon);
    setWarna(d.warna);
    setSaldo(String(Number(d.saldo)));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const url = editTarget ? `/api/dompet/${editTarget.id}` : "/api/dompet";
    const method = editTarget ? "PATCH" : "POST";
    const body = { nama, icon, warna, saldo: parseFloat(saldo) || 0 };

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

    await fetchDompets();
    resetForm();
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/dompet/${deleteTarget.id}`, { method: "DELETE" });
    await fetchDompets();
    setDeleteTarget(null);
    setDeleting(false);
  };

  const totalSaldo = dompets.reduce((acc, d) => acc + Number(d.saldo), 0);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Dompet</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola sumber keuangan kamu</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#4B0082] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#3a0066] transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Dompet
        </button>
      </div>

      {/* Total Saldo */}
      <div className="bg-[#4B0082] rounded-2xl p-5 mb-6 text-white">
        <p className="text-white/60 text-sm">Total semua saldo</p>
        <p className="text-3xl font-semibold mt-1">{formatRupiah(totalSaldo)}</p>
        <p className="text-white/50 text-xs mt-1">{dompets.length} dompet aktif</p>
      </div>

      {/* List Dompet */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Memuat...</p>
      ) : dompets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👛</p>
          <p className="text-sm">Belum ada dompet. Tambah sekarang!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dompets.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: d.warna + "20" }}>
                  {d.icon}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{d.nama}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatRupiah(Number(d.saldo))}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(d)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => setDeleteTarget(d)}
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

      {/* Modal Form Tambah/Edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">
                {editTarget ? "Edit Dompet" : "Tambah Dompet"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Dompet</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="cth: BCA, Tunai, GoPay"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {editTarget ? "Ubah Saldo" : "Saldo Awal"}
                </label>
                <input
                  type="number"
                  value={saldo}
                  onChange={(e) => setSaldo(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {ICON_OPTIONS.map((ic) => (
                    <button key={ic} type="button" onClick={() => setIcon(ic)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition
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
                {submitting ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Tambah Dompet"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 text-center mb-1">Hapus Dompet?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Dompet <span className="font-medium text-gray-700">{deleteTarget.nama}</span> akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}