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
    const { nama, icon, warna, saldo } = await req.json();

    await prisma.dompet.updateMany({
      where: { id, userId: session.user.id },
      data: { nama, icon, warna, saldo },
    });

    return NextResponse.json({ message: "Dompet diupdate" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mengupdate dompet" }, { status: 500 });
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

    await prisma.dompet.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ message: "Dompet dihapus" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus dompet" }, { status: 500 });
  }
}