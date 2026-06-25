import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Helper to check and initialize Gemini
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// 1. Meta Decks list (simulating Limitless TCG live meta)
const metaDecks = [
  {
    name: 'Charizard ex',
    archetype: 'Charizard ex / Pidgeot ex',
    share: 16.8,
    winRate: 54.2,
    imageUrl: 'https://images.pokemontcg.io/sv3-125.png',
    description: 'O deck mais resiliente do formato. Utiliza a habilidade do Pidgeot ex para buscar qualquer carta e o poder de ataque crescente do Charizard ex conforme o oponente pega cartas de prêmio.',
    cards: [
      { name: 'Charizard ex (OBF 125)', count: 3 },
      { name: 'Pidgeot ex (OBF 225)', count: 2 },
      { name: 'Arven (SVI 166)', count: 4 },
      { name: 'Iono (PAF 80)', count: 4 }
    ],
    rawList: `Pokémon: 19
4 Charmander OBF 26
1 Charmeleon OBF 124
3 Charizard ex OBF 125
2 Pidgey MEW 16
2 Pidgeot ex OBF 225
1 Rotom V LOR 58
1 Lumineon V BRS 40
1 Manaphy BRS 41
1 Radiant Charizard PGO 11
1 Fezandipiti ex TWM 96
1 Jirachi PAR 126
1 Duskull SFA 18

Trainer: 35
4 Arven SVI 166
3 Iono PAF 80
2 Boss's Orders PAL 172
1 Professor's Research SVI 190
1 Briar SCR 132
4 Buddy-Buddy Poffin TEF 144
4 Ultra Ball SVI 196
4 Rare Candy SVI 191
2 Super Rod PAL 188
1 Nest Ball SVI 181
1 Counter Catcher PAR 160
1 Pal Pad SVI 182
1 Hisuian Heavy Ball ASR 146
1 Sparkling Crystal SCR 142
1 Defiance Band SVI 169
1 Forest Seal Stone SIT 156
1 Collapsed Stadium BRS 137
1 Gravity Mountain SFA 74

Energy: 6
6 Basic Fire Energy SVE 2`
  },
  {
    name: 'Regidrago VSTAR',
    archetype: 'Regidrago VSTAR / Teal Mask Ogerpon',
    share: 14.5,
    winRate: 53.8,
    imageUrl: 'https://images.pokemontcg.io/sit-136.png',
    description: 'Extremamente versátil. Usa o ataque Apex Dragon para copiar ataques de qualquer dragão no descarte (como Giratina VSTAR ou Noivern ex), energizado rapidamente por Teal Mask Ogerpon ex.',
    cards: [
      { name: 'Regidrago VSTAR (SIT 136)', count: 3 },
      { name: 'Teal Mask Ogerpon ex (TWM 25)', count: 4 },
      { name: 'Energy Switch (SVI 173)', count: 4 },
      { name: 'Professor Sada\'s Vitality', count: 4 }
    ],
    rawList: `Pokémon: 17
3 Regidrago V SIT 135
3 Regidrago VSTAR SIT 136
3 Teal Mask Ogerpon ex TWM 25
1 Giratina VSTAR LOR 131
1 Noivern ex PAF 69
1 Haxorus TWM 156
1 Dragapult ex TWM 130
1 Kyurem SFA 47
1 Mew ex MEW 151
1 Radiant Charizard PGO 11
1 Fezandipiti ex TWM 96

Trainer: 31
4 Professor Sada's Vitality PAR 170
3 Iono PAF 80
2 Boss's Orders PAL 172
4 Ultra Ball SVI 196
4 Nest Ball SVI 181
4 Energy Switch SVI 173
4 Earthen Vessel PAR 163
2 Super Rod PAL 188
1 Superior Energy Retrieval PAL 189
1 Prime Catcher TEF 157
1 Pokégear 3.0 SVI 186
1 Lost Vacuum LOR 162

Energy: 12
6 Basic Grass Energy SVE 1
3 Basic Fire Energy SVE 2
3 Basic Psychic Energy SVE 13`
  },
  {
    name: 'Raging Bolt ex',
    archetype: 'Raging Bolt ex / Teal Mask Ogerpon',
    share: 13.2,
    winRate: 52.9,
    imageUrl: 'https://images.pokemontcg.io/tef-123.png',
    description: 'Dano explosivo ilimitado. Descarta energias em jogo para causar 70 de dano por energia, utilizando Ogerpon para acelerar energias de Grama e puxar cartas adicionais.',
    cards: [
      { name: 'Raging Bolt ex (TEF 123)', count: 4 },
      { name: 'Teal Mask Ogerpon ex (TWM 25)', count: 4 },
      { name: 'Professor Sada\'s Vitality (PAR 170)', count: 4 },
      { name: 'Earthen Vessel (PAR 163)', count: 4 }
    ],
    rawList: `Pokémon: 12
4 Raging Bolt ex TEF 123
4 Teal Mask Ogerpon ex TWM 25
1 Radiant Greninja ASR 46
1 Fezandipiti ex TWM 96
1 Flutter Mane TEF 78
1 Sandy Shocks ex PAR 108

Trainer: 35
4 Professor Sada's Vitality PAR 170
2 Iono PAF 80
1 Boss's Orders PAL 172
4 Earthen Vessel PAR 163
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
3 Pokégear 3.0 SVI 186
2 Energy Switch SVI 173
2 Bravery Charm PAL 173
1 Prime Catcher TEF 157
1 Superior Energy Retrieval PAL 189
1 Super Rod PAL 188
1 Lost Vacuum LOR 162
1 Pal Pad SVI 182
1 Night Stretcher SFA 61
1 Squawkabilly ex PAF 75
4 Pokeball SVI 196

Energy: 13
6 Basic Grass Energy SVE 1
4 Basic Lightning Energy SVE 4
3 Basic Fighting Energy SVE 6`
  },
  {
    name: 'Gardevoir ex',
    archetype: 'Gardevoir ex / Drifloon / Munkidori',
    share: 10.1,
    winRate: 51.5,
    imageUrl: 'https://images.pokemontcg.io/sv1-86.png',
    description: 'Estratégia focada em controle de danos e cura. Anexa múltiplas energias psíquicas do descarte aos seus atacantes de um prêmio (como Drifloon ou Scream Tail) para nocautear Pokémons ex oponentes.',
    cards: [
      { name: 'Gardevoir ex (SVI 86)', count: 2 },
      { name: 'Kirlia (SIT 68)', count: 4 },
      { name: 'Arven (SVI 166)', count: 4 },
      { name: 'Iono (PAF 80)', count: 4 }
    ],
    rawList: `Pokémon: 20
3 Ralts ASR 60
1 Ralts SIT 67
4 Kirlia SIT 68
2 Gardevoir ex SVI 86
1 Drifloon SVI 89
1 Scream Tail PAR 86
1 Munkidori TWM 95
1 Flutter Mane TEF 78
1 Klefki SVI 96
1 Manaphy BRS 41
1 Radiant Greninja ASR 46
1 Fezandipiti ex TWM 96

Trainer: 31
4 Arven SVI 166
3 Iono PAF 80
2 Boss's Orders PAL 172
1 Professor's Research SVI 190
4 Buddy-Buddy Poffin TEF 144
3 Ultra Ball SVI 196
2 Super Rod PAL 188
2 Nest Ball SVI 181
2 Bravery Charm PAL 173
1 Counter Catcher PAR 160
1 Earthen Vessel PAR 163
1 Technical Machine: Evolution PAR 178
1 Hero's Cape TEF 152
1 Lost Vacuum LOR 162
1 Night Stretcher SFA 61

Energy: 9
9 Basic Psychic Energy SVE 13`
  },
  {
    name: 'Lugia VSTAR',
    archetype: 'Lugia VSTAR / Archeops / Cinccino',
    share: 8.4,
    winRate: 50.8,
    imageUrl: 'https://images.pokemontcg.io/sit-139.png',
    description: 'Invoca múltiplos Archeops diretamente do descarte para o banco usando o poder VSTAR da Lugia. Cinccino ataca com energias especiais causando danos astronômicos.',
    cards: [
      { name: 'Lugia VSTAR (SIT 139)', count: 3 },
      { name: 'Archeops (SIT 147)', count: 3 },
      { name: 'Cinccino (TEF 137)', count: 3 },
      { name: 'Double Turbo Energy (BRS 151)', count: 4 }
    ],
    rawList: `Pokémon: 16
3 Lugia V SIT 138
3 Lugia VSTAR SIT 139
4 Archeops SIT 147
3 Minccino TEF 136
3 Cinccino TEF 137

Trainer: 28
4 Professor's Research SVI 190
3 Iono PAF 80
2 Boss's Orders PAL 172
2 Carmine TWM 145
4 Ultra Ball SVI 196
4 Great Ball SVI 183
4 Capturing Aroma SIT 153
2 Nest Ball SVI 181
1 Super Rod PAL 188
1 Jamming Tower TWM 153
2 Collapsed Stadium BRS 137

Energy: 16
4 Jet Energy PAL 190
4 Double Turbo Energy BRS 151
4 Gift Energy LOR 171
4 Mist Energy TEF 161`
  },
  {
    name: 'Roaring Moon ex',
    archetype: 'Roaring Moon ex / Baby Moon',
    share: 7.9,
    winRate: 51.1,
    imageUrl: 'https://images.pokemontcg.io/par-124.png',
    description: 'Velocidade e agressividade. Roaring Moon ex possui um ataque de nocaute instantâneo e outro que causa 220 de dano. Pode atacar logo no turno 1.',
    cards: [
      { name: 'Roaring Moon ex (PAR 124)', count: 3 },
      { name: 'Roaring Moon (TEF 109)', count: 3 },
      { name: 'Professor Sada\'s Vitality (PAR 170)', count: 4 },
      { name: 'Dark Patch (ASR 139)', count: 4 }
    ],
    rawList: `Pokémon: 13
3 Roaring Moon ex PAR 124
3 Roaring Moon TEF 109
1 Squawkabilly ex PAF 75
1 Fezandipiti ex TWM 96
1 Radiant Greninja ASR 46
1 Pecharunt ex SFA 39
1 Morpeko PAR 121
2 Pokeball SVI 196

Trainer: 36
4 Professor Sada's Vitality PAR 170
2 Iono PAF 80
1 Boss's Orders PAL 172
4 Dark Patch ASR 139
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Earthen Vessel PAR 163
3 Pokégear 3.0 SVI 186
3 Night Stretcher SFA 61
2 Ancient Booster Energy Capsule PAR 156
1 PokéStop OBf 193
1 Prime Catcher TEF 157
1 Super Rod PAL 188
2 Night Wanderer SFA 62

Energy: 11
9 Basic Darkness Energy SVE 15
2 Double Turbo Energy BRS 151`
  }
];

