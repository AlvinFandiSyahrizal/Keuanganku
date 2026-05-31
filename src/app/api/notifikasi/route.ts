import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const notifications: {
    id: string;
    tipe: "warning" | "danger" | "info";
    judul: string;
    pesan: string;
    href: string;
  }[] = [];

  // === Cek Anggaran ===
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();
  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

  const anggarans = await prisma.anggaran.findMany({
    where: { userId: session.user.id, bulan, tahun },
    include: { kategori: true },
  });

  if (anggarans.length > 0) {
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

    for (const a of anggarans) {
      const realisasi = realisasiMap[a.kategoriId] || 0;
      const persen = (realisasi / Number(a.jumlah)) * 100;

      if (persen >= 100) {
        notifications.push({
          id: `anggaran-lampaui-${a.id}`,
          tipe: "danger",
          judul: `Anggaran ${a.kategori.nama} terlampaui`,
          pesan: `Pengeluaran sudah melebihi batas anggaran bulan ini.`,
          href: "/anggaran",
        });
      } else if (persen >= 80) {
        notifications.push({
          id: `anggaran-mepet-${a.id}`,
          tipe: "warning",
          judul: `Anggaran ${a.kategori.nama} hampir habis`,
          pesan: `${Math.round(persen)}% dari batas anggaran sudah terpakai.`,
          href: "/anggaran",
        });
      }
    }
  }

  // === Cek Hutang ===
  const hutangs = await prisma.hutang.findMany({
    where: { userId: session.user.id },
  });

  for (const h of hutangs) {
    const lunas = Number(h.sudahDibayar) >= Number(h.jumlah);
    if (lunas || !h.jatuhTempo) continue;

    const sisaHari = Math.ceil(
      (new Date(h.jatuhTempo).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (sisaHari < 0) {
      notifications.push({
        id: `hutang-terlambat-${h.id}`,
        tipe: "danger",
        judul: `${h.tipe === "HUTANG" ? "Hutang" : "Piutang"} ${h.nama} terlambat`,
        pesan: `Sudah melewati jatuh tempo ${Math.abs(sisaHari)} hari yang lalu.`,
        href: "/hutang",
      });
    } else if (sisaHari <= 7) {
      notifications.push({
        id: `hutang-mepet-${h.id}`,
        tipe: "warning",
        judul: `${h.tipe === "HUTANG" ? "Hutang" : "Piutang"} ${h.nama} jatuh tempo`,
        pesan: `Jatuh tempo ${sisaHari === 0 ? "hari ini" : `${sisaHari} hari lagi`}.`,
        href: "/hutang",
      });
    }
  }

  // === Cek Tabungan ===
  const tabungans = await prisma.tabungan.findMany({
    where: { userId: session.user.id },
  });

  for (const t of tabungans) {
    const tercapai = Number(t.terkumpul) >= Number(t.target);
    if (tercapai || !t.deadline) continue;

    const sisaHari = Math.ceil(
      (new Date(t.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (sisaHari < 0) {
      notifications.push({
        id: `tabungan-lewat-${t.id}`,
        tipe: "warning",
        judul: `Target tabungan ${t.nama} terlewat`,
        pesan: `Deadline sudah lewat tapi target belum tercapai.`,
        href: "/tabungan",
      });
    } else if (sisaHari <= 7) {
      notifications.push({
        id: `tabungan-mepet-${t.id}`,
        tipe: "info",
        judul: `Deadline tabungan ${t.nama} mendekat`,
        pesan: `${sisaHari === 0 ? "Hari ini" : `${sisaHari} hari lagi`} deadline tabungan kamu.`,
        href: "/tabungan",
      });
    }
  }

  return NextResponse.json(notifications);
}