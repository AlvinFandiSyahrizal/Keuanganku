import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hutangs = await prisma.hutang.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(hutangs);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { nama, jumlah, sudahDibayar, jatuhTempo, tipe, catatan } = await req.json();

    if (!nama || !jumlah || !tipe) {
      return NextResponse.json({ error: "Nama, jumlah, dan tipe wajib diisi" }, { status: 400 });
    }

    const hutang = await prisma.hutang.create({
      data: {
        nama,
        jumlah,
        sudahDibayar: sudahDibayar || 0,
        jatuhTempo: jatuhTempo ? new Date(jatuhTempo) : null,
        tipe,
        catatan,
        userId: session.user.id,
      },
    });

    return NextResponse.json(hutang, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat data" }, { status: 500 });
  }
}