import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client if GEMINI_API_KEY is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check and AI status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    engine: 'AuraWave Multi-Track AI Music Engine',
  });
});

// AI Music Generation Endpoint (Full multi-track composition with note sequences and patterns)
app.post('/api/ai/compose', async (req, res) => {
  try {
    const { prompt, genre, mood, tempo, scale } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY not configured. Use the built-in procedural offline synthesizer engine.',
        useOffline: true,
      });
    }

    const systemPrompt = `You are a master music producer, sound designer, and music theory AI.
You generate intricate, musically harmonious, polyphonic FULL-LENGTH song compositions formatted as strict JSON.
The compositions are rendered directly by a Web Audio API procedural synthesizer engine.

Music Scale Note Reference:
- Notes are represented as MIDI note numbers (e.g. C3=48, D3=50, E3=52, F3=53, G3=55, A3=57, B3=59, C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, B4=71, C5=72)
- Note durations are in 16th note steps (1 step = 1/16th of a bar). A standard 4/4 bar has 16 steps (0 to 15). 2 bars = 32 steps (0 to 31).
- Drums use a 16-step or 32-step boolean array [true/false] for: kick, snare, hihatClosed, hihatOpen, clap, tom.
- Bass notes have: { note: number (MIDI 24-48), step: number (0-31), duration: number (in steps, e.g. 1, 2, 4), velocity: number (0.1 to 1.0) }
- Chord progression: array of chords, each with { name: string, notes: number[] (MIDI 48-72), step: number (0-31), duration: number }
- Lead/Melody notes: array of { note: number (MIDI 60-84), step: number (0-31), duration: number, velocity: number }

Full Song Sections:
- The song must have 6 to 8 structured sections spanning 40 to 60 bars total (~1.5 to 2.5 minutes):
  1. Intro (4 bars)
  2. Verse 1 (8 bars)
  3. Rising Build-Up (4 bars) - with rising riser sweep and snare roll!
  4. THE DROP / Chorus 1 (8 bars) - explosive 808 drop hit, high energy!
  5. Verse 2 / Break (8 bars)
  6. Rising Build-Up 2 (4 bars)
  7. THE CLIMAX DROP (8 bars)
  8. Outro (4 bars)

Return STRICT JSON ONLY, adhering to this TypeScript schema:
{
  "title": string,
  "genre": string,
  "mood": string,
  "tempo": number (70 to 160),
  "key": string (e.g. "A Minor", "D Dorian", "C# Minor"),
  "scaleType": string (e.g. "minor", "major", "dorian", "phrygian"),
  "energy": number (1 to 10),
  "description": string,
  "fullDurationSec": number (between 90 and 160),
  "primaryDropTimeSec": number (between 30 and 65),
  "hitTimingsSec": number[],
  "drums": {
    "kick": boolean[], // 32 items
    "snare": boolean[], // 32 items
    "hihatClosed": boolean[], // 32 items
    "hihatOpen": boolean[], // 32 items
    "clap": boolean[], // 32 items
    "tom": boolean[] // 32 items
  },
  "bass": [
    { "note": number, "step": number, "duration": number, "velocity": number }
  ],
  "chords": [
    { "name": string, "notes": number[], "step": number, "duration": number }
  ],
  "lead": [
    { "note": number, "step": number, "duration": number, "velocity": number }
  ],
  "synthSettings": {
    "bassType": "sub808" | "synthwave" | "acid" | "pluck",
    "leadType": "saw" | "square" | "fm" | "plucked",
    "chordType": "pad" | "supersaw" | "electric_piano" | "strings",
    "filterCutoff": number (200 to 8000),
    "resonance": number (1 to 12),
    "reverbDecay": number (0.5 to 5.0),
    "delayTime": number (0.1 to 0.8)
  },
  "sections": [
    {
      "id": string,
      "name": string,
      "type": "intro" | "verse" | "rising_build" | "drop" | "break" | "outro",
      "bars": number,
      "energy": number,
      "hasRisingSweep": boolean,
      "hasDropHit": boolean,
      "hasSnareRoll": boolean,
      "lyricsLines": string[]
    }
  ],
  "lyricsHook": string
}`;

    const userPrompt = `Compose an original FULL-LENGTH AI song based on:
Prompt: ${prompt || 'Upbeat futuristic cyberpunk synthwave with driving rhythm'}
Genre: ${genre || 'Synthwave'}
Mood: ${mood || 'Energetic & Uplifting'}
Requested Tempo: ${tempo || 120} BPM
Key: ${scale || 'Minor'}

Include real rhyming lyrics for each section (Verse 1, Verse 2, and the high-energy Drop Hook chant). Make sure the Rising Build-Up builds intense anticipation, leading straight into an explosive high-energy Drop!`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.85,
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);

    res.json({
      success: true,
      composition: parsed,
    });
  } catch (error: any) {
    console.error('Error in AI compose:', error);
    res.status(500).json({
      error: error.message || 'Failed to compose song',
      fallback: true,
    });
  }
});

