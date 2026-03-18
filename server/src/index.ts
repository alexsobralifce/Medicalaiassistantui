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

// ─── Static Files & SPA Fallback (Não passam pelo CORS) ────────────────────────
app.use(express.static(path.join(__dirname, '../../public')));

// ─── Middlewares para APIs ────────────────────────────────────────────────────
// Como front e back rodam no mesmo domínio, um CORS brando resolve e evita bloqueios
app.use('/api', cors({
  origin: true, // Permite que a requisição venha do próprio domínio gerado no Railway
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Rotas API ────────────────────────────────────────────────────────────────
app.use('/api/v1/patients', patientsRouter);
app.use('/api/v1/consultations', consultationsRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/cids', cidsRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);

// ─── Fallbacks ────────────────────────────────────────────────────────────────
// Fallback para APIs rotas erradas
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Rota da API não encontrada' });
});

// React SPA fallback para todas as rotas (redireciona para o index.html)
app.get('*', (_req, res) => {
  const publicPath = path.join(__dirname, '../../public/index.html');
  if (require('fs').existsSync(publicPath)) {
    res.sendFile(publicPath);
  } else {
    // Apenas para debug se não existir
    res.status(500).send('Frontend build not found at ' + publicPath);
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✅ MedAssist API running → http://localhost:${PORT}`);
    try {
      const fs = require('fs');
      const publicPath = path.join(__dirname, '../../public');
      console.log('__dirname is:', __dirname);
      console.log('Contents of __dirname:', fs.readdirSync(__dirname));
      console.log('Contents of /app:', fs.readdirSync('/app'));
      console.log('Target publicPath:', publicPath);
      console.log('Contents of publicPath:', fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : 'DOES NOT EXIST');
    } catch (e) {
      console.error('Error debugging FS:', e);
    }
  });
}

export default app;

