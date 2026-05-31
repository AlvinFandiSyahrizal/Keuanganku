import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bulan = parseInt(searchParams.get("bulan") || String(new Date().getMonth() + 1));
  const tahun = parseInt(searchParams.get("tahun") || String(new Date().getFullYear()));

  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

  const transaksis = await prisma.transaksi.findMany({
    where: {
      userId: session.user.id,
      tanggal: { gte: startDate, lte: endDate },
    },
    include: { dompet: true, kategori: true },
    orderBy: { tanggal: "asc" },
  });

  const rows = transaksis.map((t) => ({
    tanggal: new Date(t.tanggal).toLocaleDateString("id-ID"),
    tipe: t.tipe,
    kategori: t.kategori?.nama || "-",
    dompet: t.dompet.nama,
    jumlah: Number(t.jumlah),
    catatan: t.catatan || "-",
  }));

  const totalPemasukan = rows.filter((r) => r.tipe === "PEMASUKAN").reduce((a, r) => a + r.jumlah, 0);
  const totalPengeluaran = rows.filter((r) => r.tipe === "PENGELUARAN").reduce((a, r) => a + r.jumlah, 0);

  return NextResponse.json({
    rows,
    summary: { totalPemasukan, totalPengeluaran, selisih: totalPemasukan - totalPengeluaran },
    periode: { bulan, tahun },
  });
}