import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';

describe('Consultations API', () => {
  let testPatientId: string;

  beforeAll(async () => {
    // Precisamos de um paciente para associar as consultas
    const p = await prisma.patient.create({
      data: { name: 'Paciente Consulta Teste', age: 40, gender: 'Feminino' }
    });
    testPatientId = p.id;
  });

  it('deve rejeitar uma consulta sem patientId', async () => {
    const res = await request(app)
      .post('/api/v1/consultations')
      .send({
        transcript: ["bla bla"],
        diagnosis: "Gripe"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('patientId é obrigatório');
  });

  it('deve salvar uma nova consulta e vinculá-la ao paciente', async () => {
    const res = await request(app)
      .post('/api/v1/consultations')
      .send({
        patientId: testPatientId,
        transcript: ["paciente relata dor de cabeça"],
        notes: "Uso de medicamento em fase inicial."
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.transcript).toHaveLength(1);
  });

  it('deve atualizar os dados de uma consulta (PATCH)', async () => {
    // 1. Criar diretamente
    const draft = await prisma.consultation.create({
      data: { patientId: testPatientId, transcript: [] }
    });

    // 2. Usar PATCH para "completar"
    const res = await request(app)
      .patch(`/api/v1/consultations/${draft.id}`)
      .send({
        diagnosis: "Enxaqueca",
        status: "COMPLETED"
      });

    expect(res.status).toBe(200);
    expect(res.body.diagnosis).toBe('Enxaqueca');
    expect(res.body.status).toBe('COMPLETED');
  });

});
