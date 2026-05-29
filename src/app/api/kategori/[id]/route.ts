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
    const { nama, icon, warna, tipe } = await req.json();

    await prisma.kategori.updateMany({
      where: { id, userId: session.user.id },
      data: { nama, icon, warna, tipe },
    });

    return NextResponse.json({ message: "Kategori diupdate" });
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

    await prisma.kategori.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ message: "Kategori dihapus" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}