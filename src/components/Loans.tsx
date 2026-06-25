import React, { useState, useEffect } from 'react';
import { db, collectionCol, loansCol, membersCol } from '../lib/firebase';
import { getDocs, query, where, addDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Member, CardItem, LoanRecord } from '../types';
import { 
  ArrowLeftRight, 
  Search, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  UserPlus, 
  RefreshCw, 
  Sparkles,
  Info
} from 'lucide-react';
import PokemonSprite from './PokemonSprite';

interface LoansProps {
  currentMember: Member;
}

export default function Loans({ currentMember }: LoansProps) {
  const [availableCards, setAvailableCards] = useState<CardItem[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestingCardId, setRequestingCardId] = useState<string | null>(null);
  const [requestQty, setRequestQty] = useState(1);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // 1. Load active lendable cards from all team members EXCEPT current user
        const cardsSnap = await getDocs(collectionCol);
        const cardsList = cardsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as CardItem))
          .filter(c => c.ownerId !== currentMember.id && c.isLendable);
        setAvailableCards(cardsList);

        // 2. Load all Loans
        const loansSnap = await getDocs(loansCol);
        const loansList = loansSnap.docs.map(d => ({ id: d.id, ...d.data() } as LoanRecord));
        setLoans(loansList);

        // 3. Load team members for avatar resolution
        const memSnap = await getDocs(membersCol);
        const memList = memSnap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
        setMembers(memList);

      } catch (err) {
        console.error('Error loading loaning system data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentMember]);

  const handleRequestLoan = async (card: CardItem) => {
    try {
      // Create pending loan record
      const newLoan: Omit<LoanRecord, 'id'> = {
        cardId: card.id,
        cardName: card.name,
        cardImageUrl: card.imageUrl,
        ownerId: card.ownerId,
        ownerName: card.ownerName,
        borrowerId: currentMember.id,
        borrowerName: currentMember.name,
        quantity: Math.min(requestQty, card.quantity),
        status: 'pending',
        requestedAt: new Date().toISOString()
      };

      const docRef = await addDoc(loansCol, newLoan);
      
      // Update local state with new record
      setLoans(prev => [...prev, { id: docRef.id, ...newLoan } as LoanRecord]);
      setRequestingCardId(null);
      setRequestQty(1);
      alert(`Solicitação enviada para ${card.ownerName}!`);
    } catch (err) {
      console.error('Error requesting loan:', err);
    }
  };

  const handleReturnLoan = async (loan: LoanRecord) => {
    if (!confirm(`Confirmar devolução das cartas "${loan.cardName}"?`)) return;

    try {
      const loanRef = doc(db, 'loans', loan.id);
      await updateDoc(loanRef, {
        status: 'returned',
        returnedAt: new Date().toISOString()
      });

      setLoans(prev => prev.map(l => 
        l.id === loan.id ? { ...l, status: 'returned', returnedAt: new Date().toISOString() } : l
      ));
    } catch (err) {
      console.error('Error returning loan:', err);
    }
  };

  const getMemberSprite = (userId: string): string => {
    const mem = members.find(m => m.id === userId);
    return mem ? mem.avatarSprite : 'substitute';
  };

  const filteredCards = availableCards.filter(card => 
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Split loans into active categories
  const myBorrowedCards = loans.filter(l => l.borrowerId === currentMember.id && l.status === 'active');
  const myLentCards = loans.filter(l => l.ownerId === currentMember.id && l.status === 'active');
  const pendingRequestsFromMe = loans.filter(l => l.borrowerId === currentMember.id && l.status === 'pending');
  const pendingRequestsToMe = loans.filter(l => l.ownerId === currentMember.id && l.status === 'pending');

  return (
    <div className="space-y-8" id="loans-system-view">
      
      {/* Header */}
      <div className="border-b border-slate-850 pb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🤝</span> Empréstimos Spirits
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Compartilhe e pegue emprestadas cartas raras do time de forma organizada. Garantia de rastreabilidade para nenhum card sumir!
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <PokemonSprite name="alakazam" size="lg" className="animate-bounce" />
          <p className="mt-4 text-purple-300 font-mono text-xs animate-pulse">Carregando portal de empréstimos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: Browse available cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Acervo Compartilhado do Time</h2>
                  <p className="text-xs text-slate-400">Cartas raras disponibilizadas por outros Spirits members para empréstimo</p>
                </div>
                
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="borrow-search"
                    type="text"
                    placeholder="Buscar por carta ou dono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-xs outline-none"
                  />
                </div>
              </div>

              {filteredCards.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  {searchTerm ? 'Nenhuma carta corresponde à busca.' : 'Nenhuma carta compartilhada disponível no momento. Incentive seu time a cadastrar na aba Coleção!'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredCards.map(card => {
                    const isRequesting = requestingCardId === card.id;
                    const hasPendingRequest = pendingRequestsFromMe.some(r => r.cardId === card.id);

                    return (
                      <div 
                        key={card.id} 
                        className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex gap-3 hover:border-purple-500/30 transition-all duration-300"
                        id={`lend-card-${card.id}`}
                      >
                        <img 
                          src={card.imageUrl} 
                          alt={card.name} 
                          className="w-20 h-28 object-contain rounded border border-slate-800" 
                          referrerPolicy="no-referrer"
                        />
                        
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] uppercase font-mono text-purple-400 font-bold">{card.setName}</span>
                            <h3 className="text-white font-bold text-sm mt-0.5">{card.name}</h3>
                            
                            {/* Owner profile details */}
                            <div className="flex items-center gap-1.5 mt-2">
                              <PokemonSprite name={getMemberSprite(card.ownerId)} size="sm" className="w-5 h-5" />
                              <span className="text-[11px] text-slate-400">Dono: <strong className="text-slate-300 font-semibold">{card.ownerName}</strong></span>
                            </div>
                          </div>

                          <div className="mt-3">
                            {hasPendingRequest ? (
                              <span className="text-[10px] bg-slate-900 text-amber-400 px-2.5 py-1 rounded-md border border-amber-500/20 font-bold block text-center">
                                Solicitado (Aguardando)
                              </span>
                            ) : isRequesting ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] text-slate-400">Qtd:</label>
                                  <input 
                                    id={`qty-input-${card.id}`}
                                    type="number" 
                                    min="1" 
                                    max={card.quantity} 
                                    value={requestQty}
                                    onChange={(e) => setRequestQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-850 text-white rounded text-xs font-mono"
                                  />
                                  <span className="text-[10px] text-slate-500">Max: {card.quantity}</span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    id={`confirm-loan-${card.id}`}
                                    onClick={() => handleRequestLoan(card)}
                                    className="flex-1 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded text-[10px] cursor-pointer"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    id={`cancel-loan-${card.id}`}
                                    onClick={() => setRequestingCardId(null)}
                                    className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[10px] cursor-pointer"
                                  >
                                    X
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                id={`request-loan-btn-${card.id}`}
                                onClick={() => {
                                  setRequestingCardId(card.id);
                                  setRequestQty(1);
                                }}
                                className="w-full py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-300 font-bold rounded text-xs border border-purple-500/20 hover:border-purple-500/40 cursor-pointer transition-all flex items-center justify-center gap-1"
                              >
                                Solicitar Empréstimo (x{card.quantity})
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

          {/* RIGHT COLUMNS: Active Loans Status */}
          <div className="space-y-6">
            
            {/* 1. Cards Borrowed by Me */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
                <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Cartas Comigo ({myBorrowedCards.length})</h2>
              </div>

              {myBorrowedCards.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">Nenhuma carta emprestada com você atualmente.</p>
              ) : (
                <div className="space-y-3">
                  {myBorrowedCards.map(loan => (
                    <div key={loan.id} className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 flex gap-2.5 items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={loan.cardImageUrl} alt={loan.cardName} className="w-8 h-11 object-contain rounded" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate" title={loan.cardName}>{loan.cardName} <span className="text-purple-400 font-mono">x{loan.quantity}</span></h4>
                          <p className="text-[9px] text-slate-500 truncate">Emprestado de: {loan.ownerName}</p>
                        </div>
                      </div>
                      
                      <button
                        id={`return-borrow-${loan.id}`}
                        onClick={() => handleReturnLoan(loan)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded text-[10px] cursor-pointer shrink-0"
                      >
                        Devolver
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Cards I have lent to others */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
                <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">Minhas Cartas Emprestadas ({myLentCards.length})</h2>
              </div>

              {myLentCards.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">Nenhuma carta sua está emprestada com outros jogadores.</p>
              ) : (
                <div className="space-y-3">
                  {myLentCards.map(loan => (
                    <div key={loan.id} className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 flex gap-2.5 items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={loan.cardImageUrl} alt={loan.cardName} className="w-8 h-11 object-contain rounded" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate" title={loan.cardName}>{loan.cardName} <span className="text-purple-400 font-mono">x{loan.quantity}</span></h4>
                          <p className="text-[9px] text-slate-500 truncate">Com: {loan.borrowerName}</p>
                        </div>
                      </div>

                      <button
                        id={`owner-return-${loan.id}`}
                        onClick={() => handleReturnLoan(loan)}
                        className="px-2.5 py-1 bg-purple-950/40 text-purple-400 hover:bg-purple-900 border border-purple-800/30 rounded text-[10px] font-semibold cursor-pointer shrink-0"
                      >
                        Confirmar Retorno
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions Info panel */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Info className="w-4 h-4" />
                <h3 className="text-xs uppercase tracking-wide">Como funciona?</h3>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
                <li>Cadastre as cartas raras sobressalentes que você tem no seu acervo pessoal através da aba <strong>Coleção</strong>.</li>
                <li>Marque-as como "Disponíveis" para permitir solicitações.</li>
                <li>Quando um colega pedir as cartas, o dono receberá um aviso no <strong>Dashboard</strong> para aprovação.</li>
                <li>Após as etapas ou torneios, clique em <strong>Devolver</strong> para registrar que o card voltou ao proprietário.</li>
              </ul>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
