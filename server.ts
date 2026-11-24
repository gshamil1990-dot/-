import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MASTER_PIN = (process.env.MASTER_STUDIO_PIN || '2026').trim();

function timingSafePinMatch(input: string, expected: string): boolean {
  const a = Buffer.from(input.trim(), 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
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

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw === 'API_KEY_MISSING') {
    return {
      status: 503,
      message: 'API-ключ Gemini не настроен. Проверьте ключ в панели Settings > Secrets.',
    };
  }
  if (raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID') || raw.includes('403')) {
    return {
      status: 403,
      message: 'Доступ к Gemini API отклонён. Проверьте выбранный API-ключ в Settings > Secrets.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message: 'Превышен лимит запросов Gemini API. Убедитесь, что подключён ключ с активным биллингом.',
    };
  }
  return {
    status: 500,
    message: 'Не удалось сгенерировать изображение. Попробуйте повторить запрос через несколько секунд.',
  };
}

interface GenerateStudioBody {
  section?: 'coloring' | 'haircuts' | 'care' | 'styling';
  techniqueTitle?: string;
  techniqueSubtitle?: string;
  basePrompt?: string;
  tone?: string;
  hairLength?: string;
  lighting?: string;
  angle?: string;
  hairTexture?: string;
  careEffect?: string;
  careAtmosphere?: string;
  stylingPreset?: string;
  stylingResult?: string;
  stylingTool?: string;
  customNote?: string;
}

