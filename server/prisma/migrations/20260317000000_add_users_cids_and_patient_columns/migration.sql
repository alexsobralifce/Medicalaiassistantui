-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "crm" TEXT,
    "role" "Role" NOT NULL DEFAULT 'DOCTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cids" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "cids_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AlterTable: add missing columns to patients
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "dob" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "doctorId" TEXT;

-- CreateIndex on patients.cpf (unique, nullable)
CREATE UNIQUE INDEX IF NOT EXISTS "patients_cpf_key" ON "patients"("cpf");

-- AddForeignKey: patients -> users (doctorId)
ALTER TABLE "patients" ADD CONSTRAINT "patients_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
