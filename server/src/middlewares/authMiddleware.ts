import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'medassist-super-secret-key-123';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

// Verifica se o usuário tem um token válido
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// Verifica se o usuário logado tem cargo de ADMIN
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso proibido. Requer privilégios de Administrador.' });
  }
  next();
};
