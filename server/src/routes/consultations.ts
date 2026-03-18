import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/v1/consultations
router.get('/', async (_req: Request, res: Response) => {
  try {
    const consultations = await prisma.consultation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { patient: { select: { id: true, name: true, age: true } } },
    });
    res.json(consultations);
  } catch (error) {
    console.error('[consultations:list]', error);
    res.status(500).json({ error: 'Erro ao buscar consultas' });
  }
});

// GET /api/v1/consultations/patient/:patientId
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const consultations = await prisma.consultation.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(consultations);
  } catch (error) {
    console.error('[consultations:listByPatient]', error);
    res.status(500).json({ error: 'Erro ao buscar histórico do paciente' });
  }
});

// GET /api/v1/consultations/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: req.params.id },
      include: { patient: true },
    });
    if (!consultation) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }
    res.json(consultation);
  } catch (error) {
    console.error('[consultations:findOne]', error);
    res.status(500).json({ error: 'Erro ao buscar consulta' });
  }
});

// POST /api/v1/consultations
router.post('/', async (req: Request, res: Response) => {
  try {
    const { patientId, transcript, transcriptClean, anamnesisJson, anamnesisMarkdown, notes, diagnosis } = req.body;
    if (!patientId) {
      return res.status(400).json({ error: 'patientId é obrigatório' });
    }
    const consultation = await prisma.consultation.create({
      data: {
        patientId,
        transcript: transcript ?? [],
        transcriptClean,
        anamnesisJson,
        anamnesisMarkdown,
        notes,
        diagnosis,
      },
      include: { patient: { select: { id: true, name: true } } },
    });
    res.status(201).json(consultation);
  } catch (error) {
    console.error('[consultations:create]', error);
    res.status(500).json({ error: 'Erro ao criar consulta' });
  }
});

// PATCH /api/v1/consultations/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const allowed = ['transcript', 'transcriptClean', 'anamnesisJson', 'anamnesisMarkdown', 'notes', 'diagnosis', 'status'];
    const data: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const consultation = await prisma.consultation.update({
      where: { id: req.params.id },
      data,
    });
    res.json(consultation);
  } catch (error) {
    console.error('[consultations:update]', error);
    res.status(500).json({ error: 'Erro ao atualizar consulta' });
  }
});

// POST /api/v1/consultations/:id/sign — Assinatura digital do médico
router.post('/:id/sign', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.user?.userId;
    const consultation = await prisma.consultation.update({
      where: { id: req.params.id },
      data: {
        signedAt: new Date(),
        signedByDoctorId: doctorId,
        status: 'COMPLETED',
      },
    });
    res.json(consultation);
  } catch (error) {
    console.error('[consultations:sign]', error);
    res.status(500).json({ error: 'Erro ao assinar consulta' });
  }
});

// DELETE /api/v1/consultations/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.consultation.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('[consultations:delete]', error);
    res.status(500).json({ error: 'Erro ao deletar consulta' });
  }
});

export default router;
