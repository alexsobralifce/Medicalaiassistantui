import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

// Protege todas as rotas de pacientes
router.use(requireAuth);

// GET /api/v1/patients
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;

    // Se for ADMIN, vê tudo. Se for DOCTOR, vê só os seus.
    const whereClause = role === 'ADMIN' ? {} : { doctorId: userId };

    const patients = await prisma.patient.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      include: { consultations: { select: { id: true, status: true } } },
    });
    res.json(patients);
  } catch (error) {
    console.error('[patients:list]', error);
    res.status(500).json({ error: 'Erro ao buscar pacientes' });
  }
});

// GET /api/v1/patients/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;

    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: { consultations: true },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    // Validação de Posse
    if (role === 'DOCTOR' && patient.doctorId !== userId) {
      return res.status(403).json({ error: 'Acesso negado. Este paciente pertence a outro profissional.' });
    }

    res.json(patient);
  } catch (error) {
    console.error('[patients:findOne]', error);
    res.status(500).json({ error: 'Erro ao buscar paciente' });
  }
});

// POST /api/v1/patients
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, age, gender, image, phone, city, state, dob, cpf } = req.body;
    
    if (!name || age === undefined || !gender) {
      return res.status(400).json({ error: 'name, age e gender são obrigatórios' });
    }
    
    const patient = await prisma.patient.create({
      data: { 
        name, 
        age: Number(age), 
        gender, 
        image, 
        phone, 
        city, 
        state, 
        dob, 
        cpf,
        doctorId: userId // Atrela o paciente ao usuário que o criou
      },
    });
    res.status(201).json(patient);
  } catch (error) {
    console.error('[patients:create]', error);
    res.status(500).json({ error: 'Erro ao criar paciente' });
  }
});

// PATCH /api/v1/patients/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;

    // Verificar posse antes de editar
    const existingPatient = await prisma.patient.findUnique({ where: { id: req.params.id }});
    if (!existingPatient) return res.status(404).json({ error: 'Paciente não encontrado' });
    
    if (role === 'DOCTOR' && existingPatient.doctorId !== userId) {
       return res.status(403).json({ error: 'Acesso negado. Você não pode editar um paciente de outro médico.' });
    }

    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(patient);
  } catch (error) {
    console.error('[patients:update]', error);
    res.status(500).json({ error: 'Erro ao atualizar paciente' });
  }
});

// DELETE /api/v1/patients/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;

    // Verificar posse antes de deletar
    const existingPatient = await prisma.patient.findUnique({ where: { id: req.params.id }});
    if (!existingPatient) return res.status(404).json({ error: 'Paciente não encontrado' });
    
    if (role === 'DOCTOR' && existingPatient.doctorId !== userId) {
       return res.status(403).json({ error: 'Acesso negado. Você não pode deletar um paciente de outro médico.' });
    }

    await prisma.patient.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('[patients:delete]', error);
    res.status(500).json({ error: 'Erro ao remover paciente' });
  }
});

export default router;
