import React, { useState, useEffect } from 'react';
import { db, matchesCol, membersCol, decksCol } from '../lib/firebase';
import { getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Member, MatchRecord, DeckRecord } from '../types';
import { 
  Swords, 
  Calendar, 
  PlusCircle, 
  X, 
  Filter, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import PokemonSprite from './PokemonSprite';

interface MatchesProps {
  currentMember: Member;
}

export function getArchetypeSprites(archetype: string): string[] {
  if (!archetype) return ['substitute'];
  
  // Split by '/', '+', 'and', 'with', 'ex', 'vstar', 'vmax', 'v', 'gmax', 'tera', 'prime', 'baby', 'deck'
  const parts = archetype.split(/[\/\+\-]|and|with/i);
  const pokemonNames = parts
    .map(p => {
      let name = p.trim().toLowerCase();
      // Remove typical suffixes
      name = name.replace(/\b(ex|vstar|vmax|v|gmax|tera|prime|baby|deck)\b/gi, '');
      return name.trim();
    })
    .filter(name => name.length > 0);
  
  // Return at most 2, fallback to substitute if none
  if (pokemonNames.length === 0) return ['substitute'];
  return pokemonNames.slice(0, 2);
}

export default function Matches({ currentMember }: MatchesProps) {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allDecks, setAllDecks] = useState<DeckRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter conditions
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');

  // Register Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [player1Id, setPlayer1Id] = useState(currentMember.id);
  const [player2Name, setPlayer2Name] = useState('');
  const [player2IsMember, setPlayer2IsMember] = useState(false);
  const [player2Id, setPlayer2Id] = useState('');
  const [deckName, setDeckName] = useState('');
  const [deckArchetype, setDeckArchetype] = useState('Charizard ex');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [opponentDeck, setOpponentDeck] = useState('');
  const [format, setFormat] = useState<'MD1' | 'MD3' | 'MD5'>('MD3');
  const [result, setResult] = useState<'win' | 'loss' | 'draw'>('win');
  const [score, setScore] = useState('2-1');
  const [notes, setNotes] = useState('');
  const [registering, setRegistering] = useState(false);

  const archetypes = [
    'Charizard ex',
    'Regidrago VSTAR',
    'Raging Bolt ex',
    'Gardevoir ex',
    'Lugia VSTAR',
    'Roaring Moon ex',
    'Miraidon ex',
    'Dragapult ex',
    'Chien-Pao ex',
    'Snorlax Block',
    'Gholdengo ex',
    'Iron Valiant ex',
    'Terapagos ex',
    'Garchomp ex',
    'Outro'
  ];

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true);
        
        // Load matches sorted by playedAt desc
        const matchSnap = await getDocs(query(matchesCol, orderBy('playedAt', 'desc')));
        const matchList = matchSnap.docs.map(d => ({ id: d.id, ...d.data() } as MatchRecord));
        setMatches(matchList);

        // Load members list for selector
        const memSnap = await getDocs(membersCol);
        const memList = memSnap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
        setMembers(memList);

        // Load all registered decks
        const deckSnap = await getDocs(decksCol);
        const deckList = deckSnap.docs.map(d => ({ id: d.id, ...d.data() } as DeckRecord));
        setAllDecks(deckList);
      } catch (err) {
        console.error('Error loading matches:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, [currentMember]);

  const handleClearHistory = async () => {
    if (!window.confirm('Tem certeza que deseja apagar todo o histórico de partidas do time e zerar o placar (vitórias/derrotas) de todos os membros?')) {
      return;
    }
    try {
      setLoading(true);
      
      // Delete all documents in matches collection
      const matchSnap = await getDocs(matchesCol);
      for (const d of matchSnap.docs) {
        await deleteDoc(doc(db, 'matches', d.id));
      }
      setMatches([]);

      // Zero out stats for all members in the roster
      const memSnap = await getDocs(membersCol);
      for (const d of memSnap.docs) {
        await updateDoc(doc(db, 'members', d.id), {
          wins: 0,
          losses: 0,
          draws: 0
        });
      }

      alert('Histórico limpo e estatísticas do time zeradas com sucesso!');
      window.location.reload();
    } catch (err) {
      console.error('Error clearing matches history:', err);
      alert('Ocorreu um erro ao limpar o histórico.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player2Name.trim() || !deckName.trim() || !opponentDeck.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    try {
      setRegistering(true);

      const p1Member = members.find(m => m.id === player1Id) || currentMember;

      const newMatch: Omit<MatchRecord, 'id'> = {
        player1Id: player1Id,
        player1Name: p1Member.name,
        player1Sprite: p1Member.avatarSprite,
        player2Name: player2IsMember ? (members.find(m => m.id === player2Id)?.name || player2Name) : player2Name,
        player2IsMember: player2IsMember,
        player2Id: player2IsMember ? player2Id : undefined,
        deckName: deckName,
        deckArchetype: deckArchetype,
        opponentDeck: opponentDeck,
        format: format,
        result: result,
        score: score,
        playedAt: new Date().toISOString(),
        notes: notes.trim() || undefined
      };

      // 1. Add to Matches collection
      const docRef = await addDoc(matchesCol, newMatch);

      // 2. Increment wins/losses/draws for player 1
      const p1Ref = doc(db, 'members', player1Id);
      const updatedWins = p1Member.wins + (result === 'win' ? 1 : 0);
      const updatedLosses = p1Member.losses + (result === 'loss' ? 1 : 0);
      const updatedDraws = p1Member.draws + (result === 'draw' ? 1 : 0);

      await updateDoc(p1Ref, {
        wins: updatedWins,
        losses: updatedLosses,
        draws: updatedDraws
      });

      // 3. Increment for player 2 if player 2 is also a Spirits member!
      if (player2IsMember && player2Id) {
        const p2Member = members.find(m => m.id === player2Id);
        if (p2Member) {
          const p2Ref = doc(db, 'members', player2Id);
          // Opposite results for player 2
          const p2Result = result === 'win' ? 'loss' : result === 'loss' ? 'win' : 'draw';
          const updatedP2Wins = p2Member.wins + (p2Result === 'win' ? 1 : 0);
          const updatedP2Losses = p2Member.losses + (p2Result === 'loss' ? 1 : 0);
          const updatedP2Draws = p2Member.draws + (p2Result === 'draw' ? 1 : 0);

          await updateDoc(p2Ref, {
            wins: updatedP2Wins,
            losses: updatedP2Losses,
            draws: updatedP2Draws
          });
        }
      }

      // Add to local state
      setMatches(prev => [{ id: docRef.id, ...newMatch } as MatchRecord, ...prev]);

      // Reset form & Close modal
      setShowFormModal(false);
      setPlayer2Name('');
      setPlayer2IsMember(false);
      setPlayer2Id('');
      setDeckName('');
      setSelectedDeckId('');
      setOpponentDeck('');
      setNotes('');
      alert('Partida registrada com sucesso! O ranking do time foi atualizado.');
    } catch (err) {
      console.error('Error registering match:', err);
    } finally {
      setRegistering(false);
    }
  };

  const filteredMatches = matches.filter(match => {
    const matchesResult = filterResult === 'all' || match.result === filterResult;
    const matchesFormat = filterFormat === 'all' || match.format === filterFormat;
    return matchesResult && matchesFormat;
  });

  return (
    <div className="space-y-8" id="matches-view">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-850 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>⚔️</span> Arena de Combate Spirits
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Mantenha o registro de todos os treinos internos, confrontos de torneios regionais e eventos competitivos.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            id="btn-clear-history"
            onClick={handleClearHistory}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg font-bold text-sm flex items-center gap-2 border border-slate-700 cursor-pointer transition-all duration-300"
          >
            🗑️ Limpar Histórico
          </button>
          
          <button
            id="btn-open-register-match"
            onClick={() => setShowFormModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer transition-all duration-300"
          >
            <PlusCircle className="w-5 h-5" /> Registrar Nova Partida
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300 text-sm">
          <Filter className="w-4 h-4 text-purple-400" />
          <span>Filtros Rápidos:</span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Result Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Resultado:</span>
            <select
              id="filter-result-select"
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs px-2.5 py-1 rounded-md outline-none"
            >
              <option value="all">Todos</option>
              <option value="win">Vitórias</option>
              <option value="loss">Derrotas</option>
              <option value="draw">Empates</option>
            </select>
          </div>

          {/* Format Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Formato:</span>
            <select
              id="filter-format-select"
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs px-2.5 py-1 rounded-md outline-none"
            >
              <option value="all">Todos</option>
              <option value="MD1">Melhor de 1 (MD1)</option>
              <option value="MD3">Melhor de 3 (MD3)</option>
              <option value="MD5">Melhor de 5 (MD5)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <PokemonSprite name="scizor" size="lg" className="animate-spin" />
          <p className="mt-4 text-purple-300 font-mono text-xs animate-pulse">Consultando registro de combates...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
          <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-bold">Nenhum combate corresponde aos filtros aplicados.</p>
          <p className="text-xs text-slate-500 mt-1">Experimente mudar as opções de filtros acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="matches-grid">
          {filteredMatches.map(match => (
            <div 
              key={match.id} 
              className="bg-slate-900/60 border border-slate-800 hover:border-purple-500/25 rounded-2xl p-5 transition-all flex flex-col justify-between"
              id={`match-card-${match.id}`}
            >
              <div className="space-y-4">
                {/* Players comparison header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-3">
                    <PokemonSprite name={match.player1Sprite} size="sm" />
                    <div>
                      <h3 className="text-white font-bold text-sm">{match.player1Name}</h3>
                      <span className="text-[10px] text-purple-400 font-bold bg-purple-950/40 px-1.5 py-0.5 rounded font-mono">Spirits Team</span>
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-slate-500">VS</div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <h3 className="text-white font-bold text-sm">{match.player2Name}</h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        match.player2IsMember ? 'text-purple-400 bg-purple-950/40' : 'text-slate-400 bg-slate-800'
                      }`}>
                        {match.player2IsMember ? 'Spirits Team' : 'Oponente'}
                      </span>
                    </div>
                    <PokemonSprite name={match.player2IsMember ? (members.find(m => m.id === match.player2Id)?.avatarSprite || 'substitute') : 'substitute'} size="sm" />
                  </div>
                </div>

                {/* Match deck setups */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Archetype Icons */}
                    <div className="flex -space-x-2 shrink-0">
                      {getArchetypeSprites(match.deckArchetype).map((spriteName, idx) => (
                        <div key={idx} className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center overflow-hidden shadow-md">
                          <PokemonSprite name={spriteName} size="sm" className="w-5.5 h-5.5 scale-110" />
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] text-slate-550 uppercase font-bold">Deck do Spirits</div>
                      <div className="text-xs font-bold text-slate-200 truncate" title={match.deckName}>{match.deckName}</div>
                      <div className="text-[10px] text-slate-400 truncate">{match.deckArchetype}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 text-right border-l border-slate-900 pl-4 min-w-0">
                    <div className="min-w-0">
                      <div className="text-[9px] text-slate-550 uppercase font-bold">Deck Oponente</div>
                      <div className="text-xs font-bold text-slate-200 truncate" title={match.opponentDeck}>{match.opponentDeck}</div>
                      <div className="text-[10px] text-slate-400 truncate">{match.opponentDeck}</div>
                    </div>
                    {/* Opponent Archetype Icons */}
                    <div className="flex -space-x-2 shrink-0">
                      {getArchetypeSprites(match.opponentDeck).map((spriteName, idx) => (
                        <div key={idx} className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center overflow-hidden shadow-md">
                          <PokemonSprite name={spriteName} size="sm" className="w-5.5 h-5.5 scale-110" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Match Notes comment */}
                {match.notes && (
                  <div className="bg-slate-900/30 p-2.5 rounded-lg text-xs text-slate-400 italic flex gap-1.5">
                    <FileText className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <span>"{match.notes}"</span>
                  </div>
                )}
              </div>

              {/* Status details footer */}
              <div className="flex items-center justify-between border-t border-slate-850 pt-3 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                    match.result === 'win' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' :
                    match.result === 'loss' ? 'bg-rose-950 text-rose-400 border border-rose-500/20' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {match.result === 'win' ? 'Vitória' : match.result === 'loss' ? 'Derrota' : 'Empate'}
                  </span>
                  <span className="text-white font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-850 font-mono text-xs">{match.score}</span>
                </div>

                <div className="text-slate-500 flex items-center gap-1 font-mono text-[10px]">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(match.playedAt).toLocaleDateString('pt-BR')} | {match.format}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Form Overlay Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="register-match-modal">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-slate-900">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Registrar Partida Competitiva</h3>
              </div>
              <button 
                id="close-form-x"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterMatch} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Player 1 selection (Spirits member) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase">Representando Spirits (Jogador 1):</label>
                <select
                  id="p1-selector"
                  value={player1Id}
                  onChange={(e) => setPlayer1Id(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                >
                  {members.map(mem => (
                    <option key={mem.id} value={mem.id}>{mem.name} ({mem.nickname || 'Sem apelido'})</option>
                  ))}
                </select>
              </div>

              {/* Player 2 selection */}
              <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Oponente (Jogador 2):</label>
                  
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-purple-400 font-bold">
                    <input
                      id="checkbox-is-p2-member"
                      type="checkbox"
                      checked={player2IsMember}
                      onChange={(e) => {
                        setPlayer2IsMember(e.target.checked);
                        if (e.target.checked && members.length > 0) {
                          setPlayer2Id(members[0].id);
                        } else {
                          setPlayer2Id('');
                        }
                      }}
                      className="accent-purple-600 rounded"
                    />
                    <span>É membro do Spirits?</span>
                  </label>
                </div>

                {player2IsMember ? (
                  <select
                    id="p2-member-selector"
                    value={player2Id}
                    onChange={(e) => setPlayer2Id(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                  >
                    {members.filter(m => m.id !== player1Id).map(mem => (
                      <option key={mem.id} value={mem.id}>{mem.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="p2-text-input"
                    type="text"
                    placeholder="Nome do oponente externo (ex: João Santos ou Renato Legião)"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                    required={!player2IsMember}
                  />
                )}
              </div>

              {/* Decks comparison */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase">Selecione seu Deck Cadastrado:</label>
                    <select
                      id="p1-deck-selector"
                      value={selectedDeckId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        setSelectedDeckId(selId);
                        if (selId === 'custom') {
                          setDeckName('');
                          setDeckArchetype('Charizard ex');
                        } else {
                          const foundDeck = allDecks.find(d => d.id === selId);
                          if (foundDeck) {
                            setDeckName(foundDeck.deckName);
                            setDeckArchetype(foundDeck.archetype);
                          } else {
                            setDeckName('');
                            setDeckArchetype('Charizard ex');
                          }
                        }
                      }}
                      className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none font-semibold"
                      required
                    >
                      <option value="">-- Selecione seu Deck --</option>
                      {allDecks.filter(d => d.userId === player1Id).map(d => (
                        <option key={d.id} value={d.id}>{d.deckName} ({d.archetype})</option>
                      ))}
                      <option value="custom">✍️ Digitar Manualmente...</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase">Arquétipo do Deck:</label>
                    {selectedDeckId !== 'custom' && selectedDeckId !== '' ? (
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm font-semibold truncate">
                        {deckArchetype}
                      </div>
                    ) : (
                      <select
                        id="p1-archetype-select"
                        value={deckArchetype}
                        onChange={(e) => setDeckArchetype(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                      >
                        {archetypes.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* If custom is selected, let them type the name */}
                {selectedDeckId === 'custom' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase">Nome Personalizado do seu Deck:</label>
                    <input
                      id="p1-deck-input"
                      type="text"
                      placeholder="ex: Charizard Dragapult"
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                      required
                    />
                  </div>
                )}

                {/* Live Preview of highlight icons */}
                {(deckArchetype || deckName) && (
                  <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="text-xs text-slate-400 font-bold uppercase shrink-0">Destaque do Deck (2 Pokémons):</div>
                    <div className="flex gap-1.5">
                      {getArchetypeSprites(selectedDeckId !== 'custom' && selectedDeckId !== '' ? deckArchetype : (deckArchetype || deckName)).map((spriteName, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                          <PokemonSprite name={spriteName} size="sm" className="w-6 h-6 scale-110" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase">Deck do Oponente (O que ele jogou?):</label>
                <input
                  id="p2-deck-input"
                  type="text"
                  placeholder="ex: Raging Bolt ex ou Regidrago"
                  value={opponentDeck}
                  onChange={(e) => setOpponentDeck(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                  required
                />
              </div>

              {/* Format, Result, Score */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Formato:</label>
                  <select
                    id="match-format-select"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                  >
                    <option value="MD1">MD1</option>
                    <option value="MD3">MD3</option>
                    <option value="MD5">MD5</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Seu Resultado:</label>
                  <select
                    id="match-result-select"
                    value={result}
                    onChange={(e) => setResult(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                  >
                    <option value="win">Vitória</option>
                    <option value="loss">Derrota</option>
                    <option value="draw">Empate</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Placar final:</label>
                  <input
                    id="match-score-input"
                    type="text"
                    placeholder="ex: 2-1"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none text-center font-mono"
                    required
                  />
                </div>
              </div>

              {/* Match Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase">Observações da Partida (Opcional):</label>
                <textarea
                  id="match-notes-input"
                  rows={3}
                  placeholder="Comente sobre momentos importantes, tech cards cruciais, erros cometidos..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-xs outline-none"
                />
              </div>

              <button
                id="btn-submit-match"
                type="submit"
                disabled={registering}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-sm cursor-pointer transition-all shadow-lg"
              >
                {registering ? 'Registrando na Arena...' : 'Confirmar e Atualizar Ranking'}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