const STYLING_SYSTEM_DIRECTIVE =
  'High-fashion luxury hair salon editorial photograph of a real woman model photographed from a three-quarter rear or back-side profile showcasing salon hairstyle architecture, wearing minimalist matte black evening attire against a seamless deep matte obsidian dark charcoal studio backdrop (#141211) with warm champagne-gold directional rim lighting (#D9A773).';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/master/verify-pin', (req: Request, res: Response) => {
    const pin = typeof req.body?.pin === 'string' ? req.body.pin : '';
    if (!pin || pin.length > 32) {
      res.status(400).json({ ok: false, message: 'Введите корректный PIN-код.' });
      return;
    }
    if (!timingSafePinMatch(pin, MASTER_PIN)) {
      res.status(401).json({ ok: false, message: 'Неверный PIN-код мастера.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/studio/generate', async (req: Request, res: Response) => {
    const headerPin = typeof req.headers['x-master-pin'] === 'string' ? req.headers['x-master-pin'] : '';
    if (!headerPin || !timingSafePinMatch(headerPin, MASTER_PIN)) {
      res.status(401).json({ error: 'Сессия мастера не подтверждена. Введите PIN-код повторно.' });
      return;
    }

    const body = (req.body || {}) as GenerateStudioBody;
    const section: 'coloring' | 'haircuts' | 'care' | 'styling' =
      body.section === 'haircuts'
        ? 'haircuts'
        : body.section === 'care'
          ? 'care'
          : body.section === 'styling'
            ? 'styling'
            : 'coloring';
    const techniqueTitle = (body.techniqueTitle || '').trim().slice(0, 140);
    const techniqueSubtitle = (body.techniqueSubtitle || '').trim().slice(0, 140);
    const basePrompt = (body.basePrompt || '').trim().slice(0, 400);
    const defaultTone =
      section === 'haircuts'
        ? 'Глубокий эспрессо'
        : section === 'care'
          ? 'Тёплый шёлковый каштан'
          : section === 'styling'
            ? 'Тёплый каштаново-карамельный'
            : 'Теплый жемчужно-шампань';
    const tone = (body.tone || defaultTone).trim().slice(0, 100);
    const hairLength = (body.hairLength || 'Длинные мягкие волны').trim().slice(0, 100);
    const lighting = (body.lighting || 'Теплый контровой свет студии').trim().slice(0, 100);
    const angle = (body.angle || 'Три четверти (акцент на силуэт)').trim().slice(0, 100);
    const hairTexture = (body.hairTexture || 'Зеркальный гладкий срез').trim().slice(0, 100);
    const careEffect = (body.careEffect || 'Эффект жидкого стекла и зеркального блеска').trim().slice(0, 120);
    const careAtmosphere = (body.careAtmosphere || 'Флакон с пипеткой и каплями эликсира на камне').trim().slice(0, 120);
    const stylingPreset = (body.stylingPreset || '').trim().slice(0, 260);
    const stylingResult = (
      body.stylingResult ||
      'Скульптурные глянцевые S-волны (Голливуд)'
    )
      .trim()
      .slice(0, 140);
    const stylingTool = (
      body.stylingTool ||
      'Три четверти со спины (акцент на силуэт причёски)'
    )
      .trim()
      .slice(0, 140);
    const customNote = (body.customNote || '').trim().slice(0, 260);

    if (!techniqueTitle) {
      const missingMsg =
        section === 'haircuts'
          ? 'Выберите стрижку перед генерацией.'
          : section === 'care'
            ? 'Выберите спа-процедуру перед генерацией.'
            : section === 'styling'
              ? 'Выберите укладку или причёску перед генерацией.'
              : 'Выберите технику окрашивания перед генерацией.';
      res.status(400).json({ error: missingMsg });
      return;
    }

    const promptLines =
      section === 'haircuts'
        ? [
            'High-fashion luxury hair salon editorial portrait photograph of a real woman model showcasing precision haircutting architecture.',
            `Featured haircut style: ${techniqueTitle}${techniqueSubtitle ? ` (${techniqueSubtitle})` : ''}.`,
            basePrompt ? `Architectural cut details: ${basePrompt}.` : '',
            `Camera angle and composition: ${angle}.`,
            `Model hair color: ${tone}.`,
            `Styling finish and texture: ${hairTexture}.`,
            'Studio atmosphere & lighting: deep matte obsidian dark charcoal studio background (#141211), warm champagne-gold directional rim lighting emphasizing clean cut perimeter, sculpted geometry, and healthy glossy silk hair texture.',
            customNote ? `Stylist art direction: ${customNote}.` : '',
            'Shot on medium-format Hasselblad 85mm f/2.0 lens, Vogue Beauty editorial quality, natural realistic skin, crisp haircut silhouette, clean vertical 3:4 portrait framing. Strictly no text, no logos, no watermarks, no collages.',
          ].filter(Boolean)
        : section === 'care'
          ? [
              'Luxury editorial beauty still-life studio photograph — STRICTLY NO FACES, NO PEOPLE, NO HEADS, NO HANDS, NO HUMAN SKIN anywhere in the frame.',
              'Subject & composition: an artfully draped flowing lustrous strand of real glossy hair laid directly across a dark matte obsidian basalt slate stone surface (#141211), paired beside an unbranded luxury salon cosmetic vessel.',
              `Featured salon spa ritual: ${techniqueTitle}${techniqueSubtitle ? ` (${techniqueSubtitle})` : ''}.`,
              basePrompt ? `Specific hair & vessel composition: ${basePrompt}.` : '',
              `Hair strand texture & treatment finish: ${careEffect}.`,
              `Hair strand shade: ${tone}.`,
              `Cosmetic vessel format & styling: ${careAtmosphere}, unbranded minimalist smoked or crystal glass with warm brushed champagne-gold hardware.`,
              'Lighting & palette: deep dark matte slate stone backdrop (#141211), warm champagne-gold directional rim illumination (#D9A773) gliding across individual silky hair fibers and gleaming glass reflections.',
              customNote ? `Stylist art direction: ${customNote}.` : '',
              'Shot on medium-format Hasselblad 90mm macro lens, haute-cosmetics editorial quality, clean vertical 3:4 framing. Strictly NO faces, NO bodies, NO text, NO printed labels, NO logos, NO watermarks.',
            ].filter(Boolean)
          : section === 'styling'
            ? [
                STYLING_SYSTEM_DIRECTIVE,
                `Featured hairstyle: ${techniqueTitle}${techniqueSubtitle ? ` (${techniqueSubtitle})` : ''}.`,
                basePrompt ? `Hairstyle silhouette & finish details: ${basePrompt}.` : '',
                stylingPreset ? `Editorial composition direction: ${stylingPreset}.` : '',
                `Styling texture & finish: ${stylingResult}.`,
                `Camera framing & angle: ${stylingTool}.`,
                `Model hair shade: ${tone}.`,
                customNote ? `Stylist art direction: ${customNote}.` : '',
                'Shot on medium-format Hasselblad 85mm f/2.0 lens, Vogue Beauty editorial quality, crisp realistic individual hair strands, healthy satin gloss, clean vertical 3:4 portrait framing. Strictly no text, no logos, no watermarks, no collages.',
              ].filter(Boolean)
            : [
                'High-fashion luxury hair salon editorial portrait photograph of a real woman model.',
                `Featured hair coloring technique: ${techniqueTitle}${techniqueSubtitle ? ` (${techniqueSubtitle})` : ''}.`,
                basePrompt ? `Technical coloring detail: ${basePrompt}.` : '',
                `Color nuance and tone: ${tone}.`,
                `Hair length and silhouette: ${hairLength}.`,
                `Studio atmosphere & lighting: ${lighting}, deep matte obsidian dark charcoal background (#141211), subtle warm champagne-gold rim illumination highlighting silk-like multidimensional hair strands.`,
                customNote ? `Stylist art direction: ${customNote}.` : '',
                'Shot on medium-format Hasselblad 85mm f/2.0 lens, Vogue Beauty editorial quality, natural skin texture, crisp individual hair strands, glossy salon finish, clean vertical 3:4 portrait framing. Strictly no text, no logos, no watermarks, no collages.',
              ].filter(Boolean);

    const finalPrompt = promptLines.join(' ');

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: finalPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '3:4',
          },
        },
      });

      let imageDataUrl: string | null = null;
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageDataUrl) {
        res.status(502).json({
          error: 'Модель не вернула изображение. Попробуйте скорректировать пожелание и повторить генерацию.',
        });
        return;
      }

      const summaryNote = (
        section === 'haircuts'
          ? [angle, tone, hairTexture, customNote]
          : section === 'care'
            ? [careEffect, tone, careAtmosphere, customNote]
            : section === 'styling'
              ? [stylingResult, stylingTool, tone, customNote]
              : [tone, hairLength, customNote]
      )
        .filter(Boolean)
        .join(' · ')
        .slice(0, 750);
      res.json({
        imageDataUrl,
        promptUsed: summaryNote || techniqueTitle,
      });
    } catch (err) {
      console.error('Studio generate error:', err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MAGDANA Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
