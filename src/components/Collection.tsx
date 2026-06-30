import React, { useState, useEffect } from 'react';
import { db, collectionCol } from '../lib/firebase';
import { getDocs, query, where, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Member, CardItem } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Globe, 
  Grid, 
  Users, 
  Sparkles, 
  Heart,
  PlusCircle,
  X,
  Info
} from 'lucide-react';
import PokemonSprite from './PokemonSprite';

interface CollectionProps {
  currentMember: Member;
}

export default function Collection({ currentMember }: CollectionProps) {
  const [collectionCards, setCollectionCards] = useState<CardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [sets, setSets] = useState<any[]>([]);
  const [selectedSet, setSelectedSet] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLendable, setIsLendable] = useState(true);

  // Filtros locais para visualização do acervo
  const [collectionSearch, setCollectionSearch] = useState('');
  const [collectionSetFilter, setCollectionSetFilter] = useState('');

  // Paginação para busca no banco de dados oficial
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // ----------------------------------------------
  // Buscar sets diretamente da nossa rota (que possui fallback robusto)
  // ----------------------------------------------
  useEffect(() => {
    async function fetchSets() {
      try {
        const res = await fetch('/api/pokemon/sets');
        if (res.ok) {
          const data = await res.json();
          setSets(data);
        }
      } catch (err) {
        console.error('Error fetching sets:', err);
      }
    }
    fetchSets();
  }, []);

  const [collectionTab, setCollectionTab] = useState<'my' | 'team'>('my');

  useEffect(() => {
    async function fetchCollection() {
      try {
        setLoading(true);
        const q = collectionTab === 'my'
          ? query(collectionCol, where('ownerId', '==', currentMember.id))
          : collectionCol;
        const snap = await getDocs(q);
        const cards = snap.docs.map(d => ({ id: d.id, ...d.data() } as CardItem));
        setCollectionCards(cards);
      } catch (err) {
        console.error('Error fetching collection:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCollection();
  }, [currentMember, collectionTab]);

  // ----------------------------------------------
  // Buscar cartas diretamente na API oficial com paginação
  // ----------------------------------------------
  const handleDatabaseSearch = async (e?: React.FormEvent, pageToLoad: number = 1) => {
    if (e) {
      e.preventDefault();
      pageToLoad = 1;
    }
    if (!searchQuery.trim() && !selectedSet) return;

    try {
      setSearching(true);
      const url = `/api/pokemon/search?pageSize=60&page=${pageToLoad}&q=${encodeURIComponent(searchQuery.trim())}&set=${selectedSet}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Formata os resultados para o modelo esperado pelo componente
        const formatted = (data.data || []).map((card: any) => ({
          id: card.id,
          name: card.name,
          imageUrl: card.images?.small || card.images?.large || '',
          setCode: card.set?.id || '',
          setName: card.set?.name || '',
          setNumber: card.number || ''
        }));
        
        if (pageToLoad === 1) {
          setSearchResults(formatted);
        } else {
          setSearchResults(prev => [...prev, ...formatted]);
        }

        const totalCount = data.totalCount || 0;
        setTotalResults(totalCount);
        setHasMore(pageToLoad * 60 < totalCount);
        setPage(pageToLoad);
      }
    } catch (err) {
      console.error('Error searching cards:', err);
    } finally {
      setSearching(false);
    }
  };

  // Pesquisa automática ao trocar de set
  useEffect(() => {
    if (selectedSet) {
      handleDatabaseSearch(undefined, 1);
    }
  }, [selectedSet]);

  const handleOpenAdd = (card: any) => {
    setSelectedCard(card);
    setQuantity(1);
    setIsLendable(true);
    setShowAddModal(true);
  };

  const handleAddCardToDb = async () => {
    if (!selectedCard) return;

    try {
      const userCardId = `${currentMember.id}_${selectedCard.id}`;
      const cardRef = doc(db, 'collection', userCardId);
      
      const existingCard = collectionCards.find(c => c.id === userCardId);
      
      if (existingCard) {
        const newQty = existingCard.quantity + quantity;
        await updateDoc(cardRef, { quantity: newQty });
        setCollectionCards(prev => prev.map(c => 
          c.id === userCardId ? { ...c, quantity: newQty } : c
        ));
      } else {
        const newCard: CardItem = {
          id: userCardId,
          name: selectedCard.name,
          imageUrl: selectedCard.imageUrl,
          setCode: selectedCard.setCode || 'sv1',
          setName: selectedCard.setName || 'Unknown Set',
          setNumber: selectedCard.setNumber || '1',
          quantity: quantity,
          ownerId: currentMember.id,
          ownerName: currentMember.name,
          isLendable: isLendable,
          createdAt: new Date().toISOString()
        };
        
        await setDoc(cardRef, newCard);
        setCollectionCards(prev => [...prev, newCard]);
      }

      setShowAddModal(false);
      setSelectedCard(null);
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      console.error('Error adding card:', err);
    }
  };

  const handleRemoveCard = async (cardId: string) => {
    if (!confirm('Deseja mesmo remover esta carta da sua coleção?')) return;

    try {
      await deleteDoc(doc(db, 'collection', cardId));
      setCollectionCards(prev => prev.filter(c => c.id !== cardId));
    } catch (err) {
      console.error('Error removing card:', err);
    }
  };

  const handleToggleLendable = async (cardId: string, currentStatus: boolean) => {
    try {
      const cardRef = doc(db, 'collection', cardId);
      await updateDoc(cardRef, { isLendable: !currentStatus });
      setCollectionCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, isLendable: !currentStatus } : c
      ));
    } catch (err) {
      console.error('Error toggling lendable status:', err);
    }
  };

  const handleUpdateQty = async (cardId: string, change: number) => {
    const card = collectionCards.find(c => c.id === cardId);
    if (!card) return;

    const newQty = card.quantity + change;
    if (newQty <= 0) {
      handleRemoveCard(cardId);
      return;
    }

    try {
      const cardRef = doc(db, 'collection', cardId);
      await updateDoc(cardRef, { quantity: newQty });
      setCollectionCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, quantity: newQty } : c
      ));
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const filteredCollection = collectionCards.filter(card => {
    const matchesSearch = !collectionSearch.trim() || 
      card.name.toLowerCase().includes(collectionSearch.toLowerCase()) ||
      (card.setName && card.setName.toLowerCase().includes(collectionSearch.toLowerCase()));
    const matchesSet = !collectionSetFilter || card.setCode === collectionSetFilter;
    return matchesSearch && matchesSet;
  });

  return (
    <div className="space-y-8" id="collection-view">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-850 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🎁</span> Acervo de Cartas Spirits
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            Mantenha seu acervo de cartas Pokémon TCG atualizado e colabore com empréstimos de cartas para fortalecer o time!
          </p>
        </div>
        
        <button
          id="btn-add-card-to-collection"
          onClick={() => {
            setSelectedCard(null);
            setSearchResults([]);
            setSearchQuery('');
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 shrink-0"
        >
          <PlusCircle className="w-5 h-5" /> Adicionar Nova Carta
        </button>
      </div>

      {/* Tabs & Local Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex gap-2 bg-slate-900/40 p-1.5 rounded-xl border border-slate-800/65 max-w-sm w-full">
          <button
            id="collection-tab-my"
            onClick={() => setCollectionTab('my')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              collectionTab === 'my'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            👤 Minha Coleção
          </button>
          <button
            id="collection-tab-team"
            onClick={() => setCollectionTab('team')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              collectionTab === 'team'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            👥 Acervo do Time
          </button>
        </div>

        {/* Local Search and Filter for owned collection */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="collection-local-search"
              type="text"
              placeholder="Buscar no acervo por nome ou coleção..."
              value={collectionSearch}
              onChange={(e) => setCollectionSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl text-white text-xs outline-none font-sans"
            />
          </div>
          <div className="w-full sm:w-52">
            <select
              id="collection-local-set-filter"
              value={collectionSetFilter}
              onChange={(e) => setCollectionSetFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl text-white text-xs outline-none font-sans cursor-pointer"
            >
              <option value="">Todas as Coleções</option>
              {sets.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid da coleção */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <PokemonSprite name="charizard" size="lg" className="animate-spin" />
          <p className="mt-4 text-purple-300 font-mono text-xs animate-pulse">Carregando acervo...</p>
        </div>
      ) : collectionCards.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center backdrop-blur-md" id="empty-collection-state">
          <div className="text-5xl mb-4">🎴</div>
          <h3 className="text-lg font-bold text-white">
            {collectionTab === 'my' ? 'Sua coleção está vazia!' : 'Nenhuma carta registrada no time!'}
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm font-sans leading-relaxed">
            {collectionTab === 'my' 
              ? 'Cadastre suas cartas ex, VSTAR e treinadores mais raros para que seus companheiros de time possam vê-los!'
              : 'Nenhum integrante cadastrou cartas para compartilhar ainda.'}
          </p>
          {collectionTab === 'my' && (
            <button
              id="empty-state-add"
              onClick={() => setShowAddModal(true)}
              className="mt-6 px-5 py-2.5 bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm cursor-pointer shadow-lg shadow-purple-950/30 transition-all duration-300"
            >
              Adicionar Minha Primeira Carta
            </button>
          )}
        </div>
      ) : filteredCollection.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center backdrop-blur-md" id="empty-filtered-collection-state">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-bold text-white font-sans">Nenhuma carta encontrada</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm font-sans leading-relaxed">
            Não encontramos cartas no acervo correspondentes à sua busca ou filtro. Tente mudar os filtros ou limpar a pesquisa.
          </p>
          <button
            id="clear-collection-filters"
            onClick={() => {
              setCollectionSearch('');
              setCollectionSetFilter('');
            }}
            className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6" id="collection-grid">
          {filteredCollection.map(card => (
            <div 
              key={card.id} 
              className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(147,51,234,0.05)] transition-all duration-300 group flex flex-col justify-between backdrop-blur-md"
              id={`collection-card-${card.id}`}
            >
              <div className="p-3 relative aspect-[3/4] flex items-center justify-center bg-slate-950/20">
                <img 
                  src={card.imageUrl} 
                  alt={card.name} 
                  className="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform duration-300" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 right-2.5 bg-purple-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-lg border border-purple-400/20 font-mono">
                  x{card.quantity}
                </div>
                <div className={`absolute bottom-2.5 left-2.5 right-2.5 text-[9px] font-bold text-center py-1 rounded-lg border backdrop-blur-md ${
                  card.isLendable 
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/20' 
                    : 'bg-rose-950/80 text-rose-300 border-rose-500/20'
                }`}>
                  {card.isLendable ? '🟢 DISPONÍVEL' : '🔴 RESERVADO'}
                </div>
              </div>
              <div className="p-4 bg-slate-950/40 border-t border-slate-850/60 space-y-3">
                <div>
                  <h3 className="text-white font-extrabold text-xs truncate" title={card.name}>{card.name}</h3>
                  <div className="text-[10px] text-slate-450 flex items-center justify-between mt-1">
                    <span className="truncate">{card.setName}</span>
                    <span className="font-mono text-purple-350 shrink-0 font-bold">{card.setNumber}</span>
                  </div>
                </div>
                {card.ownerId === currentMember.id ? (
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-850/60">
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-850">
                      <button id={`qty-dec-${card.id}`} onClick={() => handleUpdateQty(card.id, -1)} className="text-slate-400 hover:text-white font-black text-xs cursor-pointer px-1">-</button>
                      <span className="text-white text-xs font-bold font-mono">{card.quantity}</span>
                      <button id={`qty-inc-${card.id}`} onClick={() => handleUpdateQty(card.id, 1)} className="text-slate-400 hover:text-white font-black text-xs cursor-pointer px-1">+</button>
                    </div>
                    <div className="flex gap-1.5">
                      <button id={`toggle-lend-${card.id}`} onClick={() => handleToggleLendable(card.id, card.isLendable)} className={`p-1.5 rounded-lg transition-all cursor-pointer border ${card.isLendable ? 'bg-emerald-950/50 hover:bg-emerald-900 border-emerald-500/20 text-emerald-400' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400'}`}><Users className="w-3.5 h-3.5" /></button>
                      <button id={`delete-card-${card.id}`} onClick={() => handleRemoveCard(card.id)} className="p-1.5 bg-rose-955 hover:bg-rose-900 border border-rose-500/10 text-rose-400 rounded-lg transition-all cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-850/60 text-xs">
                    <div className="text-slate-400 truncate max-w-[100px] font-sans font-medium flex items-center gap-1" title={card.ownerName}>👤 {card.ownerName}</div>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded border ${card.isLendable ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' : 'bg-rose-950/40 text-rose-400 border-rose-500/20'}`}>{card.isLendable ? 'Disponível' : 'Reservado'}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Adição */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="add-card-modal">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-slate-900">
              <div className="flex items-center gap-2">
                <span className="text-lg">🃏</span>
                <h3 className="text-base font-bold text-white">Adicionar Carta ao seu Acervo</h3>
              </div>
              <button 
                id="close-modal-x"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedCard(null);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Busca */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/50">
              <form onSubmit={handleDatabaseSearch} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                  <input
                    id="modal-card-search-input"
                    type="text"
                    placeholder="Busque cartas em inglês ou português"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-white text-sm outline-none font-sans"
                  />
                </div>
                <div className="w-full sm:w-56 shrink-0">
                  <select
                    id="modal-set-filter"
                    value={selectedSet}
                    onChange={(e) => setSelectedSet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-white text-sm outline-none font-sans cursor-pointer"
                  >
                    <option value="">Todas as Coleções</option>
                    {sets.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  id="modal-search-submit"
                  type="submit"
                  disabled={searching}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {searching ? 'Buscando...' : 'Pesquisar'}
                </button>
              </form>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3 text-purple-400 shrink-0" />
                <span>Dados oficiais do Pokémon TCG. Sempre atualizado.</span>
              </div>
            </div>

            {/* Resultados / detalhes */}
            <div className="p-5 overflow-y-auto flex-1 bg-slate-900/50">
              {selectedCard ? (
                <div className="flex flex-col sm:flex-row gap-6 animate-fade-in">
                  <div className="w-full sm:w-1/3 flex justify-center">
                    <img 
                      src={selectedCard.imageUrl} 
                      alt={selectedCard.name} 
                      className="max-h-64 object-contain rounded-lg drop-shadow-lg" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 space-y-6">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-purple-400">{selectedCard.setName || 'Coleção'}</span>
                      <h4 className="text-xl font-bold text-white mt-1">{selectedCard.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Set: {selectedCard.setCode?.toUpperCase()} | Número: #{selectedCard.setNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Quantidade de cópias:</label>
                      <div className="flex items-center gap-3">
                        <button id="btn-qty-dec" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-extrabold flex items-center justify-center cursor-pointer">-</button>
                        <span className="text-xl font-bold font-mono text-white w-12 text-center">{quantity}</span>
                        <button id="btn-qty-inc" onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-extrabold flex items-center justify-center cursor-pointer">+</button>
                      </div>
                    </div>
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850 space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input id="checkbox-is-lendable" type="checkbox" checked={isLendable} onChange={e => setIsLendable(e.target.checked)} className="mt-1 accent-purple-600 rounded" />
                        <div>
                          <span className="text-sm font-bold text-white block">Compartilhar com o time Spirits</span>
                          <span className="text-xs text-slate-400">Permitir que outros membros solicitem empréstimo desta carta.</span>
                        </div>
                      </label>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button id="btn-submit-add-card" onClick={handleAddCardToDb} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm rounded-xl cursor-pointer">Salvar na Minha Coleção</button>
                      <button id="btn-cancel-add-card" onClick={() => setSelectedCard(null)} className="px-5 py-3 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-sm rounded-xl cursor-pointer">Voltar para Busca</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {searching && page === 1 ? (
                    <div className="text-center py-10 flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 text-sm mt-3 font-mono">Pesquisando base de dados oficial...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Digite o nome de uma carta e clique em Pesquisar.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {searchResults.map((card) => (
                          <div
                            key={card.id}
                            onClick={() => handleOpenAdd(card)}
                            className="bg-slate-950/60 hover:bg-slate-950 p-2.5 rounded-xl border border-slate-850 hover:border-purple-500/50 cursor-pointer transition-all duration-300 group flex flex-col justify-between"
                          >
                            <div className="aspect-[3/4] flex items-center justify-center relative mb-2">
                              <img 
                                src={card.imageUrl} 
                                alt={card.name} 
                                className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <div className="text-white font-bold text-xs truncate group-hover:text-purple-400 transition-colors">{card.name}</div>
                              <div className="text-[9px] text-slate-550 mt-0.5 truncate">{card.setName} ({card.setNumber})</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {hasMore && (
                        <div className="flex justify-center pt-2">
                          <button
                            id="btn-load-more-search"
                            type="button"
                            onClick={() => handleDatabaseSearch(undefined, page + 1)}
                            disabled={searching}
                            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 border border-slate-750 hover:border-purple-500/30 shadow-lg"
                          >
                            {searching ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-slate-200 border-t-transparent rounded-full animate-spin"></div>
                                Carregando...
                              </>
                            ) : (
                              'Carregar mais cartas'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
