import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nama, icon, warna } = await req.json();

  const dompet = await prisma.dompet.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: { nama, icon, warna },
  });

  return NextResponse.json(dompet);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.dompet.deleteMany({
    where: { id: params.id, userId: session.user.id },
  });

  return NextResponse.json({ message: "Dompet dihapus" });
}