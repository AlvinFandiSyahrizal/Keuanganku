import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const enamBulanLalu = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const transaksis = await prisma.transaksi.findMany({
    where: {
      userId: session.user.id,
      tanggal: { gte: enamBulanLalu },
    },
    select: { jumlah: true, tipe: true, tanggal: true, kategoriId: true, kategori: { select: { nama: true } } },
    orderBy: { tanggal: "asc" },
  });

  // Grouping per bulan
  const bulanMap: Record<string, { bulan: string; pemasukan: number; pengeluaran: number }> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
    bulanMap[key] = { bulan: label, pemasukan: 0, pengeluaran: 0 };
  }

  for (const t of transaksis) {
    const d = new Date(t.tanggal);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!bulanMap[key]) continue;
    if (t.tipe === "PEMASUKAN") bulanMap[key].pemasukan += Number(t.jumlah);
    else bulanMap[key].pengeluaran += Number(t.jumlah);
  }

  // Top kategori pengeluaran bulan ini
  const bulanIniStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const bulanIniTransaksi = transaksis.filter(
    (t) => new Date(t.tanggal) >= bulanIniStart && t.tipe === "PENGELUARAN"
  );

  const kategoriMap: Record<string, { nama: string; total: number }> = {};
  for (const t of bulanIniTransaksi) {
    const key = t.kategoriId || "tanpa-kategori";
    const nama = t.kategori?.nama || "Tanpa Kategori";
    if (!kategoriMap[key]) kategoriMap[key] = { nama, total: 0 };
    kategoriMap[key].total += Number(t.jumlah);
  }

  const topKategori = Object.values(kategoriMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return NextResponse.json({
    bulanan: Object.values(bulanMap),
    topKategori,
  });
}