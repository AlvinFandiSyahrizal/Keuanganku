import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dompets = await prisma.dompet.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(dompets);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nama, saldo, icon, warna } = await req.json();

  if (!nama) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });

  const dompet = await prisma.dompet.create({
    data: {
      nama,
      saldo: saldo || 0,
      icon: icon || "💳",
      warna: warna || "#4B0082",
      userId: session.user.id,
    },
  });

  return NextResponse.json(dompet, { status: 201 });
}
