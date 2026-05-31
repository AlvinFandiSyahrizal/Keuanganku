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
    const { nama, jumlah, sudahDibayar, jatuhTempo, tipe, catatan } = await req.json();

    await prisma.hutang.updateMany({
      where: { id, userId: session.user.id },
      data: {
        nama,
        jumlah,
        sudahDibayar,
        jatuhTempo: jatuhTempo ? new Date(jatuhTempo) : null,
        tipe,
        catatan,
      },
    });

    return NextResponse.json({ message: "Data diupdate" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mengupdate" }, { status: 500 });
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

    await prisma.hutang.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ message: "Data dihapus" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}