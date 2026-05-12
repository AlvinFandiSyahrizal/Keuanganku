import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transaksis = await prisma.transaksi.findMany({
    where: { userId: session.user.id },
    include: { dompet: true, kategori: true },
    orderBy: { tanggal: "desc" },
  });

  return NextResponse.json(transaksis);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jumlah, catatan, tanggal, tipe, dompetId, kategoriId } = await req.json();

  if (!jumlah || !tanggal || !tipe || !dompetId) {
    return NextResponse.json({ error: "Field wajib belum lengkap" }, { status: 400 });
  }

  const dompet = await prisma.dompet.findFirst({
    where: { id: dompetId, userId: session.user.id },
  });

  if (!dompet) return NextResponse.json({ error: "Dompet tidak ditemukan" }, { status: 404 });

  const [transaksi] = await prisma.$transaction([
    prisma.transaksi.create({
      data: {
        jumlah,
        catatan,
        tanggal: new Date(tanggal),
        tipe,
        dompetId,
        kategoriId: kategoriId || null,
        userId: session.user.id,
      },
    }),
    prisma.dompet.update({
      where: { id: dompetId },
      data: {
        saldo: {
          increment: tipe === "PEMASUKAN" ? Number(jumlah) : -Number(jumlah),
        },
      },
    }),
  ]);

  return NextResponse.json(transaksi, { status: 201 });
}
