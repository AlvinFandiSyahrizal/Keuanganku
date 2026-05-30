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

  const anggarans = await prisma.anggaran.findMany({
    where: { userId: session.user.id, bulan, tahun },
    include: { kategori: true },
  });

  // Hitung realisasi per kategori bulan ini
  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

  const transaksis = await prisma.transaksi.findMany({
    where: {
      userId: session.user.id,
      tipe: "PENGELUARAN",
      tanggal: { gte: startDate, lte: endDate },
      kategoriId: { in: anggarans.map((a) => a.kategoriId) },
    },
    select: { jumlah: true, kategoriId: true },
  });

  const realisasiMap: Record<string, number> = {};
  for (const t of transaksis) {
    if (!t.kategoriId) continue;
    realisasiMap[t.kategoriId] = (realisasiMap[t.kategoriId] || 0) + Number(t.jumlah);
  }

  const result = anggarans.map((a) => ({
    ...a,
    realisasi: realisasiMap[a.kategoriId] || 0,
    persentase: Math.min(Math.round(((realisasiMap[a.kategoriId] || 0) / Number(a.jumlah)) * 100), 100),
    terlampaui: (realisasiMap[a.kategoriId] || 0) > Number(a.jumlah),
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { jumlah, bulan, tahun, kategoriId } = await req.json();

    if (!jumlah || !bulan || !tahun || !kategoriId) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.anggaran.findFirst({
      where: { userId: session.user.id, bulan, tahun, kategoriId },
    });

    if (existing) {
      return NextResponse.json({ error: "Anggaran kategori ini sudah ada untuk bulan tersebut" }, { status: 400 });
    }

    const anggaran = await prisma.anggaran.create({
      data: { jumlah, bulan, tahun, kategoriId, userId: session.user.id },
    });

    return NextResponse.json(anggaran, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat anggaran" }, { status: 500 });
  }
}