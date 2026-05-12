import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transaksi = await prisma.transaksi.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!transaksi) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  await prisma.$transaction([
    prisma.transaksi.delete({ where: { id: params.id } }),
    prisma.dompet.update({
      where: { id: transaksi.dompetId },
      data: {
        saldo: {
          increment: transaksi.tipe === "PEMASUKAN" ? -Number(transaksi.jumlah) : Number(transaksi.jumlah),
        },
      },
    }),
  ]);

  return NextResponse.json({ message: "Transaksi dihapus" });
}
