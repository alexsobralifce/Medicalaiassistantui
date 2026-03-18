import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { requireAuth, requireAdmin, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

// Apenas ADMINs podem listar, criar, editar ou deletar usuários
router.use(requireAuth, requireAdmin);

// GET /api/v1/users
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        crm: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('[users:list]', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// POST /api/v1/users
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, crm, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ error: 'E-mail já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        crm,
        role: role || 'DOCTOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
        crm: true,
        role: true,
        createdAt: true,
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('[users:create]', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// PATCH /api/v1/users/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { password, ...otherData } = req.body;
    let dataToUpdate = { ...otherData };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      dataToUpdate.password = hashedPassword;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        crm: true,
        role: true,
        createdAt: true,
      }
    });

    res.json(user);
  } catch (error) {
    console.error('[users:update]', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// DELETE /api/v1/users/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Avoid admin deleting themselves
    if (req.user?.userId === req.params.id) {
       return res.status(400).json({ error: 'Não é possível remover a própria conta em uso.' });
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('[users:delete]', error);
    res.status(500).json({ error: 'Erro ao remover usuário' });
  }
});

export default router;
