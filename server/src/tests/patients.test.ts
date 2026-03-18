import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index'; // O App exportado sem o app.listen.
import { prisma } from '../lib/prisma';

describe('Patients API', () => {

  it('deve listar pacientes retornando array vazio inicialmente', async () => {
    const res = await request(app).get('/api/v1/patients');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  it('deve rejeitar criação de paciente com dados incompletos', async () => {
    const res = await request(app)
      .post('/api/v1/patients')
      .send({ name: 'Maria' }); // Faltam age e gender

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('deve criar corretamente um novo paciente', async () => {
    const res = await request(app)
      .post('/api/v1/patients')
      .send({
        name: 'João Teste',
        age: 30,
        gender: 'Masculino'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('João Teste');
  });

  it('deve buscar um paciente específico por ID', async () => {
    // 1 - Criamos um paciente
    const newPatient = await prisma.patient.create({
      data: { name: 'Alice Buscavel', age: 25, gender: 'Feminino' }
    });

    // 2 - Buscamos via API
    const res = await request(app).get(`/api/v1/patients/${newPatient.id}`);
    
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alice Buscavel');
    expect(res.body.consultations).toBeInstanceOf(Array);
  });

});
