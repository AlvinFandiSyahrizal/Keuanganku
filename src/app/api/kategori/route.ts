import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kategoris = await prisma.kategori.findMany({
    where: { userId: session.user.id },
    orderBy: { nama: "asc" },
  });

  return NextResponse.json(kategoris);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nama, icon, warna, tipe } = await req.json();

  if (!nama || !tipe) return NextResponse.json({ error: "Nama dan tipe wajib diisi" }, { status: 400 });

  const kategori = await prisma.kategori.create({
    data: { nama, icon: icon || "🏷️", warna: warna || "#4B0082", tipe, userId: session.user.id },
  });

  return NextResponse.json(kategori, { status: 201 });
}
