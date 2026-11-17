import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import type { PlantIdentificationResult } from './src/types/plant.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const PRIMARY_MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const identificationSchema = {
  type: Type.OBJECT,
  properties: {
    isPlant: {
      type: Type.BOOLEAN,
      description: 'True if the photo depicts a living plant, foliage, blossom, succulent, herb, tree, or botanical specimen.',
    },
    nonPlantReason: {
      type: Type.STRING,
      description: 'If isPlant is false, briefly describe what is visible instead and guide the user to upload a clear plant photo.',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Identification confidence percentage from 0 to 100.',
    },
    commonName: {
      type: Type.STRING,
      description: 'Most widely used English common name.',
    },
    scientificName: {
      type: Type.STRING,
      description: 'Accepted binomial Latin name (Genus species).',
    },
    synonyms: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Up to 3 alternative common names or former botanical names.',
    },
    family: {
      type: Type.STRING,
      description: 'Botanical family (e.g., Crassulaceae, Orchidaceae, Lamiaceae, Araceae).',
    },
    genus: {
      type: Type.STRING,
      description: 'Botanical genus name.',
    },
    origin: {
      type: Type.STRING,
      description: 'Native geographic range and natural habitat.',
    },
    plantType: {
      type: Type.STRING,
      description: 'Growth habit (e.g., Rosette succulent, Epiphytic orchid, Woody perennial herb).',
    },
    identifyingTraits: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          trait: { type: Type.STRING, description: 'Morphological feature category (e.g., Leaf Margin, Venation, Inflorescence).' },
          detail: { type: Type.STRING, description: 'Specific visible evidence observed in this photograph.' },
        },
        required: ['trait', 'detail'],
      },
      description: '3 to 4 concrete visual features observed in the uploaded photo that establish this species match.',
    },
    healthAssessment: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: 'Must be one of: Healthy, Mild Stress, Needs Attention, Critical, or Unclear.',
        },
        summary: {
          type: Type.STRING,
          description: 'Concise clinical summary of the specimen condition shown in the photo.',
        },
        observations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '2 to 4 visual observations from the specimen (leaf turgor, chlorosis, spotting, new shoots, pests).',
        },
        immediateAction: {
          type: Type.STRING,
          description: 'Single most important next step right now for this specimen.',
        },
      },
      required: ['status', 'summary', 'observations', 'immediateAction'],
    },
    careGuide: {
      type: Type.OBJECT,
      properties: {
        light: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.STRING },
            hoursPerDay: { type: Type.STRING },
            placement: { type: Type.STRING },
          },
          required: ['level', 'hoursPerDay', 'placement'],
        },
        water: {
          type: Type.OBJECT,
          properties: {
            frequency: { type: Type.STRING },
            recommendedIntervalDays: {
              type: Type.INTEGER,
              description: 'Typical interval in days between waterings during active growth (e.g., 7, 14).',
            },
            method: { type: Type.STRING },
            soilMoistureCue: { type: Type.STRING },
          },
          required: ['frequency', 'recommendedIntervalDays', 'method', 'soilMoistureCue'],
        },
        soil: {
          type: Type.OBJECT,
          properties: {
            mix: { type: Type.STRING },
            pHRange: { type: Type.STRING },
            drainage: { type: Type.STRING },
          },
          required: ['mix', 'pHRange', 'drainage'],
        },
        climate: {
          type: Type.OBJECT,
          properties: {
            tempRangeC: { type: Type.STRING },
            tempRangeF: { type: Type.STRING },
            humidityRange: { type: Type.STRING },
            airflowNote: { type: Type.STRING },
          },
          required: ['tempRangeC', 'tempRangeF', 'humidityRange', 'airflowNote'],
        },
        fertilizer: {
          type: Type.OBJECT,
          properties: {
            schedule: { type: Type.STRING },
            npkRatio: { type: Type.STRING },
            seasonalNote: { type: Type.STRING },
          },
          required: ['schedule', 'npkRatio', 'seasonalNote'],
        },
        pruningAndRepotting: {
          type: Type.OBJECT,
          properties: {
            pruning: { type: Type.STRING },
            repottingFrequency: { type: Type.STRING },
            propagationMethod: { type: Type.STRING },
          },
          required: ['pruning', 'repottingFrequency', 'propagationMethod'],
        },
      },
      required: ['light', 'water', 'soil', 'climate', 'fertilizer', 'pruningAndRepotting'],
    },
    seasonalCalendar: {
      type: Type.OBJECT,
      properties: {
        spring: { type: Type.STRING, description: 'Concise spring care focus (growth flush, repotting, feeding).' },
        summer: { type: Type.STRING, description: 'Concise summer care focus (hydration, heat/sun protection).' },
        autumn: { type: Type.STRING, description: 'Concise autumn care focus (tapering fertilizer, indoor transition).' },
        winter: { type: Type.STRING, description: 'Concise winter care focus (dormancy rest, reduced watering, frost/draft protection).' },
      },
      required: ['spring', 'summer', 'autumn', 'winter'],
    },
    toxicity: {
      type: Type.OBJECT,
      properties: {
        pets: { type: Type.STRING },
        humans: { type: Type.STRING },
        note: { type: Type.STRING },
      },
      required: ['pets', 'humans', 'note'],
    },
    commonIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          symptom: { type: Type.STRING },
          cause: { type: Type.STRING },
          remedy: { type: Type.STRING },
        },
        required: ['symptom', 'cause', 'remedy'],
      },
      description: '3 to 4 common problems for this species and actionable fixes.',
    },
    alternativeMatches: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          commonName: { type: Type.STRING },
          scientificName: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          distinguishingFeature: { type: Type.STRING },
        },
        required: ['commonName', 'scientificName', 'confidence', 'distinguishingFeature'],
      },
      description: 'Up to 3 close botanical lookalikes and how to tell them apart.',
    },
  },
  required: [
    'isPlant',
    'confidence',
    'commonName',
    'scientificName',
    'synonyms',
    'family',
    'genus',
    'origin',
    'plantType',
    'identifyingTraits',
    'healthAssessment',
    'careGuide',
    'seasonalCalendar',
    'toxicity',
    'commonIssues',
    'alternativeMatches',
  ],
};

