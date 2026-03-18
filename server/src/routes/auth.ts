import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'medassist-super-secret-key-123';

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token (válido por 7 dias)
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retorna user + token, removendo o hash da senha
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });

  } catch (error) {
    console.error('[auth:login]', error);
    res.status(500).json({ error: 'Erro interno no login' });
  }
});

// GET /api/v1/auth/me (Usado para recuperar a sessão via token)
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('[auth:me]', error);
    res.status(500).json({ error: 'Erro interno ao validar sessão' });
  }
});

export default router;
