import { Router, Request, Response } from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const router = Router();
const openai = new OpenAI();

// Setup multer for temporary audio storage
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max (Whisper limit)
  },
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

/**
 * Endpoint to transcribe an audio file using OpenAI Whisper
 */
router.post('/transcribe', upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Nenhum arquivo de áudio enviado.' });
      return;
    }

    // Rename to include extension (important for Whisper to identify format)
    const newPath = `${file.path}.webm`;
    fs.renameSync(file.path, newPath);

    console.log(`[AI] Transcribing audio file...`);
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(newPath),
      model: 'whisper-1',
      language: 'pt',
    });

    // Cleanup temporary file
    fs.unlinkSync(newPath);

    res.json({ text: transcription.text });
  } catch (error: any) {
    console.error('[AI] Erro na transcrição:', error);
    res.status(500).json({ error: 'Erro ao transcrever o áudio.' });
  }
});

/**
 * Endpoint to analyze the clinical transcript using ChatGPT
 */
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { transcript } = req.body;
    
    if (!transcript) {
      res.status(400).json({ error: 'Transcrição não fornecida.' });
      return;
    }

    console.log(`[AI] Analyzing clinical transcript...`);
    
    // System prompt defining the expected JSON structure
    const systemPrompt = `
Você é um assistente médico especializado em Clínica Médica.
Com base no relato do paciente (transcrição), forneça um JSON com a seguinte estrutura:
{
  "hypothesis": "Nome da doença/hipótese principal",
  "cid10": "Código CID-10 da hipótese principal",
  "confidence": "Porcentagem de confiança (ex: '92%')",
  "differential": "Diagnóstico diferencial provável",
  "differential_cid": "Código CID-10 do diferencial",
  "evidence_list": [
    "Evidência 1 encontrada no texto",
    "Evidência 2..."
  ]
}

Responda APENAS com o JSON válido.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Relato do paciente:\n${transcript}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Resposta da OpenAI veio vazia");
    }

    const aiAnalysis = JSON.parse(responseContent);
    res.json(aiAnalysis);
  } catch (error: any) {
    console.error('[AI] Erro na análise clínica:', error);
    res.status(500).json({ error: 'Erro ao analisar os dados do paciente.' });
  }
});

/**
 * Endpoint to pre-analyze reported issues simulating a Pharmacist Specialist
 */
router.post('/pharmacist', async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportedIssues } = req.body;
    
    if (!reportedIssues) {
      res.status(400).json({ error: 'Problemas relatados não fornecidos.' });
      return;
    }

    console.log(`[AI] Generating Pharmacist insights for: ${reportedIssues.substring(0, 50)}...`);
    
    const systemPrompt = `
Você é um Especialista em Farmácia Clínica e Medicina Diagnóstica. 
Baseado nos sintomas e problemas relatados pelo paciente na triagem, aja proativamente e forneça um JSON com a seguinte estrutura estrita:
{
  "causes": ["Lista de strings das possíveis causas ou agentes etiológicos"],
  "diagnoses": ["Lista de strings das possíveis doenças ou síndromes de diagnóstico diferencial curtas"],
  "medications": ["Lista de strings de princípios ativos genéricos curtos, classes ou pomadas que tratam as causas listadas"],
  "exams": ["Lista de strings de exames laboratoriais, de rotina ou de imagem (raios-X/TC) úteis para refinar ou confirmar as causas, Ex: 'Hemograma Completo', 'Radiografia de Tórax'"]
}

Responda APENAS com o JSON válido, sem texto markdown em volta. NUNCA fuja desse formato. Seja conciso e realista com as opções clínicas usuais de PS.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Sintomas/Problemas Relatados:\n${reportedIssues}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // Slightly more creative to find related exams/meds
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Resposta da OpenAI veio vazia");
    }

    const pharmacistInsights = JSON.parse(responseContent);
    res.json(pharmacistInsights);
  } catch (error: any) {
    console.error('[AI] Erro no painel farmacêutico:', error);
    res.status(500).json({ error: 'Erro ao obter conselhos do farmacêutico virtual.' });
  }
});

export default router;