// AI Vocal Hook / Speech Generation using gemini-3.8-flash-lite-tts
app.post('/api/ai/vocal', async (req, res) => {
  try {
    const { text, style, voiceName = 'Zephyr' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY not configured for TTS vocals.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 200),
              speechMetadata: {
                style: style || 'Rhythmic electronic music vocal chop, energetic punchy phrase',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from vocal model' });
    }

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('Error generating vocal:', error);
    res.status(500).json({ error: error.message || 'Failed to generate vocal' });
  }
});

// AI Style & Prompt Suggestions
app.post('/api/ai/suggest', async (req, res) => {
  try {
    if (!ai) {
      return res.json({
        suggestions: [
          'Cyberpunk neon chase with distorted 808s and fast rolling hi-hats',
          'Late night Tokyo lo-fi hip hop with mellow Rhodes and vinyl warmth',
          'Energetic French electro house with funky bassline and filtered synths',
          'Epic cinematic space ambient with ethereal choir pads and sub pulses',
          '80s retrowave synthpop with gated snares and nostalgic arpeggios',
          'Heavy trap banger with pitch-sliding 808s and dark flute melody',
        ],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Give 6 diverse, vivid, inspiring music generation prompts spanning different genres (Synthwave, Lo-Fi, Trap, Cyberpunk, Ambient, Pop). Return a JSON array of strings.',
      config: {
        responseMimeType: 'application/json',
      },
    });

    const list = JSON.parse(response.text || '[]');
    res.json({ suggestions: Array.isArray(list) ? list : [] });
  } catch {
    res.json({
      suggestions: [
        'Cyberpunk neon chase with distorted 808s and fast rolling hi-hats',
        'Late night Tokyo lo-fi hip hop with mellow Rhodes and vinyl warmth',
        'Energetic French electro house with funky bassline and filtered synths',
        'Epic cinematic space ambient with ethereal choir pads and sub pulses',
        '80s retrowave synthpop with gated snares and nostalgic arpeggios',
        'Heavy trap banger with pitch-sliding 808s and dark flute melody',
      ],
    });
  }
});

// AI Lyrics generator endpoint
app.post('/api/ai/lyrics', async (req, res) => {
  try {
    const { topic, genre } = req.body;
    if (!ai) {
      return res.json({
        lyrics: "Take me back\nTake me back\nWhere is home\nUnder the neon glow\nWe found a place we used to know",
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Write a short, poetic, emotional song lyric (4-8 lines) for a ${genre || 'pop'} song about: ${topic || 'nostalgia and returning home'}. Do not include section labels, just pure lyrics.`,
    });

    res.json({ lyrics: response.text?.trim() || "Take me back\nTake me back\nWhere is home" });
  } catch {
    res.json({
      lyrics: "Take me back\nTake me back\nWhere is home\nLost in the digital rain\nFinding my way again",
    });
  }
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // Dynamic import of Vite in development
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
