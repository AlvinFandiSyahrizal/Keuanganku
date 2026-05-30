import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const transfer = await prisma.transfer.findFirst({
      where: { id, dompetAsal: { userId: session.user.id } },
    });

    if (!transfer) return NextResponse.json({ error: "Transfer tidak ditemukan" }, { status: 404 });

    await prisma.$transaction([
      prisma.dompet.update({
        where: { id: transfer.dompetAsalId },
        data: { saldo: { increment: Number(transfer.jumlah) } },
      }),
      prisma.dompet.update({
        where: { id: transfer.dompetTujuanId },
        data: { saldo: { decrement: Number(transfer.jumlah) } },
      }),
      prisma.transfer.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Transfer dibatalkan" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membatalkan transfer" }, { status: 500 });
  }
}