function parseGeminiError(err: unknown): { status: number; message: string; isTransient: boolean } {
  const isAbort = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
  if (isAbort) {
    return {
      status: 504,
      message: 'The recognition model timed out due to temporary demand. Please try again in a moment.',
      isTransient: true,
    };
  }

  const raw = err instanceof Error ? err.message : String(err);
  let status = 500;
  let message = raw || 'Unable to process botanical recognition request.';

  try {
    const parsed = JSON.parse(raw) as { error?: { code?: number; message?: string } };
    if (parsed?.error) {
      if (typeof parsed.error.code === 'number') status = parsed.error.code;
      if (typeof parsed.error.message === 'string') message = parsed.error.message;
    }
  } catch {
    if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED')) status = 403;
    else if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) status = 429;
    else if (raw.includes('UNAVAILABLE') || raw.includes('503')) status = 503;
  }

  const isTransient = status === 503 || status === 429 || raw.includes('UNAVAILABLE') || raw.includes('high demand');
  return { status, message, isTransient };
}

async function callModelWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: unknown;
    systemInstruction: string;
    responseMimeType?: string;
    responseSchema?: unknown;
  }
) {
  let lastError: unknown;

  try {
    return await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: params.contents as never,
      config: {
        abortSignal: AbortSignal.timeout(22000),
        systemInstruction: params.systemInstruction,
        ...(params.responseMimeType ? { responseMimeType: params.responseMimeType } : {}),
        ...(params.responseSchema ? { responseSchema: params.responseSchema } : {}),
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });
  } catch (err) {
    lastError = err;
    const parsed = parseGeminiError(err);
    if (!parsed.isTransient) {
      throw err;
    }
  }

  await new Promise((r) => setTimeout(r, 500));

  try {
    return await ai.models.generateContent({
      model: FALLBACK_MODEL,
      contents: params.contents as never,
      config: {
        abortSignal: AbortSignal.timeout(22000),
        systemInstruction: params.systemInstruction,
        ...(params.responseMimeType ? { responseMimeType: params.responseMimeType } : {}),
        ...(params.responseSchema ? { responseSchema: params.responseSchema } : {}),
      },
    });
  } catch (fallbackErr) {
    throw fallbackErr || lastError;
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '16mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', hasKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  app.post('/api/identify', async (req, res) => {
    try {
      const { imageBase64, mimeType, partFocus, environment, notes } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        partFocus?: string;
        environment?: string;
        notes?: string;
      };

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'Please provide a plant photograph to analyze.' });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const resolvedMimeType = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

      const ai = getAiClient();

      const promptParts = [
        'Examine this plant photograph thoroughly as an expert botanical taxonomist and consulting horticulturist.',
        partFocus ? `Subject focus selected by grower: ${partFocus}.` : '',
        environment ? `Growing environment: ${environment}. Tailor placement, watering cadence, and winter instructions to this setting.` : '',
        notes && notes.trim() ? `Grower field observations: "${notes.trim()}"` : '',
        'Identify the exact species, cite concrete morphological features visible in this photograph, evaluate visible health/stress cues, provide a complete care matrix with a realistic watering interval in days, include a 4-season care calendar, toxicity warnings, common issues, and up to 3 lookalike species.',
      ].filter(Boolean);

      const response = await callModelWithFallback(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: resolvedMimeType,
                data: cleanBase64,
              },
            },
            {
              text: promptParts.join('\n'),
            },
          ],
        },
        systemInstruction:
          'You are a senior botanist and horticulturist. Deliver accurate taxonomic identification grounded in visible morphology and practical, species-specific cultivation care. If the image does not show a plant, set isPlant to false and explain clearly.',
        responseMimeType: 'application/json',
        responseSchema: identificationSchema,
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        res.status(502).json({ error: 'The recognition model returned an empty response. Please try a clearer photograph.' });
        return;
      }

      const parsed = JSON.parse(rawText) as PlantIdentificationResult;
      res.json(parsed);
    } catch (err: unknown) {
      console.error('Error in /api/identify:', err);
      const { status, message } = parseGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/care-chat', async (req, res) => {
    try {
      const { specimen, question, history, imageBase64, mimeType, environment } = req.body as {
        specimen?: PlantIdentificationResult;
        question?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
        imageBase64?: string;
        mimeType?: string;
        environment?: string;
      };

      if (!specimen || !question || !question.trim()) {
        res.status(400).json({ error: 'Both specimen context and a question are required.' });
        return;
      }

      const ai = getAiClient();

      const contextLines = [
        `Species: ${specimen.commonName} (${specimen.scientificName}), Family ${specimen.family}`,
        environment ? `Growing setting: ${environment}` : '',
        `Observed health: ${specimen.healthAssessment.status} — ${specimen.healthAssessment.summary}`,
        `Light: ${specimen.careGuide.light.level} (${specimen.careGuide.light.hoursPerDay})`,
        `Water: ${specimen.careGuide.water.frequency} (every ~${specimen.careGuide.water.recommendedIntervalDays} days; ${specimen.careGuide.water.soilMoistureCue})`,
        `Soil: ${specimen.careGuide.soil.mix} (pH ${specimen.careGuide.soil.pHRange})`,
      ].filter(Boolean).join('\n');

      const recentHistory = (history ?? [])
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'Grower' : 'Botanist'}: ${m.text}`)
        .join('\n');

      const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
            data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
          },
        });
      }

      parts.push({
        text: `${contextLines}\n\n${recentHistory ? `Prior Q&A:\n${recentHistory}\n\n` : ''}Grower question: ${question.trim()}\n\nAnswer concisely in 2–4 plain prose paragraphs or practical steps specific to this plant.`,
      });

      const response = await callModelWithFallback(ai, {
        contents: { parts },
        systemInstruction:
          'You are a practical horticultural specialist answering follow-up care questions grounded in the identified species and specimen photo. Avoid markdown clutter.',
      });

      res.json({ answer: response.text?.trim() || 'No guidance was returned for that question.' });
    } catch (err: unknown) {
      console.error('Error in /api/care-chat:', err);
      const { status, message } = parseGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  const distDir = path.resolve(__dirname, 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    ((process.env.npm_lifecycle_event === 'start' || path.basename(__filename) === 'server.js') &&
      fs.existsSync(path.join(distDir, 'index.html')));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Production build not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Folia Herbarium server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
