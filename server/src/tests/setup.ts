import { beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { prisma } from '../lib/prisma';
import app from '../index'; // Garante que o app é importado após o setup do dotenv caso necessite
import http from 'http';

let server: http.Server;

beforeAll(async () => {
  // Roda migrations forçando no schema test (puxando do .env.test graças ao vitest)
  console.log('🔄 Sincronizando banco de testes...');
  execSync('npx prisma migrate deploy', { stdio: 'ignore' });
  
  // Limpando dados que podem ter sobrado de falhas anteriores
  await prisma.consultation.deleteMany();
  await prisma.patient.deleteMany();

  // Inicia servidor de mock (caso necessário testes com requisições reais sem supertest)
  // Mas como usaremos supertest, não vamos dar app.listen na porta.
});

afterAll(async () => {
  // Limpeza final do banco
  await prisma.consultation.deleteMany();
  await prisma.patient.deleteMany();
  
  await prisma.$disconnect();
});
