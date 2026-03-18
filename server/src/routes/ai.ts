import { Router, Request, Response } from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { PROMPT_1_CLEAN_TRANSCRIPT, PROMPT_2_STRUCTURED_JSON, PROMPT_3_MARKDOWN } from '../lib/prompts';

const router = Router();
const openai = new OpenAI();

// Setup multer for temporary audio storage
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max (Whisper limit)
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

/**
 * POST /api/v1/ai/transcribe
 * Transcreve um arquivo de áudio usando OpenAI Whisper
 */
router.post('/transcribe', upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Nenhum arquivo de áudio enviado.' });
      return;
    }
    const newPath = `${file.path}.webm`;
    fs.renameSync(file.path, newPath);
    console.log('[AI] Transcribing audio file...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(newPath),
      model: 'whisper-1',
      language: 'pt',
    });
    fs.unlinkSync(newPath);
    res.json({ text: transcription.text });
  } catch (error: any) {
    console.error('[AI] Erro na transcrição:', error);
    res.status(500).json({ error: 'Erro ao transcrever o áudio.' });
  }
});

/**
 * POST /api/v1/ai/anamnese
 * Pipeline completo: Prompt 1 (texto limpo) → Prompt 2 (JSON) → Prompt 3 (Markdown)
 * Body: { transcricao_bruta: string }
 */
router.post('/anamnese', async (req: Request, res: Response): Promise<void> => {
  try {
    const { transcricao_bruta } = req.body;
    if (!transcricao_bruta) {
      res.status(400).json({ error: 'transcricao_bruta é obrigatória.' });
      return;
    }

    // ── PROMPT 1: Texto limpo ─────────────────────────────────────────────────
    console.log('[AI:anamnese] Prompt 1 — limpando transcrição...');
    const step1 = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PROMPT_1_CLEAN_TRANSCRIPT },
        { role: 'user', content: `TRANSCRIÇÃO BRUTA:\n${transcricao_bruta}` },
      ],
      temperature: 0.1,
    });
    const transcricao_limpa = step1.choices[0].message.content ?? '';

    // ── PROMPT 2: JSON estruturado ────────────────────────────────────────────
    console.log('[AI:anamnese] Prompt 2 — estruturando JSON da anamnese...');
    const step2 = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PROMPT_2_STRUCTURED_JSON },
        { role: 'user', content: `TRANSCRIÇÃO DA CONSULTA:\n${transcricao_limpa}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });
    const anamnesis_json = JSON.parse(step2.choices[0].message.content ?? '{}');

    // ── PROMPT 3: Markdown formatado ──────────────────────────────────────────
    console.log('[AI:anamnese] Prompt 3 — gerando Markdown do prontuário...');
    const step3 = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PROMPT_3_MARKDOWN },
        { role: 'user', content: `JSON DA ANAMNESE:\n${JSON.stringify(anamnesis_json, null, 2)}` },
      ],
      temperature: 0.1,
    });
    const anamnesis_markdown = step3.choices[0].message.content ?? '';

    res.json({ transcricao_limpa, anamnesis_json, anamnesis_markdown });
  } catch (error: any) {
    console.error('[AI:anamnese] Erro no pipeline de anamnese:', error);
    res.status(500).json({ error: 'Erro ao processar a anamnese.' });
  }
});

/**
 * POST /api/v1/ai/analyze
 * Análise clínica da transcrição (hipótese diagnóstica + evidências)
 */
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      res.status(400).json({ error: 'Transcrição não fornecida.' });
      return;
    }
    console.log('[AI] Analyzing clinical transcript...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Você é um assistente médico especializado em Clínica Médica.
Com base no relato do paciente (transcrição), forneça um JSON com a seguinte estrutura:
{
  "hypothesis": "Nome da doença/hipótese principal",
  "cid10": "Código CID-10 da hipótese principal",
  "confidence": "Porcentagem de confiança (ex: '92%')",
  "differential": "Diagnóstico diferencial provável",
  "differential_cid": "Código CID-10 do diferencial",
  "evidence_list": ["Evidência 1 encontrada no texto", "Evidência 2..."]
}
Responda APENAS com o JSON válido.` },
        { role: 'user', content: `Relato do paciente:\n${transcript}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });
    const aiAnalysis = JSON.parse(completion.choices[0].message.content ?? '{}');
    res.json(aiAnalysis);
  } catch (error: any) {
    console.error('[AI] Erro na análise clínica:', error);
    res.status(500).json({ error: 'Erro ao analisar os dados do paciente.' });
  }
});

/**
 * POST /api/v1/ai/pharmacist
 * Pré-análise farmacêutica: causas, diagnósticos, medicamentos e exames
 */
router.post('/pharmacist', async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportedIssues } = req.body;
    if (!reportedIssues) {
      res.status(400).json({ error: 'Problemas relatados não fornecidos.' });
      return;
    }
    console.log(`[AI] Generating Pharmacist insights for: ${reportedIssues.substring(0, 50)}...`);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Você é um Especialista em Farmácia Clínica e Medicina Diagnóstica.
Forneça um JSON com a seguinte estrutura estrita:
{
  "causes": ["..."],
  "diagnoses": ["..."],
  "medications": ["..."],
  "exams": ["..."]
}
Responda APENAS com o JSON válido, sem texto markdown em volta.` },
        { role: 'user', content: `Sintomas/Problemas Relatados:\n${reportedIssues}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });
    const pharmacistInsights = JSON.parse(completion.choices[0].message.content ?? '{}');
    res.json(pharmacistInsights);
  } catch (error: any) {
    console.error('[AI] Erro no painel farmacêutico:', error);
    res.status(500).json({ error: 'Erro ao obter conselhos do farmacêutico virtual.' });
  }
});

export default router;
