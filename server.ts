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
const MODEL_NAME = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
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
      description: 'True if the image clearly depicts a living plant, foliage, flower, tree, succulent, fern, or botanical specimen; false otherwise.',
    },
    nonPlantReason: {
      type: Type.STRING,
      description: 'If isPlant is false, explain concisely what appears in the image and invite the user to upload a clear plant photo.',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Identification confidence score from 0 to 100.',
    },
    commonName: {
      type: Type.STRING,
      description: 'Primary English common name of the identified plant species.',
    },
    scientificName: {
      type: Type.STRING,
      description: 'Accepted binomial Latin name (Genus species).',
    },
    family: {
      type: Type.STRING,
      description: 'Botanical family name (e.g., Araceae, Lamiaceae, Moraceae).',
    },
    origin: {
      type: Type.STRING,
      description: 'Native geographic region and natural biome.',
    },
    plantType: {
      type: Type.STRING,
      description: 'Botanical growth form (e.g., Tropical climbing aroid, Herbaceous perennial, Woody shrub).',
    },
    morphologicalNotes: {
      type: Type.STRING,
      description: 'Concise analysis of the visible morphological traits in the photograph (leaf shape, venation, fenestration, phyllotaxis, stem, inflorescence) supporting this identification.',
    },
    healthAssessment: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: 'Must be one of: Healthy, Needs Attention, Critical, or Unclear.',
        },
        summary: {
          type: Type.STRING,
          description: 'One-sentence clinical assessment of visible foliage vigor and condition.',
        },
        observations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Specific visual cues observed in the image (e.g., uniform chlorophyll tone, crisp leaf margins, slight tip browning).',
        },
      },
      required: ['status', 'summary', 'observations'],
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
            method: { type: Type.STRING },
            soilMoistureCue: { type: Type.STRING },
          },
          required: ['frequency', 'method', 'soilMoistureCue'],
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
          },
          required: ['tempRangeC', 'tempRangeF', 'humidityRange'],
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
    toxicity: {
      type: Type.OBJECT,
      properties: {
        pets: { type: Type.STRING, description: 'Clear safety rating for cats and dogs (e.g., Toxic to cats and dogs, Non-toxic).' },
        humans: { type: Type.STRING, description: 'Clear safety note for humans.' },
        note: { type: Type.STRING, description: 'Active compounds (e.g., calcium oxalate crystals) or handling precautions.' },
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
      description: '3 to 4 most common cultivation issues and practical fixes for this species.',
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
      description: 'Up to 3 plausible botanical lookalike species and how to distinguish them.',
    },
  },
  required: [
    'isPlant',
    'confidence',
    'commonName',
    'scientificName',
    'family',
    'origin',
    'plantType',
    'morphologicalNotes',
    'healthAssessment',
    'careGuide',
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
      message: 'The botanical recognition model is taking longer than expected due to high demand. Please try again in a moment.',
      isTransient: true,
    };
  }

  const raw = err instanceof Error ? err.message : String(err);
  let status = 500;
  let message = raw || 'Unable to reach botanical recognition model.';

  try {
    const parsed = JSON.parse(raw) as { error?: { code?: number; message?: string; status?: string } };
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

async function generateWithResilience(
  ai: GoogleGenAI,
  params: {
    contents: unknown;
    systemInstruction: string;
    responseMimeType?: string;
    responseSchema?: unknown;
  }
) {
  let lastError: unknown;

  // Attempt 1: Primary gemini-4-hydrogen
  try {
    return await ai.models.generateContent({
      model: MODEL_NAME,
      contents: params.contents as never,
      config: {
        abortSignal: AbortSignal.timeout(12000),
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

  // Attempt 2: Fallback to gemini-3.1-flash-lite during demand spikes or timeouts
  try {
    return await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: params.contents as never,
      config: {
        abortSignal: AbortSignal.timeout(18000),
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
      const { imageBase64, mimeType, notes } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        notes?: string;
      };

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'Please provide a valid plant image for identification.' });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const resolvedMimeType = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

      const ai = getAiClient();

      const promptLines = [
        'Examine this photograph carefully as an expert botanist and horticulturist.',
        '1. Determine whether the image contains a real plant or botanical specimen.',
        '2. Identify the exact species (scientific binomial name and common name) using visible morphological features (leaf margin, venation, fenestration, phyllotaxis, stem, flowers, or bark).',
        '3. Assess the visible health condition of the plant in this specific photograph (signs of chlorosis, necrosis, pests, overwatering, etiolation, or vigorous growth).',
        '4. Provide practical, species-specific cultivation instructions covering light, watering, soil pH/substrate, temperature/humidity, fertilizer, pruning/repotting, toxicity, and troubleshooting.',
        '5. List up to 3 plausible lookalike species and the key feature that separates them from your primary match.',
      ];

      if (notes && notes.trim()) {
        promptLines.push(`User field context note: "${notes.trim()}"`);
      }

      const response = await generateWithResilience(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: resolvedMimeType,
                data: cleanBase64,
              },
            },
            {
              text: promptLines.join('\n'),
            },
          ],
        },
        systemInstruction:
          'You are a senior botanical taxonomist and horticultural specialist at a botanical herbarium. Provide accurate, grounded, species-specific identification and practical cultivation guidance. Do not invent fake metrics; keep numeric temperature, humidity, pH, and confidence values clear and realistic.',
        responseMimeType: 'application/json',
        responseSchema: identificationSchema,
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        res.status(502).json({ error: 'The recognition model returned an empty response. Please try another photo.' });
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
      const { specimen, question, history, imageBase64, mimeType } = req.body as {
        specimen?: PlantIdentificationResult;
        question?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
        imageBase64?: string;
        mimeType?: string;
      };

      if (!specimen || !question || !question.trim()) {
        res.status(400).json({ error: 'Specimen context and question are required.' });
        return;
      }

      const ai = getAiClient();

      const contextSummary = [
        `Identified Species: ${specimen.commonName} (${specimen.scientificName}), Family ${specimen.family}.`,
        `Observed Health Status: ${specimen.healthAssessment.status} — ${specimen.healthAssessment.summary}`,
        `Light: ${specimen.careGuide.light.level} (${specimen.careGuide.light.hoursPerDay})`,
        `Water: ${specimen.careGuide.water.frequency} (${specimen.careGuide.water.soilMoistureCue})`,
        `Soil: ${specimen.careGuide.soil.mix} (pH ${specimen.careGuide.soil.pHRange})`,
        `Climate: ${specimen.careGuide.climate.tempRangeC}, Humidity ${specimen.careGuide.climate.humidityRange}`,
      ].join('\n');

      const historyText = (history ?? [])
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
        text: `${contextSummary}\n\n${historyText ? `Recent conversation:\n${historyText}\n\n` : ''}Grower question: ${question.trim()}\n\nRespond clearly in 2-4 concise paragraphs or practical steps tailored to this exact plant specimen. Use plain prose without markdown clutter.`,
      });

      const response = await generateWithResilience(ai, {
        contents: { parts },
        systemInstruction:
          'You are a consulting horticulturist answering practical plant care questions based on the identified species and specimen photograph. Be concrete, accurate, and concise.',
      });

      res.json({ answer: response.text?.trim() || 'No guidance could be generated for that question.' });
    } catch (err: unknown) {
      console.error('Error in /api/care-chat:', err);
      const { status, message } = parseGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  const distDir = path.resolve(__dirname, 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (process.env.npm_lifecycle_event === 'start' &&
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
    console.log(`Folia Herbarium server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
