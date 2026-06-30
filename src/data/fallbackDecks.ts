import { MetaDeck } from '../types';

export const fallbackMetaDecks: MetaDeck[] = [
  {
    name: 'Pikachu ex',
    archetype: 'Pikachu ex / Latias ex / Magneton',
    share: 14.8,
    winRate: 53.1,
    imageUrl: 'https://images.pokemontcg.io/sv8/54.png',
    updatedAt: '2026-06-10',
    description: 'Inovador e incrivelmente forte. Pikachu ex desfere 300 de dano massivo de uma vez e previne o próprio nocaute quando com HP cheio através da habilidade Resolute Heart. Ele é energizado instantaneamente pela habilidade Overcharge do Magneton.',
    cards: [
      { name: 'Pikachu ex (SSP 054)', count: 3 },
      { name: 'Latias ex (SSP 076)', count: 1 },
      { name: 'Magneton (SSP 052)', count: 3 }
    ],
    rawList: `Pokémon: 16\n4 Magnemite SSP 51\n3 Magneton SSP 52\n3 Pikachu ex SSP 54\n1 Latias ex SSP 76\n2 Rotom V LOR 58\n1 Fezandipiti ex TWM 96\n1 Lumineon V BRS 40\n1 Mew ex MEW 151\n\nTrainer: 32\n4 Arven SVI 166\n3 Iono PAF 80\n2 Boss's Orders PAL 172\n1 Professor's Research SVI 190\n1 Briar SCR 132\n4 Buddy-Buddy Poffin TEF 144\n4 Ultra Ball SVI 196\n4 Nest Ball SVI 181\n2 Super Rod PAL 188\n3 Electric Generator SVI 162\n1 Prime Catcher TEF 157\n1 Gravity Mountain SFA 74\n2 Sparking Crystal SCR 142\n\nEnergy: 12\n12 Basic Lightning Energy SVE 4`
  },
  {
    name: 'Raging Bolt ex',
    archetype: 'Raging Bolt ex / Teal Mask Ogerpon ex',
    share: 15.2,
    winRate: 53.6,
    imageUrl: 'https://images.pokemontcg.io/sv5/123.png',
    updatedAt: '2026-06-02',
    description: 'Um dos decks mais rápidos e explosivos do formato Standard. Bate dano infinito descartando energias ligadas aos seus Pokémons com o ataque Bellowing Thunder, suportado pela aceleração de energia e compra do Teal Mask Ogerpon ex.',
    cards: [
      { name: 'Raging Bolt ex (TEF 123)', count: 4 },
      { name: 'Teal Mask Ogerpon ex (TWM 25)', count: 4 },
      { name: "Professor Sada's Vitality (PAR 170)", count: 4 }
    ],
    rawList: `Pokémon: 12\n4 Raging Bolt ex TEF 123\n4 Teal Mask Ogerpon ex TWM 25\n1 Radiant Greninja ASR 46\n1 Fezandipiti ex TWM 96\n1 Flutter Mane TEF 78\n1 Sandy Shocks ex PAR 108\n\nTrainer: 35\n4 Professor Sada's Vitality PAR 170\n2 Iono PAF 80\n1 Boss's Orders PAL 172\n4 Earthen Vessel PAR 163\n4 Nest Ball SVI 181\n4 Ultra Ball SVI 196\n3 Pokégear 3.0 SVI 186\n2 Energy Switch SVI 173\n2 Bravery Charm PAL 173\n1 Prime Catcher TEF 157\n1 Superior Energy Retrieval PAL 189\n1 Super Rod PAL 188\n1 Lost Vacuum LOR 162\n1 Pal Pad SVI 182\n1 Night Stretcher SFA 61\n1 Squawkabilly ex PAF 75\n4 Pokeball SVI 196\n\nEnergy: 13\n6 Basic Grass Energy SVE 1\n4 Basic Lightning Energy SVE 4\n3 Basic Fighting Energy SVE 6`
  },
  {
    name: 'Regidrago VSTAR',
    archetype: 'Regidrago VSTAR / Teal Mask Ogerpon ex',
    share: 16.5,
    winRate: 54.2,
    imageUrl: 'https://images.pokemontcg.io/swsh12/136.png',
    updatedAt: '2026-05-18',
    description: 'O deck de Dragão supremo no Standard format. Usa o ataque Apex Dragon do Regidrago VSTAR para copiar habilidades de outros Pokémon dragão da pilha de descarte (como Giratina VSTAR ou Noivern ex), energizado de forma ultrarrápida com Teal Mask Ogerpon ex.',
    cards: [
      { name: 'Regidrago VSTAR (SIT 136)', count: 3 },
      { name: 'Teal Mask Ogerpon ex (TWM 25)', count: 4 },
      { name: 'Energy Switch (SVI 173)', count: 4 }
    ],
    rawList: `Pokémon: 17\n3 Regidrago V SIT 135\n3 Regidrago VSTAR SIT 136\n3 Teal Mask Ogerpon ex TWM 25\n1 Giratina VSTAR LOR 131\n1 Noivern ex PAF 69\n1 Haxorus TWM 156\n1 Dragapult ex TWM 130\n1 Kyurem SFA 47\n1 Mew ex MEW 151\n1 Radiant Charizard PGO 11\n1 Fezandipiti ex TWM 96\n\nTrainer: 31\n4 Professor Sada's Vitality PAR 170\n3 Iono PAF 80\n2 Boss's Orders PAL 172\n4 Ultra Ball SVI 196\n4 Nest Ball SVI 181\n4 Energy Switch SVI 173\n4 Earthen Vessel PAR 163\n2 Super Rod PAL 188\n1 Superior Energy Retrieval PAL 189\n1 Prime Catcher TEF 157\n1 Pokégear 3.0 SVI 186\n1 Lost Vacuum LOR 162\n\nEnergy: 12\n6 Basic Grass Energy SVE 1\n3 Basic Fire Energy SVE 2\n3 Basic Psychic Energy SVE 13`
  },
  {
    name: 'Charizard ex',
    archetype: 'Charizard ex / Pidgeot ex / Dusknoir',
    share: 13.9,
    winRate: 52.8,
    imageUrl: 'https://images.pokemontcg.io/sv3/125.png',
    updatedAt: '2026-06-15',
    description: 'O soberano resiliente do TCG. Charizard ex aumenta seu poder destrutivo conforme o oponente ganha cartas de prêmio. Utiliza a habilidade Cursed Blast do Dusknoir para forçar nocautes inesperados e Pidgeot ex para buscas irrestritas.',
    cards: [
      { name: 'Charizard ex (OBF 125)', count: 3 },
      { name: 'Pidgeot ex (OBF 225)', count: 2 },
      { name: 'Dusknoir (SFA 20)', count: 2 }
    ],
    rawList: `Pokémon: 18\n3 Charizard ex OBF 125\n2 Pidgey MEW 16\n2 Pidgeot ex OBF 225\n3 Duskull SFA 18\n1 Dusclops SFA 19\n2 Dusknoir SFA 20\n2 Rotom V LOR 58\n1 Fezandipiti ex TWM 96\n1 Radiant Alakazam SIT 59\n2 Bouffalant SSP 145\n\nTrainer: 30\n4 Arven SVI 166\n3 Iono PAF 80\n2 Boss's Orders PAL 172\n4 Area Zero Underdepths SCR 131\n4 Buddy-Buddy Poffin TEF 144\n4 Nest Ball SVI 181\n4 Rare Candy SVI 191\n2 Super Rod PAL 188\n1 Prime Catcher TEF 157\n1 Counter Catcher PAR 160\n1 Defiance Band SVI 169\n\nEnergy: 12\n4 Double Turbo Energy BRS 151\n8 Basic Water Energy SVE 3`
  },
  {
    name: 'Lugia VSTAR',
    archetype: 'Lugia VSTAR / Archeops / Cinccino',
    share: 11.5,
    winRate: 51.9,
    imageUrl: 'https://images.pokemontcg.io/swsh12/139.png',
    updatedAt: '2026-06-20',
    description: 'Um monstro clássico que continua no topo. Invoca instantaneamente dois Archeops do descarte para o banco usando a habilidade Summoning Star do Lugia VSTAR, acelerando energias especiais massivamente para Cinccino bater forte.',
    cards: [
      { name: 'Lugia VSTAR (SIT 139)', count: 3 },
      { name: 'Archeops (SIT 147)', count: 4 },
      { name: 'Cinccino (TEF 137)', count: 3 }
    ],
    rawList: `Pokémon: 16\n3 Lugia V SIT 138\n3 Lugia VSTAR SIT 139\n4 Archeops SIT 147\n3 Minccino TEF 136\n3 Cinccino TEF 137\n\nTrainer: 28\n4 Professor's Research SVI 189\n3 Iono PAF 80\n2 Boss's Orders PAL 172\n4 Great Ball SVI 183\n4 Ultra Ball SVI 196\n4 Capturing Aroma SIT 153\n2 Super Rod PAL 188\n3 Collapsed Stadium BRS 137\n2 Jac SVI 175\n\nEnergy: 16\n4 Jet Energy PAL 190\n4 Double Turbo Energy BRS 151\n4 Gift Energy LOR 171\n4 Mist Energy TEF 161`
  },
  {
    name: 'Gardevoir ex',
    archetype: 'Gardevoir ex / Drifloon / Scream Tail',
    share: 10.2,
    winRate: 52.4,
    imageUrl: 'https://images.pokemontcg.io/sv1/86.png',
    updatedAt: '2026-06-25',
    description: 'Altamente técnico e estratégico. Gardevoir ex recicla energias psíquicas da pilha de descarte direto para seus Pokémons usando Psychic Embrace, permitindo que atacantes como Drifloon e Scream Tail batam números absurdos com base nos contadores de dano.',
    cards: [
      { name: 'Gardevoir ex (SVI 086)', count: 2 },
      { name: 'Drifloon (SVI 089)', count: 2 },
      { name: 'Scream Tail (PAR 086)', count: 1 }
    ],
    rawList: `Pokémon: 18\n3 Ralts SVI 84\n1 Ralts ASR 60\n3 Kirlia SIT 68\n2 Gardevoir ex SVI 86\n2 Drifloon SVI 89\n1 Scream Tail PAR 86\n1 Munkidori TWM 95\n1 Fezandipiti ex TWM 96\n2 Flutter Mane TEF 78\n2 Klefki SVI 96\n\nTrainer: 32\n4 Arven SVI 166\n3 Iono PAF 80\n2 Boss's Orders PAL 172\n1 Professor's Research SVI 189\n4 Buddy-Buddy Poffin TEF 144\n4 Nest Ball SVI 181\n4 Ultra Ball SVI 196\n3 Super Rod PAL 188\n2 Earthen Vessel PAR 163\n2 Bravery Charm PAL 173\n1 Counter Catcher PAR 160\n2 Technical Machine: Evolution PAR 178\n\nEnergy: 10\n10 Basic Psychic Energy SVE 13`
  }
];