// 2. Default iconic cards database to fallback on when external APIs fail
const fallbackCards = [
  { id: 'sv3-125', name: 'Charizard ex', imageUrl: 'https://images.pokemontcg.io/sv3-125.png', setCode: 'sv3', setName: 'Obsidian Flames', setNumber: '125' },
  { id: 'sv1-81', name: 'Miraidon ex', imageUrl: 'https://images.pokemontcg.io/sv1-81.png', setCode: 'sv1', setName: 'Scarlet & Violet Base Set', setNumber: '81' },
  { id: 'sv1-86', name: 'Gardevoir ex', imageUrl: 'https://images.pokemontcg.io/sv1-86.png', setCode: 'sv1', setName: 'Scarlet & Violet Base Set', setNumber: '86' },
  { id: 'sv4-163', name: 'Roaring Moon ex', imageUrl: 'https://images.pokemontcg.io/sv4-163.png', setCode: 'sv4', setName: 'Paradox Rift', setNumber: '163' },
  { id: 'sv3-135', name: 'Pidgeot ex', imageUrl: 'https://images.pokemontcg.io/sv3-135.png', setCode: 'sv3', setName: 'Obsidian Flames', setNumber: '135' },
  { id: 'sv5-157', name: 'Prime Catcher', imageUrl: 'https://images.pokemontcg.io/sv5-157.png', setCode: 'sv5', setName: 'Temporal Forces', setNumber: '157' },
  { id: 'pgo-55', name: 'Snorlax', imageUrl: 'https://images.pokemontcg.io/pgo-55.png', setCode: 'pgo', setName: 'Pokémon GO', setNumber: '55' },
  { id: 'sv3-124', name: 'Charmeleon', imageUrl: 'https://images.pokemontcg.io/sv3-124.png', setCode: 'sv3', setName: 'Obsidian Flames', setNumber: '124' },
  { id: 'sv3-26', name: 'Charmander', imageUrl: 'https://images.pokemontcg.io/sv3-26.png', setCode: 'sv3', setName: 'Obsidian Flames', setNumber: '26' },
  { id: 'sv3-207', name: 'Pidgey', imageUrl: 'https://images.pokemontcg.io/sv3-207.png', setCode: 'sv3', setName: 'Obsidian Flames', setNumber: '207' },
  { id: 'sv45-80', name: 'Iono', imageUrl: 'https://images.pokemontcg.io/sv45-80.png', setCode: 'sv45', setName: 'Paldean Fates', setNumber: '80' },
  { id: 'sv1-166', name: 'Arven', imageUrl: 'https://images.pokemontcg.io/sv1-166.png', setCode: 'sv1', setName: 'Scarlet & Violet Base Set', setNumber: '166' },
  { id: 'sv1-172', name: 'Boss\'s Orders', imageUrl: 'https://images.pokemontcg.io/sv1-172.png', setCode: 'sv1', setName: 'Scarlet & Violet Base Set', setNumber: '172' },
  { id: 'sv1-196', name: 'Ultra Ball', imageUrl: 'https://images.pokemontcg.io/sv1-196.png', setCode: 'sv1', setName: 'Scarlet & Violet Base Set', setNumber: '196' },
  { id: 'sv1-191', name: 'Rare Candy', imageUrl: 'https://images.pokemontcg.io/sv1-191.png', setCode: 'sv1', setName: 'Scarlet & Violet Base Set', setNumber: '191' },
  { id: 'sv6-123', name: 'Raging Bolt ex', imageUrl: 'https://images.pokemontcg.io/sv6-123.png', setCode: 'sv6', setName: 'Twilight Masquerade', setNumber: '123' },
  { id: 'sv6-25', name: 'Teal Mask Ogerpon ex', imageUrl: 'https://images.pokemontcg.io/sv6-25.png', setCode: 'sv6', setName: 'Twilight Masquerade', setNumber: '25' },
  { id: 'sv4-170', name: 'Professor Sada\'s Vitality', imageUrl: 'https://images.pokemontcg.io/sv4-170.png', setCode: 'sv4', setName: 'Paradox Rift', setNumber: '170' },
  { id: 'sv4-163-item', name: 'Earthen Vessel', imageUrl: 'https://images.pokemontcg.io/sv4-163.png', setCode: 'sv4', setName: 'Paradox Rift', setNumber: '163' },
  { id: 'sit-139', name: 'Lugia VSTAR', imageUrl: 'https://images.pokemontcg.io/sit-139.png', setCode: 'sit', setName: 'Silver Tempest', setNumber: '139' },
  { id: 'sit-147', name: 'Archeops', imageUrl: 'https://images.pokemontcg.io/sit-147.png', setCode: 'sit', setName: 'Silver Tempest', setNumber: '147' },
  { id: 'sv5-137', name: 'Cinccino', imageUrl: 'https://images.pokemontcg.io/sv5-137.png', setCode: 'sv5', setName: 'Temporal Forces', setNumber: '137' }
];

