import React, { useEffect, useState } from 'react';
import { db, membersCol, matchesCol, loansCol } from '../lib/firebase';
import { getDocs, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { Member, MatchRecord, LoanRecord, MetaDeck } from '../types';
import PokemonSprite from './PokemonSprite';
import { getRoleBadge } from '../utils';
import { 
  TrendingUp, 
  Trophy, 
  Swords, 
  ArrowRight, 
  ArrowLeftRight, 
  CheckCircle2, 
  Flame, 
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';

interface DashboardProps {
  currentMember: Member;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ currentMember, setActiveTab }: DashboardProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  const [pendingLoans, setPendingLoans] = useState<LoanRecord[]>([]);
  const [metaDecks, setMetaDecks] = useState<MetaDeck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // 1. Fetch Members
        const memSnap = await getDocs(membersCol);
        const memList = memSnap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
        // Sort by win rate or total wins
        memList.sort((a, b) => b.wins - a.wins);
        setMembers(memList);

        // 2. Fetch Recent Matches
        const matchSnap = await getDocs(query(matchesCol, orderBy('playedAt', 'desc'), limit(5)));
        const matchList = matchSnap.docs.map(d => ({ id: d.id, ...d.data() } as MatchRecord));
        setRecentMatches(matchList);

        // 3. Fetch Pending Loans for Current User or Global pending loans to review
        const loanSnap = await getDocs(loansCol);
        const loanList = loanSnap.docs.map(d => ({ id: d.id, ...d.data() } as LoanRecord));
        // Filter pending loans that are requested from me OR requested by me
        const relevantLoans = loanList.filter(l => 
          (l.ownerId === currentMember.id || l.borrowerId === currentMember.id) && l.status === 'pending'
        );
        setPendingLoans(relevantLoans);

        // 4. Fetch Meta Decks from our backend API
        const res = await fetch('/api/pokemon/meta');
        if (res.ok) {
          const metaData = await res.json();
          setMetaDecks(metaData);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentMember]);

  const handleApproveLoan = async (loanId: string) => {
    try {
      const loanRef = doc(db, 'loans', loanId);
      await updateDoc(loanRef, {
        status: 'active',
        loanedAt: new Date().toISOString()
      });
      // Refresh local pending list
      setPendingLoans(prev => prev.filter(l => l.id !== loanId));
    } catch (err) {
      console.error('Error approving loan:', err);
    }
  };

  const handleDeclineLoan = async (loanId: string) => {
    try {
      const loanRef = doc(db, 'loans', loanId);
      await updateDoc(loanRef, {
        status: 'declined'
      });
      setPendingLoans(prev => prev.filter(l => l.id !== loanId));
    } catch (err) {
      console.error('Error declining loan:', err);
    }
  };

  const totalTeamWins = members.reduce((sum, m) => sum + m.wins, 0);
  const totalTeamMatches = members.reduce((sum, m) => sum + m.wins + m.losses + m.draws, 0);
  const teamWinRate = totalTeamMatches > 0 ? ((totalTeamWins / totalTeamMatches) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" id="dashboard-loading">
        <PokemonSprite name="gengar" size="lg" className="animate-bounce" />
        <p className="mt-4 text-purple-300 font-mono text-sm animate-pulse">Carregando dados da Spirits Arena...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-root">
      {/* 1. Header Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/50 to-purple-950/40 p-6 md:p-8 border border-purple-500/20 shadow-xl shadow-purple-950/20 backdrop-blur-md" id="hero-banner">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-56 h-56 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-44 h-44 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold tracking-wider text-xs uppercase font-mono">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              Arena Espírita de Elite
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">{currentMember.nickname || currentMember.name}</span>!
            </h1>
            <p className="text-slate-350 max-w-xl text-xs sm:text-sm leading-relaxed font-sans">
              Bem-vindo ao Spirits TCG Portal. Gerencie sua coleção, treine com o time, registre confrontos oficiais e domine o metagame competitivo de Pokémon TCG.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-950/60 border border-purple-500/20 p-4 rounded-xl backdrop-blur-sm self-start md:self-auto shadow-inner">
            <PokemonSprite name={currentMember.avatarSprite} size="md" />
            <div>
              <div className="mb-1">{getRoleBadge(currentMember.role)}</div>
              <div className="text-white font-extrabold text-sm">{currentMember.name}</div>
              <div className="text-xs text-slate-400 font-mono">Streak: {currentMember.wins}W - {currentMember.losses}L</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Bento Grid Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4" id="stats-grid">
        {/* Stat 1: Win Rate */}
        <div className="md:col-span-3 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(147,51,234,0.05)] transition-all duration-300 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">Win Rate Geral</span>
            <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center border border-yellow-500/20">
              <Trophy className="w-4 h-4 text-yellow-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white tracking-tight">{teamWinRate}%</div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">Média de {totalTeamMatches} partidas</p>
          </div>
        </div>

        {/* Stat 2: Wins */}
        <div className="md:col-span-3 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(147,51,234,0.05)] transition-all duration-300 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">Vitórias</span>
            <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/20">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white tracking-tight">{totalTeamWins} W</div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">Spirits roster acumulado</p>
          </div>
        </div>

        {/* Stat 3: Loans */}
        <div className="md:col-span-3 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(147,51,234,0.05)] transition-all duration-300 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">Empréstimos</span>
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
              <ArrowLeftRight className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white tracking-tight">{pendingLoans.length}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">Aguardando atenção</p>
          </div>
        </div>

        {/* Stat 4: Members */}
        <div className="md:col-span-3 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(147,51,234,0.05)] transition-all duration-300 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">Jogadores</span>
            <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
              <Layers className="w-4 h-4 text-indigo-450" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white tracking-tight">{members.length}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">Focados em alto nível</p>
          </div>
        </div>

        {/* Pending Loans Review - Integrated into Bento */}
        {pendingLoans.length > 0 && (
          <div className="md:col-span-12 bg-slate-900/40 border border-amber-500/20 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-4">
              <span className="w-2 h-2 bg-amber-450 rounded-full animate-ping"></span>
              <ArrowLeftRight className="w-4 h-4" />
              <h2>Aprovação de Empréstimos Pendentes</h2>
            </div>
            
            <div className="divide-y divide-slate-800/60">
              {pendingLoans.map(loan => {
                const isOwner = loan.ownerId === currentMember.id;
                return (
                  <div key={loan.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={loan.cardImageUrl} alt={loan.cardName} className="w-10 h-14 object-contain rounded border border-slate-800" />
                      <div>
                        <div className="text-white font-extrabold text-sm">{loan.cardName} <span className="text-purple-400 font-mono text-xs">(x{loan.quantity})</span></div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {isOwner ? (
                            <span>Solicitado por: <strong className="text-purple-300 font-semibold">{loan.borrowerName}</strong></span>
                          ) : (
                            <span>Você solicitou de: <strong className="text-purple-300 font-semibold">{loan.ownerName}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isOwner ? (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                          id={`approve-btn-${loan.id}`}
                          onClick={() => handleApproveLoan(loan.id)}
                          className="flex-1 sm:flex-none px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md shadow-purple-950/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                        </button>
                        <button 
                          id={`decline-btn-${loan.id}`}
                          onClick={() => handleDeclineLoan(loan.id)}
                          className="flex-1 sm:flex-none px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold cursor-pointer transition-colors border border-slate-700/50"
                        >
                          Recusar
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] bg-slate-950/80 text-amber-450 px-2.5 py-1 rounded border border-amber-500/20 font-mono font-bold uppercase tracking-wider">
                        Aguardando Aprovação
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Battle Records (Bento Section) */}
        <div className="md:col-span-8 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md hover:border-purple-500/20 transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-extrabold text-white">Registros de Batalha do Time</h2>
            </div>
            <button 
              id="view-all-matches"
              onClick={() => setActiveTab('partidas')}
              className="text-purple-400 hover:text-purple-350 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              Ver tudo <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentMatches.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                Nenhuma partida registrada até o momento. Seja o primeiro!
              </div>
            ) : (
              recentMatches.map(match => (
                <div key={match.id} className="bg-slate-950/40 border border-slate-850/80 hover:border-purple-500/10 rounded-xl p-4 transition-all">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-900 p-1 rounded-lg border border-slate-800">
                        <PokemonSprite name={match.player1Sprite} size="sm" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-extrabold text-sm">{match.player1Name}</span>
                          <span className="text-[10px] text-purple-400 font-mono bg-purple-950/40 px-1.5 py-0.5 rounded">({match.deckArchetype})</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          vs <span className="text-slate-300 font-semibold">{match.player2Name}</span>
                          <span className="text-[10px] bg-slate-900/80 px-1.5 py-0.5 rounded font-mono text-slate-500">({match.opponentDeck})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t border-slate-855 sm:border-t-0 pt-2 sm:pt-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono border ${
                          match.result === 'win' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' :
                          match.result === 'loss' ? 'bg-rose-950/40 text-rose-400 border-rose-500/20' :
                          'bg-slate-850 text-slate-400 border-slate-800'
                        }`}>
                          {match.result === 'win' ? 'Vitória' : match.result === 'loss' ? 'Derrota' : 'Empate'}
                        </span>
                        <span className="text-white font-mono font-black text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-850">{match.score}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {new Date(match.playedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                  </div>
                  {match.notes && (
                    <p className="mt-2.5 text-xs text-slate-450 bg-slate-950/20 border border-slate-850/40 p-2.5 rounded-lg italic">
                      "{match.notes}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Limitless Meta Decks (Bento Section) */}
        <div className="md:col-span-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md hover:border-purple-500/20 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-extrabold text-white">Metagame (Limitless)</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Baseado nos dados competitivos mais recentes do Limitless TCG.
            </p>

            <div className="space-y-3">
              {metaDecks.map((deck, idx) => (
                <div key={deck.name} className="flex gap-3 bg-slate-950/30 p-3 rounded-xl border border-slate-850 hover:border-purple-500/10 transition-all">
                  <img src={deck.imageUrl} alt={deck.name} className="w-10 h-14 object-contain rounded shrink-0 drop-shadow-md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-white font-extrabold text-xs truncate">{deck.name}</span>
                      <span className="text-[9px] font-mono text-purple-400 bg-purple-950/50 px-1.5 py-0.5 rounded font-bold">#{idx+1}</span>
                    </div>
                    <div className="text-[10px] text-slate-450 truncate mt-0.5 font-mono">{deck.archetype}</div>
                    
                    <div className="flex items-center gap-4 mt-2 border-t border-slate-950 pt-1.5">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase font-mono font-bold">Share</div>
                        <div className="text-[10px] font-extrabold text-slate-200 font-mono">{deck.share}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase font-mono font-bold">Win Rate</div>
                        <div className="text-[10px] font-extrabold text-emerald-400 font-mono">{deck.winRate}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Shortcuts (Bento Section, spans full width at the bottom) */}
        <div className="md:col-span-12 bg-gradient-to-br from-slate-900/40 via-purple-950/5 to-indigo-950/5 border border-purple-900/20 rounded-2xl p-6 backdrop-blur-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-4 font-mono">Atalhos da Arena</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button 
              id="shortcut-collection"
              onClick={() => setActiveTab('colecao')}
              className="p-4 bg-slate-950/40 border border-slate-850 hover:border-purple-500/40 rounded-xl text-left transition-all cursor-pointer group hover:shadow-lg"
            >
              <div className="text-lg group-hover:scale-110 transition-transform mb-1.5">🎁</div>
              <div className="text-xs font-extrabold text-white">Minha Coleção</div>
              <div className="text-[10px] text-slate-400 mt-1">Gerencie e disponibilize suas cartas</div>
            </button>
            
            <button 
              id="shortcut-decks"
              onClick={() => setActiveTab('decks')}
              className="p-4 bg-slate-950/40 border border-slate-850 hover:border-purple-500/40 rounded-xl text-left transition-all cursor-pointer group hover:shadow-lg"
            >
              <div className="text-lg group-hover:scale-110 transition-transform mb-1.5">🎴</div>
              <div className="text-xs font-extrabold text-white">Meus Decks</div>
              <div className="text-[10px] text-slate-400 mt-1">Importe do PTCG Live / Limitless</div>
            </button>

            <button 
              id="shortcut-matches"
              onClick={() => setActiveTab('partidas')}
              className="p-4 bg-slate-950/40 border border-slate-850 hover:border-purple-500/40 rounded-xl text-left transition-all cursor-pointer group hover:shadow-lg"
            >
              <div className="text-lg group-hover:scale-110 transition-transform mb-1.5">⚔️</div>
              <div className="text-xs font-extrabold text-white">Registrar Partida</div>
              <div className="text-[10px] text-slate-400 mt-1">Insira treinos MD1/MD3 e torneios</div>
            </button>

            <button 
              id="shortcut-team"
              onClick={() => setActiveTab('time')}
              className="p-4 bg-slate-950/40 border border-slate-850 hover:border-purple-500/40 rounded-xl text-left transition-all cursor-pointer group hover:shadow-lg"
            >
              <div className="text-lg group-hover:scale-110 transition-transform mb-1.5">👥</div>
              <div className="text-xs font-extrabold text-white">Membros do Time</div>
              <div className="text-[10px] text-slate-400 mt-1">Veja perfis, winrates e cartas favoritas</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
