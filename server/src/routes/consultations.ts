import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

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
    const { patientId, transcript, notes, diagnosis } = req.body;
    if (!patientId) {
      return res.status(400).json({ error: 'patientId é obrigatório' });
    }
    const consultation = await prisma.consultation.create({
      data: {
        patientId,
        transcript: transcript ?? [],
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
    const consultation = await prisma.consultation.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(consultation);
  } catch (error) {
    console.error('[consultations:update]', error);
    res.status(500).json({ error: 'Erro ao atualizar consulta' });
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
