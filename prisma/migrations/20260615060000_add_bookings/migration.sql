-- Bookings: manual booking & payment ledger (additive only).

-- CreateEnum
CREATE TYPE "BookingTripStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "BookerStatus" AS ENUM ('TENTATIVE', 'CONFIRMED', 'TRAVELED', 'CANCELLED');
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "BookingTrip" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coverUrl" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brochureUrl" TEXT,
    "note" TEXT,
    "status" "BookingTripStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookingTrip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booker" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "BookerStatus" NOT NULL DEFAULT 'TENTATIVE',
    "note" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Booker_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentInstallment" (
    "id" TEXT NOT NULL,
    "bookerId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 1,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,
    "receiptUrl" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingTrip_status_idx" ON "BookingTrip"("status");
CREATE INDEX "Booker_tripId_idx" ON "Booker"("tripId");
CREATE INDEX "PaymentInstallment_bookerId_idx" ON "PaymentInstallment"("bookerId");

-- AddForeignKey
ALTER TABLE "Booker" ADD CONSTRAINT "Booker_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "BookingTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentInstallment" ADD CONSTRAINT "PaymentInstallment_bookerId_fkey" FOREIGN KEY ("bookerId") REFERENCES "Booker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
