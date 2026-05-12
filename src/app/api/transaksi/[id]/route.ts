import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { jumlah, catatan, tanggal, tipe, dompetId, kategoriId } = await req.json();

    const transaksiLama = await prisma.transaksi.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!transaksiLama) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const kembalikanLama = transaksiLama.tipe === "PEMASUKAN"
      ? -Number(transaksiLama.jumlah)
      : Number(transaksiLama.jumlah);

    const terapkanBaru = tipe === "PEMASUKAN"
      ? Number(jumlah)
      : -Number(jumlah);

    const [transaksi] = await prisma.$transaction([
      prisma.transaksi.update({
        where: { id },
        data: {
          jumlah,
          catatan,
          tanggal: new Date(tanggal),
          tipe,
          dompetId,
          kategoriId: kategoriId || null,
        },
      }),
      prisma.dompet.update({
        where: { id: transaksiLama.dompetId },
        data: { saldo: { increment: kembalikanLama } },
      }),
      prisma.dompet.update({
        where: { id: dompetId },
        data: { saldo: { increment: terapkanBaru } },
      }),
    ]);

    return NextResponse.json(transaksi);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mengupdate transaksi" }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const transaksi = await prisma.transaksi.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!transaksi) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    await prisma.$transaction([
      prisma.dompet.update({
        where: { id: transaksi.dompetId },
        data: {
          saldo: {
            increment: transaksi.tipe === "PEMASUKAN"
              ? -Number(transaksi.jumlah)
              : Number(transaksi.jumlah),
          },
        },
      }),
      prisma.transaksi.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Transaksi dihapus" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  }
}