import path from 'path';
import dotenv from 'dotenv';
// Load .env only if not in production (Railway injects vars directly)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}
import express from 'express';
import cors from 'cors';
import patientsRouter from './routes/patients';
import consultationsRouter from './routes/consultations';
import aiRouter from './routes/ai';
import cidsRouter from './routes/cids';
import authRouter from './routes/auth';
import usersRouter from './routes/users';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const clientUrl = process.env.CLIENT_URL;
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    if (clientUrl) allowed.push(clientUrl);
    
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/patients', patientsRouter);
app.use('/api/v1/consultations', consultationsRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/cids', cidsRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✅ MedAssist API running → http://localhost:${PORT}`);
  });
}

export default app;