// Helper to look up an image link or search pokemontcg.io
async function findCardInTcgio(name: string, set?: string, number?: string): Promise<{ id: string; name: string; imageUrl: string; setCode: string; setName: string; setNumber: string } | null> {
  try {
    let queryStr = `name:"${name}"`;
    if (set && set.length > 1) {
      queryStr += ` set.id:${set.toLowerCase()}`;
    }
    if (number) {
      queryStr += ` number:${number}`;
    }

    const encodedQuery = encodeURIComponent(queryStr);
    const url = `https://api.pokemontcg.io/v2/cards?q=${encodedQuery}&pageSize=1`;
    console.log('Querying Pokemontcg.io:', url);

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const card = data.data[0];
        return {
          id: card.id,
          name: card.name,
          imageUrl: card.images.small || card.images.large,
          setCode: card.set.id,
          setName: card.set.name,
          setNumber: card.number
        };
      }
    }
  } catch (err) {
    console.error('Error fetching card from pokemontcg.io:', err);
  }
  return null;
}

// REST APIs
app.get('/api/pokemon/meta', (req, res) => {
  res.json(metaDecks);
});

// Search Pokémon cards via pokemontcg.io with local fallbacks
app.get('/api/pokemon/search', async (req, res) => {
  const queryParam = (req.query.q as string) || '';
  const setParam = (req.query.set as string) || '';

  if (!queryParam && !setParam) {
    return res.json([]);
  }

  try {
    let qString = '';
    if (queryParam) {
      qString += `name:"*${queryParam}*"`;
    }
    if (setParam) {
      if (qString) qString += ' ';
      qString += `set.id:${setParam}`;
    }

    console.log(`Searching cards for: q="${queryParam}" set="${setParam}" -> query="${qString}"`);
    const encodedQuery = encodeURIComponent(qString);
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodedQuery}&pageSize=36`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const formatted = data.data.map((card: any) => ({
          id: card.id,
          name: card.name,
          imageUrl: card.images.small || card.images.large,
          setCode: card.set.id,
          setName: card.set.name,
          setNumber: card.number
        }));
        return res.json(formatted);
      }
    }
  } catch (error) {
    console.error('External API failed, falling back to local list:', error);
  }

  // Local fallback search (matches only on name if q is specified)
  if (queryParam) {
    const lowerQuery = queryParam.toLowerCase();
    const matched = fallbackCards.filter(c => c.name.toLowerCase().includes(lowerQuery));
    return res.json(matched);
  }
  res.json([]);
});

// Fetch all available Pokémon TCG sets
app.get('/api/pokemon/sets', async (req, res) => {
  try {
    const response = await fetch('https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate');
    if (response.ok) {
      const data = await response.json();
      const formatted = data.data.map((s: any) => ({
        id: s.id,
        name: s.name,
        series: s.series,
        releaseDate: s.releaseDate,
        logo: s.images.logo,
        symbol: s.images.symbol
      }));
      return res.json(formatted);
    }
  } catch (err) {
    console.error('Error fetching sets from pokemontcg.io:', err);
  }
  // Return robust, modern fallbacks if it fails
  res.json([
    { id: 'sv6', name: 'Twilight Masquerade', series: 'Scarlet & Violet' },
    { id: 'sv5', name: 'Temporal Forces', series: 'Scarlet & Violet' },
    { id: 'sv45', name: 'Paldean Fates', series: 'Scarlet & Violet' },
    { id: 'sv4', name: 'Paradox Rift', series: 'Scarlet & Violet' },
    { id: 'sv3', name: 'Obsidian Flames', series: 'Scarlet & Violet' },
    { id: 'sv2', name: 'Paldea Evolved', series: 'Scarlet & Violet' },
    { id: 'sv1', name: 'Scarlet & Violet', series: 'Scarlet & Violet' }
  ]);
});

// Parse TCG Live / Limitless text lists using Gemini (with advanced Regex fallback)
app.post('/api/pokemon/parse-deck', async (req, res) => {
  const { deckText } = req.body;
  if (!deckText || typeof deckText !== 'string' || deckText.trim().length === 0) {
    return res.status(400).json({ error: 'Falta o texto da lista do deck' });
  }

  console.log('Parsing decklist. Text length:', deckText.length);

  // Attempt Gemini parsing first
  const ai = getGeminiClient();
  if (ai) {
    try {
      console.log('Using Gemini 3.5 Flash for list parsing');
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Analise a seguinte lista de deck exportada do Pokémon TCG Live ou Limitless. Identifique cada carta, sua quantidade, abreviação do set/coleção, número da carta e categorize-a estritamente como 'Pokémon', 'Treinador' ou 'Energia'.
        
Aqui está o texto do deck:
"""
${deckText}
"""`,
        config: {
          systemInstruction: 'Você é um analisador especialista em Pokémon TCG. Extraia a lista de cartas do deck em formato JSON puro. Classifique os itens em português: "Pokémon", "Treinador" ou "Energia". Mapeie os nomes das coleções para seus códigos padrão de 3 ou 4 letras (ex: OBF, TEF, PAF, SVI, SVE, BRS). Retorne APENAS um array JSON válido.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'Nome em inglês ou português da carta (ex: "Charizard ex" ou "Charmander")' },
                count: { type: Type.INTEGER, description: 'Quantidade desta carta' },
                set: { type: Type.STRING, description: 'Código do set (ex: OBF, SVI)' },
                number: { type: Type.STRING, description: 'Número da carta no set' },
                type: { type: Type.STRING, description: 'Categoria: "Pokémon", "Treinador" ou "Energia"' }
              },
              required: ['name', 'count', 'type']
            }
          }
        }
      });

      const parsedJson = JSON.parse(response.text.trim());
      console.log('Gemini parsed success. Count of cards:', parsedJson.length);

      // Supplement images
      const supplemented = [];
      for (const card of parsedJson) {
        // Try looking up in fallback cards
        const localCard = fallbackCards.find(c => c.name.toLowerCase() === card.name.toLowerCase());
        let imageUrl = localCard ? localCard.imageUrl : `https://images.pokemontcg.io/${card.set ? card.set.toLowerCase() : 'sv1'}-${card.number || '1'}.png`;
        
        // Let's do a quick lazy fetch from tcgio for Pokémons to get high-quality images
        if (card.type === 'Pokémon' && !localCard) {
          const tcgioCard = await findCardInTcgio(card.name, card.set, card.number);
          if (tcgioCard) {
            imageUrl = tcgioCard.imageUrl;
          }
        }

        supplemented.push({
          ...card,
          imageUrl
        });
      }

      return res.json(supplemented);
    } catch (err) {
      console.error('Gemini parsing failed, switching to regex parser:', err);
    }
  }

  // Regex Fallback Parser (Very comprehensive, handles EN and PT formats)
  try {
    console.log('Using Regex parser');
    const lines = deckText.split('\n');
    const cards: any[] = [];
    let currentCategory: 'Pokémon' | 'Treinador' | 'Energia' = 'Pokémon';

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith('pokémon:') || lowerLine.startsWith('pokemon:')) {
        currentCategory = 'Pokémon';
        continue;
      }
      if (lowerLine.startsWith('treinador:') || lowerLine.startsWith('trainer:') || lowerLine.startsWith('trainers:')) {
        currentCategory = 'Treinador';
        continue;
      }
      if (lowerLine.startsWith('energia:') || lowerLine.startsWith('energy:')) {
        currentCategory = 'Energia';
        continue;
      }

      // Pattern: "3 Charizard ex OBF 125" or "4 Ultra Ball SVI 196" or "1 Prime Catcher TEF 157"
      // Also match without set/number: "3 Charmander"
      const match = line.match(/^(\d+)\s+(.+?)(?:\s+([A-Z]{3,4}|[a-z]{3,4})\s+(\d+))?$/);
      if (match) {
        const count = parseInt(match[1], 10);
        let name = match[2].trim();
        const set = match[3] ? match[3].toUpperCase() : undefined;
        const number = match[4] || undefined;

        // Strip any trailing type tags (like "ex", "VSTAR", "V")
        let cleanName = name;

        // Try mapping to fallback
        const localCard = fallbackCards.find(c => c.name.toLowerCase().includes(cleanName.toLowerCase()));
        const imageUrl = localCard ? localCard.imageUrl : `https://images.pokemontcg.io/${set ? set.toLowerCase() : 'sv1'}-${number || '1'}.png`;

        cards.push({
          name: cleanName,
          count,
          set,
          number,
          type: currentCategory,
          imageUrl
        });
      } else {
        // Try simple line match like "6 Basic Fire Energy" or "4 Iono"
        const simpleMatch = line.match(/^(\d+)\s+(.+)$/);
        if (simpleMatch) {
          const count = parseInt(simpleMatch[1], 10);
          const name = simpleMatch[2].trim();
          cards.push({
            name,
            count,
            type: currentCategory,
            imageUrl: 'https://images.pokemontcg.io/sv1-166.png' // default fallback
          });
        }
      }
    }

    res.json(cards);
  } catch (error) {
    console.error('Regex parser failed:', error);
    res.status(500).json({ error: 'Erro ao processar lista do deck' });
  }
});

// Start server
async function start() {
  console.log('--- Spirits TCG Server Starting ---');
  console.log(`NODE_ENV: "${process.env.NODE_ENV}"`);
  console.log(`Cwd: "${process.cwd()}"`);

  // Request logger middleware
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
  });

  // Vite Dev integration
  if (process.env.NODE_ENV !== 'production') {
    console.log('Using Vite Dev Middleware mode');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Using Production Static Serving mode');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Spirits TCG Portal server running on port ${PORT}`);
  });
}

start();
