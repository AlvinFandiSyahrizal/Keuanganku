import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tabungans = await prisma.tabungan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tabungans);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { nama, target, terkumpul, deadline } = await req.json();

    if (!nama || !target) {
      return NextResponse.json({ error: "Nama dan target wajib diisi" }, { status: 400 });
    }

    const tabungan = await prisma.tabungan.create({
      data: {
        nama,
        target,
        terkumpul: terkumpul || 0,
        deadline: deadline ? new Date(deadline) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(tabungan, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat tabungan" }, { status: 500 });
  }
}