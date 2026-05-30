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
    const { jumlah } = await req.json();

    await prisma.anggaran.updateMany({
      where: { id, userId: session.user.id },
      data: { jumlah },
    });

    return NextResponse.json({ message: "Anggaran diupdate" });
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

    await prisma.anggaran.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ message: "Anggaran dihapus" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}