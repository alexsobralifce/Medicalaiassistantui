-- Adicionar campos do pipeline de anamnese com IA
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "transcriptClean" TEXT;
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "anamnesisJson" JSONB;
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "anamnesisMarkdown" TEXT;
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3);
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "signedByDoctorId" TEXT;
