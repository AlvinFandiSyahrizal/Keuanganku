"use client";

import { useEffect, useState } from "react";

interface ScoreItem {
  nama: string;
  skor: number;
  maks: number;
  pesan: string;
  saran: string;
  icon: string;
}

interface HealthScore {
  totalSkor: number;
  grade: string;
  gradePesan: string;
  gradeWarna: string;
  scores: ScoreItem[];
}

const warnaGrade: Record<string, { ring: string; text: string; bg: string; bar: string }> = {
  green:  { ring: "border-green-400",  text: "text-green-600",  bg: "bg-green-50",  bar: "bg-green-500" },
  blue:   { ring: "border-blue-400",   text: "text-blue-600",   bg: "bg-blue-50",   bar: "bg-blue-500" },
  amber:  { ring: "border-amber-400",  text: "text-amber-600",  bg: "bg-amber-50",  bar: "bg-amber-400" },
  orange: { ring: "border-orange-400", text: "text-orange-600", bg: "bg-orange-50", bar: "bg-orange-400" },
  red:    { ring: "border-red-400",    text: "text-red-600",    bg: "bg-red-50",    bar: "bg-red-500" },
};

export default function HealthScorePage() {
  const [data, setData] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health-score")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <p className="text-sm text-gray-400 text-center py-20">Menghitung skor...</p>;
  if (!data) return null;

  const w = warnaGrade[data.gradeWarna] || warnaGrade.green;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Financial Health Score</h1>
        <p className="text-sm text-gray-500 mt-0.5">Seberapa sehat kondisi keuangan kamu?</p>
      </div>

      {/* Skor utama */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center">
        <div className={`w-36 h-36 rounded-full border-8 ${w.ring} flex flex-col items-center justify-center mb-4`}>
          <p className={`text-5xl font-bold ${w.text}`}>{data.grade}</p>
          <p className={`text-sm font-medium ${w.text}`}>{data.totalSkor}/100</p>
        </div>
        <p className="text-base font-semibold text-gray-800">{data.gradePesan}</p>
        <p className="text-xs text-gray-400 mt-1">Diperbarui berdasarkan data bulan ini</p>

        {/* Progress bar total */}
        <div className="w-full mt-5">
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${w.bar}`}
              style={{ width: `${data.totalSkor}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">0</span>
            <span className="text-xs text-gray-400">100</span>
          </div>
        </div>

        {/* Grade legend */}
        <div className="flex gap-3 mt-4 flex-wrap justify-center">
          {[
            { grade: "A", label: "85-100", warna: "green" },
            { grade: "B", label: "70-84", warna: "blue" },
            { grade: "C", label: "55-69", warna: "amber" },
            { grade: "D", label: "40-54", warna: "orange" },
            { grade: "E", label: "0-39", warna: "red" },
          ].map((g) => {
            const gw = warnaGrade[g.warna];
            return (
              <div key={g.grade} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${data.grade === g.grade ? `${gw.bg} ${gw.text}` : "bg-gray-50 text-gray-400"}`}>
                <span className="font-bold">{g.grade}</span>
                <span>{g.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail per indikator */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">Detail Indikator</p>
        {data.scores.map((s) => {
          const persen = Math.round((s.skor / s.maks) * 100);
          const warnaBar =
            persen >= 80 ? "bg-green-500" :
            persen >= 60 ? "bg-blue-500" :
            persen >= 40 ? "bg-amber-400" : "bg-red-500";

          return (
            <div key={s.nama} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-lg">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.nama}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.pesan}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-base font-bold text-gray-800">{s.skor}</p>
                  <p className="text-xs text-gray-400">/{s.maks}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${warnaBar}`}
                  style={{ width: `${persen}%` }}
                />
              </div>

              {/* Saran */}
              <div className="flex items-start gap-2 mt-2">
                <svg className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-purple-700">{s.saran}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips umum */}
      <div className="bg-[#4B0082] rounded-2xl p-5 text-white">
        <p className="text-sm font-semibold mb-3">💡 Tips Meningkatkan Skor</p>
        <ul className="space-y-2">
          {[
            "Catat semua transaksi secara rutin agar data lebih akurat",
            "Buat anggaran untuk setiap kategori pengeluaran",
            "Sisihkan minimal 20% pemasukan untuk tabungan",
            "Lunasi hutang berbunga tinggi sesegera mungkin",
            "Bangun dana darurat minimal 3-6 bulan pengeluaran",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-white/80">
              <span className="text-white/50 flex-shrink-0">{i + 1}.</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}