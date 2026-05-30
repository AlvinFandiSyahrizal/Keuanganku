"use client";

import { useEffect, useState } from "react";

interface Dompet { id: string; nama: string; icon: string; saldo: number; }
interface Transfer {
  id: string;
  jumlah: number;
  catatan: string | null;
  tanggal: string;
  dompetAsal: Dompet;
  dompetTujuan: Dompet;
}

export default function TransferPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [dompets, setDompets] = useState<Dompet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transfer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [jumlah, setJumlah] = useState("");
  const [catatan, setCatatan] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [dompetAsalId, setDompetAsalId] = useState("");
  const [dompetTujuanId, setDompetTujuanId] = useState("");

  const fetchAll = async () => {
    const [t, d] = await Promise.all([
      fetch("/api/transfer").then((r) => r.json()),
      fetch("/api/dompet").then((r) => r.json()),
    ]);
    setTransfers(Array.isArray(t) ? t : []);
    setDompets(Array.isArray(d) ? d : []);
    if (d.length >= 2) {
      setDompetAsalId(d[0].id);
      setDompetTujuanId(d[1].id);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setJumlah(""); setCatatan("");
    setTanggal(new Date().toISOString().split("T")[0]);
    setShowForm(false); setError("");
    if (dompets.length >= 2) {
      setDompetAsalId(dompets[0].id);
      setDompetTujuanId(dompets[1].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jumlah: parseFloat(jumlah),
        catatan,
        tanggal,
        dompetAsalId,
        dompetTujuanId,
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
    await fetch(`/api/transfer/${deleteTarget.id}`, { method: "DELETE" });
    await fetchAll();
    setDeleteTarget(null);
    setDeleting(false);
  };

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

  const formatTanggal = (str: string) =>
    new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const dompetAsalObj = dompets.find((d) => d.id === dompetAsalId);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Transfer</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pindahkan saldo antar dompet</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          disabled={dompets.length < 2}
          className="flex items-center gap-2 bg-[#4B0082] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#3a0066] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Transfer
        </button>
      </div>

      {/* Info kalau dompet kurang */}
      {dompets.length < 2 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5 flex gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-medium text-amber-800">Minimal 2 dompet diperlukan</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Tambahkan minimal 2 dompet di halaman Dompet untuk bisa transfer.
            </p>
          </div>
        </div>
      )}

      {/* List Transfer */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Memuat...</p>
      ) : transfers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔄</p>
          <p className="text-sm">Belum ada riwayat transfer.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transfers.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg">
                    🔄
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <span>{t.dompetAsal.icon} {t.dompetAsal.nama}</span>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span>{t.dompetTujuan.icon} {t.dompetTujuan.nama}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatTanggal(t.tanggal)}</p>
                    {t.catatan && <p className="text-xs text-gray-400">{t.catatan}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-purple-700">
                    {formatRupiah(Number(t.jumlah))}
                  </p>
                  <button onClick={() => setDeleteTarget(t)}
                    className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-400 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Transfer */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">Transfer Antar Dompet</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dari Dompet</label>
                <select value={dompetAsalId} onChange={(e) => setDompetAsalId(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {dompets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.icon} {d.nama} — {formatRupiah(Number(d.saldo))}
                    </option>
                  ))}
                </select>
                {dompetAsalObj && (
                  <p className="text-xs text-gray-400 mt-1">
                    Saldo tersedia: {formatRupiah(Number(dompetAsalObj.saldo))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ke Dompet</label>
                <select value={dompetTujuanId} onChange={(e) => setDompetTujuanId(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {dompets
                    .filter((d) => d.id !== dompetAsalId)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.icon} {d.nama} — {formatRupiah(Number(d.saldo))}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah</label>
                <input type="number" value={jumlah} onChange={(e) => setJumlah(e.target.value)}
                  placeholder="0" min="1" required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
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
                  placeholder="cth: untuk kebutuhan bulanan"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-[#4B0082] text-white font-medium py-2.5 rounded-lg text-sm hover:bg-[#3a0066] transition disabled:opacity-50">
                {submitting ? "Memproses..." : "Transfer Sekarang"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Batalkan Transfer */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 text-center mb-1">Batalkan Transfer?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Saldo akan dikembalikan ke dompet <span className="font-medium text-gray-700">{deleteTarget.dompetAsal.nama}</span> secara otomatis.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50 transition">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-500 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50">
                {deleting ? "Memproses..." : "Batalkan Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}