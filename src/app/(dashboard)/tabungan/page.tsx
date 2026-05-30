"use client";

import { useEffect, useState } from "react";

interface Tabungan {
  id: string;
  nama: string;
  target: number;
  terkumpul: number;
  deadline: string | null;
  createdAt: string;
}

export default function TabunganPage() {
  const [tabungans, setTabungans] = useState<Tabungan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSetor, setShowSetor] = useState(false);
  const [editTarget, setEditTarget] = useState<Tabungan | null>(null);
  const [setorTarget, setSetorTarget] = useState<Tabungan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tabungan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [nama, setNama] = useState("");
  const [target, setTarget] = useState("");
  const [terkumpul, setTerkumpul] = useState("");
  const [deadline, setDeadline] = useState("");
  const [jumlahSetor, setJumlahSetor] = useState("");

  const fetchTabungans = async () => {
    const res = await fetch("/api/tabungan");
    const data = await res.json();
    setTabungans(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchTabungans(); }, []);

  const resetForm = () => {
    setNama(""); setTarget(""); setTerkumpul(""); setDeadline("");
    setEditTarget(null); setShowForm(false); setError("");
  };

  const resetSetor = () => {
    setJumlahSetor(""); setSetorTarget(null); setShowSetor(false); setError("");
  };

  const openEdit = (t: Tabungan) => {
    setEditTarget(t);
    setNama(t.nama);
    setTarget(String(Number(t.target)));
    setTerkumpul(String(Number(t.terkumpul)));
    setDeadline(t.deadline ? new Date(t.deadline).toISOString().split("T")[0] : "");
    setShowForm(true);
  };

  const openSetor = (t: Tabungan) => {
    setSetorTarget(t);
    setJumlahSetor("");
    setShowSetor(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const url = editTarget ? `/api/tabungan/${editTarget.id}` : "/api/tabungan";
    const method = editTarget ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama,
        target: parseFloat(target),
        terkumpul: parseFloat(terkumpul) || 0,
        deadline: deadline || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Terjadi kesalahan");
      setSubmitting(false);
      return;
    }

    await fetchTabungans();
    resetForm();
    setSubmitting(false);
  };

  const handleSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setorTarget) return;
    setSubmitting(true);
    setError("");

    const tambahan = parseFloat(jumlahSetor);
    const terkumpulBaru = Number(setorTarget.terkumpul) + tambahan;

    const res = await fetch(`/api/tabungan/${setorTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: setorTarget.nama,
        target: Number(setorTarget.target),
        terkumpul: terkumpulBaru,
        deadline: setorTarget.deadline,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Terjadi kesalahan");
      setSubmitting(false);
      return;
    }

    await fetchTabungans();
    resetSetor();
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/tabungan/${deleteTarget.id}`, { method: "DELETE" });
    await fetchTabungans();
    setDeleteTarget(null);
    setDeleting(false);
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const formatTanggal = (str: string) =>
    new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const hitungSisaHari = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const totalTarget = tabungans.reduce((a, t) => a + Number(t.target), 0);
  const totalTerkumpul = tabungans.reduce((a, t) => a + Number(t.terkumpul), 0);
  const sudahTercapai = tabungans.filter((t) => Number(t.terkumpul) >= Number(t.target)).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Tabungan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pantau progress target tabungan kamu</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#4B0082] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#3a0066] transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah
        </button>
      </div>

      {/* Summary */}
      {tabungans.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-xs text-purple-700 font-medium">Total Target</p>
            <p className="text-base font-semibold text-purple-700 mt-1">{formatRupiah(totalTarget)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-700 font-medium">Terkumpul</p>
            <p className="text-base font-semibold text-blue-700 mt-1">{formatRupiah(totalTerkumpul)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-green-700 font-medium">Tercapai</p>
            <p className="text-base font-semibold text-green-700 mt-1">{sudahTercapai} / {tabungans.length}</p>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Memuat...</p>
      ) : tabungans.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🐷</p>
          <p className="text-sm">Belum ada target tabungan. Buat sekarang!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tabungans.map((t) => {
            const persen = Math.min(Math.round((Number(t.terkumpul) / Number(t.target)) * 100), 100);
            const tercapai = Number(t.terkumpul) >= Number(t.target);
            const sisaHari = t.deadline ? hitungSisaHari(t.deadline) : null;
            const mepet = sisaHari !== null && sisaHari <= 7 && !tercapai;

            return (
              <div key={t.id} className={`bg-white rounded-xl border p-4 ${mepet ? "border-amber-200" : "border-gray-100"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{t.nama}</p>
                      {tercapai && (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                          ✓ Tercapai
                        </span>
                      )}
                      {mepet && (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                          ⚠ {sisaHari}h lagi
                        </span>
                      )}
                    </div>
                    {t.deadline && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Deadline: {formatTanggal(t.deadline)}
                        {sisaHari !== null && !tercapai && (
                          <span className={`ml-1 ${mepet ? "text-amber-500" : "text-gray-400"}`}>
                            ({sisaHari > 0 ? `${sisaHari} hari lagi` : "Terlewat"})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openSetor(t)}
                      title="Setor tabungan"
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button onClick={() => openEdit(t)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => setDeleteTarget(t)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                  <div
                    className={`h-2.5 rounded-full transition-all ${tercapai ? "bg-green-500" : mepet ? "bg-amber-400" : "bg-[#4B0082]"}`}
                    style={{ width: `${persen}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <p className="text-xs text-gray-400">{formatRupiah(Number(t.terkumpul))} terkumpul</p>
                  <p className="text-xs font-medium text-gray-600">
                    {persen}% dari {formatRupiah(Number(t.target))}
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
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">
                {editTarget ? "Edit Tabungan" : "Tambah Target Tabungan"}
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Target</label>
                <input type="text" value={nama} onChange={(e) => setNama(e.target.value)}
                  placeholder="cth: Beli laptop, Liburan, Dana darurat"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Jumlah</label>
                <input type="number" value={target} onChange={(e) => setTarget(e.target.value)}
                  placeholder="0" min="1" required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sudah Terkumpul <span className="text-gray-400">(opsional)</span>
                </label>
                <input type="number" value={terkumpul} onChange={(e) => setTerkumpul(e.target.value)}
                  placeholder="0" min="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Deadline <span className="text-gray-400">(opsional)</span>
                </label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-[#4B0082] text-white font-medium py-2.5 rounded-lg text-sm hover:bg-[#3a0066] transition disabled:opacity-50">
                {submitting ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Buat Target"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Setor */}
      {showSetor && setorTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">Setor Tabungan</h2>
              <button onClick={resetSetor} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-purple-800">{setorTarget.nama}</p>
              <p className="text-xs text-purple-600 mt-1">
                Terkumpul: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(setorTarget.terkumpul))} dari {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(setorTarget.target))}
              </p>
            </div>

            <form onSubmit={handleSetor} className="space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah Setoran</label>
                <input type="number" value={jumlahSetor} onChange={(e) => setJumlahSetor(e.target.value)}
                  placeholder="0" min="1" required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-[#4B0082] text-white font-medium py-2.5 rounded-lg text-sm hover:bg-[#3a0066] transition disabled:opacity-50">
                {submitting ? "Menyimpan..." : "Setor Sekarang"}
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
            <h3 className="font-semibold text-gray-800 text-center mb-1">Hapus Tabungan?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Target <span className="font-medium text-gray-700">{deleteTarget.nama}</span> akan dihapus permanen.
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