-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('DRAFT', 'REVIEW', 'COMPLETED');

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "lastVisit" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "transcript" TEXT[],
    "notes" TEXT,
    "diagnosis" TEXT,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
