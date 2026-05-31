import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();
  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

  const [transaksis, dompets, anggarans, tabungans, hutangs] = await Promise.all([
    prisma.transaksi.findMany({
      where: { userId: session.user.id, tanggal: { gte: startDate, lte: endDate } },
      select: { jumlah: true, tipe: true, kategoriId: true },
    }),
    prisma.dompet.findMany({ where: { userId: session.user.id } }),
    prisma.anggaran.findMany({
      where: { userId: session.user.id, bulan, tahun },
      include: { kategori: true },
    }),
    prisma.tabungan.findMany({ where: { userId: session.user.id } }),
    prisma.hutang.findMany({ where: { userId: session.user.id } }),
  ]);

  const pemasukan = transaksis.filter((t) => t.tipe === "PEMASUKAN").reduce((a, t) => a + Number(t.jumlah), 0);
  const pengeluaran = transaksis.filter((t) => t.tipe === "PENGELUARAN").reduce((a, t) => a + Number(t.jumlah), 0);
  const totalSaldo = dompets.reduce((a, d) => a + Number(d.saldo), 0);

  const scores: { nama: string; skor: number; maks: number; pesan: string; saran: string; icon: string }[] = [];

  // === 1. Rasio tabungan (20 poin) ===
  let skorTabungan = 0;
  let pesanTabungan = "";
  let saranTabungan = "";
  if (pemasukan > 0) {
    const rasio = ((pemasukan - pengeluaran) / pemasukan) * 100;
    if (rasio >= 20) { skorTabungan = 20; pesanTabungan = "Luar biasa! Kamu menabung lebih dari 20% pemasukan."; }
    else if (rasio >= 10) { skorTabungan = 14; pesanTabungan = "Cukup baik, kamu menabung 10-20% pemasukan."; }
    else if (rasio >= 0) { skorTabungan = 7; pesanTabungan = "Kamu masih menabung, tapi persentasenya kecil."; }
    else { skorTabungan = 0; pesanTabungan = "Pengeluaran melebihi pemasukan bulan ini!"; }
    saranTabungan = rasio < 20 ? "Usahakan menabung minimal 20% dari pemasukan setiap bulan." : "Pertahankan kebiasaan menabung ini!";
  } else {
    pesanTabungan = "Belum ada data pemasukan bulan ini.";
    saranTabungan = "Catat pemasukan kamu agar skor bisa dihitung.";
  }
  scores.push({ nama: "Rasio Tabungan", skor: skorTabungan, maks: 20, pesan: pesanTabungan, saran: saranTabungan, icon: "💰" });

  // === 2. Kontrol anggaran (20 poin) ===
  let skorAnggaran = 0;
  let pesanAnggaran = "";
  let saranAnggaran = "";
  if (anggarans.length === 0) {
    skorAnggaran = 0;
    pesanAnggaran = "Kamu belum membuat anggaran apapun.";
    saranAnggaran = "Buat anggaran per kategori untuk mengontrol pengeluaran.";
  } else {
    const realisasiMap: Record<string, number> = {};
    for (const t of transaksis.filter((t) => t.tipe === "PENGELUARAN")) {
      if (!t.kategoriId) continue;
      realisasiMap[t.kategoriId] = (realisasiMap[t.kategoriId] || 0) + Number(t.jumlah);
    }
    const terlampauiCount = anggarans.filter((a) => (realisasiMap[a.kategoriId] || 0) > Number(a.jumlah)).length;
    const persenAman = ((anggarans.length - terlampauiCount) / anggarans.length) * 100;
    if (persenAman === 100) { skorAnggaran = 20; pesanAnggaran = "Semua anggaran terkontrol dengan baik!"; }
    else if (persenAman >= 75) { skorAnggaran = 14; pesanAnggaran = `${terlampauiCount} anggaran terlampaui dari ${anggarans.length} total.`; }
    else if (persenAman >= 50) { skorAnggaran = 8; pesanAnggaran = `Lebih dari separuh anggaran terlampaui.`; }
    else { skorAnggaran = 3; pesanAnggaran = `Banyak anggaran yang tidak terkontrol.`; }
    saranAnggaran = terlampauiCount > 0 ? "Evaluasi kategori yang sering terlampaui dan sesuaikan anggarannya." : "Pertahankan disiplin anggaran ini!";
  }
  scores.push({ nama: "Kontrol Anggaran", skor: skorAnggaran, maks: 20, pesan: pesanAnggaran, saran: saranAnggaran, icon: "📊" });

  // === 3. Dana darurat (20 poin) ===
  let skorDana = 0;
  let pesanDana = "";
  let saranDana = "";
  const pengeluaranRataPerBulan = pengeluaran > 0 ? pengeluaran : 1;
  const bulanDanaDarurat = totalSaldo / pengeluaranRataPerBulan;
  if (bulanDanaDarurat >= 6) { skorDana = 20; pesanDana = "Dana darurat sangat mencukupi (6+ bulan pengeluaran)."; }
  else if (bulanDanaDarurat >= 3) { skorDana = 13; pesanDana = `Dana darurat cukup untuk ${bulanDanaDarurat.toFixed(1)} bulan pengeluaran.`; }
  else if (bulanDanaDarurat >= 1) { skorDana = 7; pesanDana = `Dana darurat hanya cukup untuk ${bulanDanaDarurat.toFixed(1)} bulan.`; }
  else { skorDana = 0; pesanDana = "Saldo sangat tipis, tidak ada buffer dana darurat."; }
  saranDana = bulanDanaDarurat < 6 ? "Targetkan dana darurat minimal 3-6 bulan pengeluaran." : "Dana daruratmu sangat sehat!";
  scores.push({ nama: "Dana Darurat", skor: skorDana, maks: 20, pesan: pesanDana, saran: saranDana, icon: "🛡️" });

  // === 4. Manajemen hutang (20 poin) ===
  let skorHutang = 0;
  let pesanHutang = "";
  let saranHutang = "";
  const hutangAktif = hutangs.filter((h) => h.tipe === "HUTANG" && Number(h.sudahDibayar) < Number(h.jumlah));
  const totalHutangSisa = hutangAktif.reduce((a, h) => a + (Number(h.jumlah) - Number(h.sudahDibayar)), 0);
  const hutangTerlambat = hutangAktif.filter((h) => h.jatuhTempo && new Date(h.jatuhTempo) < now).length;

  if (hutangAktif.length === 0) {
    skorHutang = 20; pesanHutang = "Tidak ada hutang aktif. Kondisi ideal!";
    saranHutang = "Pertahankan kondisi bebas hutang ini.";
  } else if (hutangTerlambat > 0) {
    skorHutang = 5; pesanHutang = `${hutangTerlambat} hutang sudah melewati jatuh tempo.`;
    saranHutang = "Segera lunasi hutang yang sudah jatuh tempo untuk menghindari denda.";
  } else if (pemasukan > 0 && (totalHutangSisa / pemasukan) > 0.5) {
    skorHutang = 8; pesanHutang = "Total hutang cukup besar dibanding pemasukan.";
    saranHutang = "Prioritaskan pelunasan hutang dengan bunga tertinggi.";
  } else {
    skorHutang = 14; pesanHutang = "Hutang masih dalam batas wajar.";
    saranHutang = "Tetap disiplin membayar hutang sesuai jadwal.";
  }
  scores.push({ nama: "Manajemen Hutang", skor: skorHutang, maks: 20, pesan: pesanHutang, saran: saranHutang, icon: "💳" });

  // === 5. Progress tabungan (20 poin) ===
  let skorProgressTabungan = 0;
  let pesanProgressTabungan = "";
  let saranProgressTabungan = "";
  if (tabungans.length === 0) {
    skorProgressTabungan = 0;
    pesanProgressTabungan = "Belum ada target tabungan.";
    saranProgressTabungan = "Buat target tabungan untuk tujuan finansial kamu.";
  } else {
    const tercapai = tabungans.filter((t) => Number(t.terkumpul) >= Number(t.target)).length;
    const rataProgress = tabungans.reduce((a, t) => a + (Number(t.terkumpul) / Number(t.target)), 0) / tabungans.length * 100;
    if (rataProgress >= 75) { skorProgressTabungan = 20; pesanProgressTabungan = `${tercapai} dari ${tabungans.length} target tabungan tercapai.`; }
    else if (rataProgress >= 50) { skorProgressTabungan = 14; pesanProgressTabungan = `Rata-rata progress tabungan ${rataProgress.toFixed(0)}%.`; }
    else if (rataProgress >= 25) { skorProgressTabungan = 8; pesanProgressTabungan = `Progress tabungan masih di ${rataProgress.toFixed(0)}%.`; }
    else { skorProgressTabungan = 3; pesanProgressTabungan = "Progress tabungan masih sangat kecil."; }
    saranProgressTabungan = rataProgress < 75 ? "Tingkatkan setoran rutin ke tabungan setiap bulan." : "Terus semangat mencapai target tabunganmu!";
  }
  scores.push({ nama: "Progress Tabungan", skor: skorProgressTabungan, maks: 20, pesan: pesanProgressTabungan, saran: saranProgressTabungan, icon: "🎯" });

  const totalSkor = scores.reduce((a, s) => a + s.skor, 0);

  let grade = "";
  let gradePesan = "";
  let gradeWarna = "";
  if (totalSkor >= 85) { grade = "A"; gradePesan = "Kesehatan keuangan sangat baik!"; gradeWarna = "green"; }
  else if (totalSkor >= 70) { grade = "B"; gradePesan = "Keuangan kamu cukup sehat."; gradeWarna = "blue"; }
  else if (totalSkor >= 55) { grade = "C"; gradePesan = "Ada beberapa hal yang perlu diperbaiki."; gradeWarna = "amber"; }
  else if (totalSkor >= 40) { grade = "D"; gradePesan = "Keuangan perlu perhatian lebih."; gradeWarna = "orange"; }
  else { grade = "E"; gradePesan = "Keuangan dalam kondisi kritis."; gradeWarna = "red"; }

  return NextResponse.json({ totalSkor, grade, gradePesan, gradeWarna, scores });
}