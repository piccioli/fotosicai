const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const { absPath } = require('./storage');

const MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6';

let client;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

// Load stage list once for system prompt context
let stageListText = '';
function loadStageContext() {
  if (stageListText) return stageListText;
  const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../../DATA');
  const csvPath = path.join(DATA_DIR, 'sentiero_italia_tappe_id_name - MAPPING.csv');
  try {
    const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);
    stageListText = lines.map((l) => l.split(',')[1]?.trim()).filter(Boolean).join(', ');
  } catch {
    stageListText = '';
  }
  return stageListText;
}

function systemPrompt() {
  const stages = loadStageContext();
  return `Sei un assistente specializzato nel Sentiero Italia CAI (SICAI), il percorso escursionistico più lungo d'Italia.
Il tuo compito è generare un titolo breve e una caption descrittiva per fotografie caricate da escursionisti lungo il percorso.

Tappe SICAI disponibili: ${stages}

Linee guida:
- Lingua: italiano
- Titolo: massimo 60 caratteri, evocativo e descrittivo del soggetto principale
- Caption: massimo 280 caratteri, tono naturalistico/escursionistico, include contesto geografico quando utile
- Non affermare fatti non verificabili dall'immagine
- Non usare hashtag o emoji
- Rispondi SOLO con JSON valido nel formato: {"titolo": "...", "caption": "..."}`;
}

/**
 * Generate title and caption for an image using Claude vision.
 * @param {string} mediumPath - relative path under STORAGE_DIR
 * @param {object} meta - { comune, regione, provincia, stage_ref, data_scatto }
 * @returns {Promise<{titolo: string, caption: string}>}
 */
async function generateTitleCaption(mediumPath, meta) {
  const client = getClient();

  const imgBuffer = fs.readFileSync(absPath(mediumPath));
  const base64 = imgBuffer.toString('base64');

  const metaParts = [
    meta.stage_ref ? `Tappa SICAI: ${meta.stage_ref}` : null,
    meta.comune ? `Comune: ${meta.comune}` : null,
    meta.regione ? `Regione: ${meta.regione}` : null,
    meta.data_scatto ? `Data scatto: ${meta.data_scatto.slice(0, 10)}` : null,
  ].filter(Boolean).join('\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: [
      {
        type: 'text',
        text: systemPrompt(),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
          },
          {
            type: 'text',
            text: `Genera titolo e caption per questa foto.\n${metaParts}`,
          },
        ],
      },
    ],
  });

  const raw = response.content[0]?.text || '{}';
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    titolo: String(parsed.titolo || '').slice(0, 60),
    caption: String(parsed.caption || '').slice(0, 280),
  };
}

module.exports = { generateTitleCaption };
