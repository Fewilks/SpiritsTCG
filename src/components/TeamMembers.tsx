import React, { useState, useEffect } from 'react';
import { db, membersCol } from '../lib/firebase';
import { getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { Member } from '../types';
import { 
  PlusCircle, 
  X, 
  Sparkles, 
  Trophy, 
  Flame, 
  Calendar, 
  UserPlus, 
  ShieldCheck, 
  Heart,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import PokemonSprite from './PokemonSprite';

interface TeamMembersProps {
  currentMember: Member;
  setCurrentMember: (member: Member) => void;
  onMemberUpdated: () => void;
}

export default function TeamMembers({ currentMember, setCurrentMember, onMemberUpdated }: TeamMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Add Teammate form states
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Membro' | 'Capitão' | 'Treinador' | 'Líder'>('Membro');
  const [nickname, setNickname] = useState('');
  const [avatarSprite, setAvatarSprite] = useState('pikachu');
  const [favoriteCard, setFavoriteCard] = useState('');
  const [favoriteCardImage, setFavoriteCardImage] = useState('');
  const [registering, setRegistering] = useState(false);

  // Edit form states
  const [editNickname, setEditNickname] = useState(currentMember.nickname || '');
  const [editAvatarSprite, setEditAvatarSprite] = useState(currentMember.avatarSprite || 'pikachu');
  const [editFavoriteCard, setEditFavoriteCard] = useState(currentMember.favoriteCard || '');
  const [editFavoriteCardImage, setEditFavoriteCardImage] = useState(currentMember.favoriteCardImage || '');

  // Popular representative avatar suggestions
  const avatarOptions = [
    { name: 'Pikachu', id: 'pikachu' },
    { name: 'Charizard', id: 'charizard' },
    { name: 'Gengar', id: 'gengar' },
    { name: 'Mewtwo', id: 'mewtwo' },
    { name: 'Garchomp', id: 'garchomp' },
    { name: 'Snorlax', id: 'snorlax' },
    { name: 'Gardevoir', id: 'gardevoir' },
    { name: 'Alakazam', id: 'alakazam' },
    { name: 'Scizor', id: 'scizor' },
    { name: 'Lucario', id: 'lucario' },
    { name: 'Miraidon', id: 'miraidon' },
    { name: 'Ogerpon', id: 'teal-mask-ogerpon' },
    { name: 'Roaring Moon', id: 'roaring-moon' }
  ];

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(membersCol);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      // Sort by Win Rate or total wins
      list.sort((a, b) => b.wins - a.wins);
      setMembers(list);
    } catch (err) {
      console.error('Error fetching members list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Preencha pelo menos o nome!');
      return;
    }

    try {
      setRegistering(true);
      const newId = `member-${Date.now()}`;
      
      const newMember: Member = {
        id: newId,
        name: name.trim(),
        role: role,
        nickname: nickname.trim() || undefined,
        avatarSprite: avatarSprite,
        wins: 0,
        losses: 0,
        draws: 0,
        favoriteCard: favoriteCard.trim() || undefined,
        favoriteCardImage: favoriteCardImage.trim() || undefined,
        joinDate: new Date().toISOString().split('T')[0]
      };

      await setDoc(doc(db, 'members', newId), newMember);
      setMembers(prev => [...prev, newMember].sort((a, b) => b.wins - a.wins));
      setShowAddModal(false);

      // Reset fields
      setName('');
      setNickname('');
      setFavoriteCard('');
      setFavoriteCardImage('');

      alert(`Boas-vindas ao novo Spirits member: ${newMember.name}!`);
    } catch (err) {
      console.error('Error registering member:', err);
    } finally {
      setRegistering(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const pRef = doc(db, 'members', currentMember.id);
      const updatedFields = {
        nickname: editNickname.trim() || undefined,
        avatarSprite: editAvatarSprite,
        favoriteCard: editFavoriteCard.trim() || undefined,
        favoriteCardImage: editFavoriteCardImage.trim() || undefined
      };

      await updateDoc(pRef, updatedFields);
      
      // Update active user context
      const updatedMember = { ...currentMember, ...updatedFields };
      setCurrentMember(updatedMember);
      setShowEditModal(false);
      
      // Refresh list
      fetchMembers();
      onMemberUpdated();
      alert('Seu perfil de jogador foi atualizado com sucesso!');
    } catch (err) {
      console.error('Error updating player profile:', err);
    }
  };

  const getWinRate = (m: Member): string => {
    const total = m.wins + m.losses + m.draws;
    if (total === 0) return '0.0';
    return ((m.wins / total) * 105).toFixed(1); // Win share % scaling
  };

  return (
    <div className="space-y-8" id="members-roster-view">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-850 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>👥</span> Roster de Jogadores Spirits
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Conheça o elenco competitivo da Spirits. Ajuste seu avatar favorito e acompanhe o desempenho dos principais mestres Pokémon do time.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            id="btn-edit-my-profile"
            onClick={() => {
              setEditNickname(currentMember.nickname || '');
              setEditAvatarSprite(currentMember.avatarSprite || 'pikachu');
              setEditFavoriteCard(currentMember.favoriteCard || '');
              setEditFavoriteCardImage(currentMember.favoriteCardImage || '');
              setShowEditModal(true);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-sm flex items-center gap-2 border border-slate-700 cursor-pointer transition-all"
          >
            <UserCheck className="w-5 h-5 text-purple-400" /> Editar Meu Perfil
          </button>
          
          <button
            id="btn-register-new-member"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer transition-all"
          >
            <UserPlus className="w-5 h-5" /> Adicionar Novo Membro
          </button>
        </div>
      </div>

      {/* Roster list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <PokemonSprite name="lucario" size="lg" className="animate-bounce" />
          <p className="mt-4 text-purple-300 font-mono text-xs">Convocando conselho dos Spirits...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="roster-grid">
          {members.map((mem, idx) => (
            <div 
              key={mem.id} 
              className={`bg-slate-900/60 border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                mem.id === currentMember.id 
                  ? 'border-purple-500 shadow-xl shadow-purple-950/10 bg-gradient-to-br from-slate-900/80 via-indigo-950/10 to-purple-950/20' 
                  : 'border-slate-800/80 hover:border-purple-500/30'
              }`}
              id={`roster-card-${mem.id}`}
            >
              {/* Positional ranking flag */}
              <div className="absolute top-3 right-4 font-mono text-slate-700 text-3xl font-extrabold pointer-events-none">
                #{idx + 1}
              </div>

              <div className="space-y-5">
                {/* Avatar and name info */}
                <div className="flex items-center gap-4">
                  <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                    <PokemonSprite name={mem.avatarSprite} size="md" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-extrabold text-base">{mem.name}</span>
                      {mem.id === currentMember.id && (
                        <span className="text-[9px] bg-purple-600 text-white font-mono font-bold px-1 py-0.5 rounded">Você</span>
                      )}
                    </div>
                    <p className="text-xs text-purple-400 font-semibold mt-0.5">{mem.nickname ? `@${mem.nickname}` : 'Sem apelido'}</p>
                    
                    {/* Role tag */}
                    <span className="inline-block text-[9px] font-bold text-slate-300 bg-slate-850 border border-slate-800 rounded px-1.5 py-0.5 mt-1.5">
                      🛡️ {mem.role}
                    </span>
                  </div>
                </div>

                {/* Score breakdown stats */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-850/80 text-center">
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Vitórias</div>
                    <div className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5">{mem.wins}</div>
                  </div>
                  <div className="border-l border-slate-850">
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Derrotas</div>
                    <div className="text-sm font-extrabold text-rose-400 font-mono mt-0.5">{mem.losses}</div>
                  </div>
                  <div className="border-l border-slate-850">
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Empates</div>
                    <div className="text-sm font-extrabold text-slate-400 font-mono mt-0.5">{mem.draws}</div>
                  </div>
                </div>

                {/* Favorite Card, if exists */}
                {mem.favoriteCard && (
                  <div className="flex items-center gap-2.5 bg-slate-950/20 p-2.5 rounded-xl border border-slate-850/40 text-xs">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-slate-400">Favorito: <strong className="text-slate-300">{mem.favoriteCard}</strong></span>
                    {mem.favoriteCardImage && (
                      <img src={mem.favoriteCardImage} alt={mem.favoriteCard} className="w-5 h-7 object-contain ml-auto rounded" />
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-5 border-t border-slate-850 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Membro desde: {mem.joinDate}
                </div>

                <div className="text-slate-400">
                  Win Rate: <strong className="text-white">{getWinRate(mem)}%</strong>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add Teammate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="add-member-modal">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-slate-900">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Cadastrar Novo Spirits Member</h3>
              </div>
              <button 
                id="close-add-member-x"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterMember} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Nome Completo:</label>
                  <input
                    id="member-name-input"
                    type="text"
                    placeholder="ex: Carlos Alberto"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Cargo / Role:</label>
                  <select
                    id="member-role-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                  >
                    <option value="Membro">Membro</option>
                    <option value="Capitão">Capitão</option>
                    <option value="Treinador">Treinador</option>
                    <option value="Líder">Líder</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase">Nickname / Apelido em Jogo (Opcional):</label>
                <input
                  id="member-nickname-input"
                  type="text"
                  placeholder="ex: FireBlast99"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                />
              </div>

              {/* Avatar options suggest list */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase">Selecione seu Pokémon Representativo (Sprite Animado):</label>
                <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-850">
                  {avatarOptions.map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setAvatarSprite(opt.id)}
                      className={`p-1.5 rounded-lg border text-center cursor-pointer transition-all ${
                        avatarSprite === opt.id 
                          ? 'bg-purple-950/60 border-purple-500 text-white' 
                          : 'bg-slate-900/40 border-slate-850 hover:border-slate-700 text-slate-400'
                      }`}
                      id={`opt-avatar-${opt.id}`}
                    >
                      <PokemonSprite name={opt.id} size="sm" className="mx-auto" />
                      <div className="text-[9px] mt-1 font-semibold truncate">{opt.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Favorite card options */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Carta Pokémon Favorita:</label>
                  <input
                    id="member-favcard-input"
                    type="text"
                    placeholder="ex: Charizard ex"
                    value={favoriteCard}
                    onChange={(e) => setFavoriteCard(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Link da Imagem da Carta (Opcional):</label>
                  <input
                    id="member-favimg-input"
                    type="text"
                    placeholder="Cole um link ou deixe vazio"
                    value={favoriteCardImage}
                    onChange={(e) => setFavoriteCardImage(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                  />
                </div>
              </div>

              <button
                id="btn-submit-add-member"
                type="submit"
                disabled={registering}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-sm cursor-pointer shadow-lg"
              >
                {registering ? 'Efetuando matrícula Spirits...' : 'Cadastrar Spirits Member'}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="edit-profile-modal">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-slate-900">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Editar Meu Perfil Spirits</h3>
              </div>
              <button 
                id="close-edit-profile-x"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateProfile} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase">Nickname / Apelido em Jogo:</label>
                <input
                  id="edit-nickname-input"
                  type="text"
                  placeholder="Seu nick competitivo"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                />
              </div>

              {/* Avatar options suggest list */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase">Altere seu Pokémon Representativo (Sprite Animado):</label>
                <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-850">
                  {avatarOptions.map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setEditAvatarSprite(opt.id)}
                      className={`p-1.5 rounded-lg border text-center cursor-pointer transition-all ${
                        editAvatarSprite === opt.id 
                          ? 'bg-purple-950/60 border-purple-500 text-white' 
                          : 'bg-slate-900/40 border-slate-850 hover:border-slate-700 text-slate-400'
                      }`}
                      id={`edit-opt-avatar-${opt.id}`}
                    >
                      <PokemonSprite name={opt.id} size="sm" className="mx-auto" />
                      <div className="text-[9px] mt-1 font-semibold truncate">{opt.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Favorite card options */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Sua Carta Pokémon Favorita:</label>
                  <input
                    id="edit-favcard-input"
                    type="text"
                    placeholder="ex: Miraidon ex"
                    value={editFavoriteCard}
                    onChange={(e) => setEditFavoriteCard(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Link da Imagem da Carta:</label>
                  <input
                    id="edit-favimg-input"
                    type="text"
                    placeholder="Cole um link de imagem"
                    value={editFavoriteCardImage}
                    onChange={(e) => setEditFavoriteCardImage(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-lg text-white text-sm outline-none"
                  />
                </div>
              </div>

              <button
                id="btn-submit-edit-profile"
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm cursor-pointer shadow-lg"
              >
                Salvar Alterações no Meu Perfil
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
