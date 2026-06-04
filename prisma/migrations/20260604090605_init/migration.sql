-- CreateEnum
CREATE TYPE "TipeTransaksi" AS ENUM ('PEMASUKAN', 'PENGELUARAN');

-- CreateEnum
CREATE TYPE "TipeHutang" AS ENUM ('HUTANG', 'PIUTANG');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dompet" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "saldo" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "icon" TEXT,
    "warna" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Dompet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kategori" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "icon" TEXT,
    "warna" TEXT,
    "tipe" "TipeTransaksi" NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaksi" (
    "id" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "catatan" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "tipe" "TipeTransaksi" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "dompetId" TEXT NOT NULL,
    "kategoriId" TEXT,

    CONSTRAINT "Transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "catatan" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dompetAsalId" TEXT NOT NULL,
    "dompetTujuanId" TEXT NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anggaran" (
    "id" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "kategoriId" TEXT NOT NULL,

    CONSTRAINT "Anggaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tabungan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "target" DECIMAL(15,2) NOT NULL,
    "terkumpul" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Tabungan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hutang" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "sudahDibayar" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "jatuhTempo" TIMESTAMP(3),
    "tipe" "TipeHutang" NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Hutang_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Dompet" ADD CONSTRAINT "Dompet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kategori" ADD CONSTRAINT "Kategori_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaksi" ADD CONSTRAINT "Transaksi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaksi" ADD CONSTRAINT "Transaksi_dompetId_fkey" FOREIGN KEY ("dompetId") REFERENCES "Dompet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaksi" ADD CONSTRAINT "Transaksi_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "Kategori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_dompetAsalId_fkey" FOREIGN KEY ("dompetAsalId") REFERENCES "Dompet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_dompetTujuanId_fkey" FOREIGN KEY ("dompetTujuanId") REFERENCES "Dompet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggaran" ADD CONSTRAINT "Anggaran_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggaran" ADD CONSTRAINT "Anggaran_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "Kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tabungan" ADD CONSTRAINT "Tabungan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hutang" ADD CONSTRAINT "Hutang_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
