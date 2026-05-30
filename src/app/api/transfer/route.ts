import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transfers = await prisma.transfer.findMany({
    where: {
      dompetAsal: { userId: session.user.id },
    },
    include: {
      dompetAsal: true,
      dompetTujuan: true,
    },
    orderBy: { tanggal: "desc" },
  });

  return NextResponse.json(transfers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { jumlah, catatan, tanggal, dompetAsalId, dompetTujuanId } = await req.json();

    if (!jumlah || !tanggal || !dompetAsalId || !dompetTujuanId) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    if (dompetAsalId === dompetTujuanId) {
      return NextResponse.json({ error: "Dompet asal dan tujuan tidak boleh sama" }, { status: 400 });
    }

    const dompetAsal = await prisma.dompet.findFirst({
      where: { id: dompetAsalId, userId: session.user.id },
    });

    if (!dompetAsal) {
      return NextResponse.json({ error: "Dompet asal tidak ditemukan" }, { status: 404 });
    }

    if (Number(dompetAsal.saldo) < Number(jumlah)) {
      return NextResponse.json({ error: "Saldo dompet asal tidak mencukupi" }, { status: 400 });
    }

    const dompetTujuan = await prisma.dompet.findFirst({
      where: { id: dompetTujuanId, userId: session.user.id },
    });

    if (!dompetTujuan) {
      return NextResponse.json({ error: "Dompet tujuan tidak ditemukan" }, { status: 404 });
    }

    const [transfer] = await prisma.$transaction([
      prisma.transfer.create({
        data: {
          jumlah,
          catatan,
          tanggal: new Date(tanggal),
          dompetAsalId,
          dompetTujuanId,
        },
      }),
      prisma.dompet.update({
        where: { id: dompetAsalId },
        data: { saldo: { decrement: Number(jumlah) } },
      }),
      prisma.dompet.update({
        where: { id: dompetTujuanId },
        data: { saldo: { increment: Number(jumlah) } },
      }),
    ]);

    return NextResponse.json(transfer, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal melakukan transfer" }, { status: 500 });
  }
}