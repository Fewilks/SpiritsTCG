import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Member } from '../types';
import { getRoleBadge } from '../utils';
import { 
  User, 
  Tag, 
  Flame, 
  Award, 
  ShieldAlert, 
  CheckCircle, 
  Lock, 
  Unlock,
  Save,
  HelpCircle,
  TrendingUp,
  LayoutDashboard,
  Layers,
  ArrowLeftRight,
  Swords,
  Trophy
} from 'lucide-react';
import PokemonSprite from './PokemonSprite';

interface MyProfileProps {
  currentMember: Member;
  setCurrentMember: (member: Member) => void;
  onMemberUpdated: () => void;
}

export default function MyProfile({ currentMember, setCurrentMember, onMemberUpdated }: MyProfileProps) {
  const [name, setName] = useState(currentMember.name || '');
  const [nickname, setNickname] = useState(currentMember.nickname || '');
  const [avatarSprite, setAvatarSprite] = useState(currentMember.avatarSprite || 'pikachu');
  const [role, setRole] = useState<'pokeball' | 'greatball' | 'ultraball' | 'masterball' | 'Premium ball'>(currentMember.role as any || 'pokeball');
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Update form values if currentMember changes (e.g. from switcher)
  useEffect(() => {
    setName(currentMember.name || '');
    setNickname(currentMember.nickname || '');
    setAvatarSprite(currentMember.avatarSprite || 'pikachu');
    setRole(currentMember.role as any || 'pokeball');
  }, [currentMember]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      if (!name.trim()) throw new Error('O nome não pode ficar vazio.');
      if (!nickname.trim()) throw new Error('O apelido (nickname) não pode ficar vazio.');

      const memberRef = doc(db, 'members', currentMember.id);
      const updatedFields = {
        name: name.trim(),
        nickname: nickname.trim().replace(/\s+/g, ''),
        avatarSprite: avatarSprite.trim().toLowerCase() || 'pikachu',
        role: role
      };

      await updateDoc(memberRef, updatedFields);

      // Sync local context in App state
      const updatedMember = { ...currentMember, ...updatedFields };
      setCurrentMember(updatedMember);
      onMemberUpdated();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Erro ao salvar alterações do perfil.');
    } finally {
      setSaving(false);
    }
  };

  // Access control mapping for presentation
  const getRoleRankValue = (r: string): number => {
    const norm = r.toLowerCase().replace(/\s+/g, '');
    if (norm === 'pokeball') return 1;
    if (norm === 'greatball') return 2;
    if (norm === 'ultraball') return 3;
    if (norm === 'masterball') return 4;
    if (norm === 'premiumball') return 5;
    return 1;
  };

  const currentRankVal = getRoleRankValue(role);

  const perks = [
    { id: 'dashboard', label: 'Acesso ao Dashboard', minRank: 1, minRankLabel: 'Pokéball', icon: LayoutDashboard },
    { id: 'time', label: 'Roster de Treinadores', minRank: 1, minRankLabel: 'Pokéball', icon: User },
    { id: 'colecao', label: 'Gerenciar Minha Coleção', minRank: 2, minRankLabel: 'Greatball', icon: Layers },
    { id: 'partidas', label: 'Registrar e Listar Partidas', minRank: 3, minRankLabel: 'Ultraball', icon: Swords },
    { id: 'emprestimos', label: 'Solicitar Empréstimos', minRank: 3, minRankLabel: 'Ultraball', icon: ArrowLeftRight },
    { id: 'decks_edit', label: 'Criar Decks Públicos', minRank: 4, minRankLabel: 'Masterball', icon: Trophy },
    { id: 'staff_actions', label: 'Ferramentas de Staff (Mudar cargos, cadastrar membros)', minRank: 5, minRankLabel: 'Premium ball', icon: Award },
  ];

  return (
    <div className="space-y-8" id="profile-management-view">
      {/* Page Header */}
      <div className="border-b border-slate-850 pb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>⚙️</span> Configurações do Meu Perfil
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Gerencie suas informações de jogador, selecione seu Pokémon de estimação como avatar animado e simule novos cargos competitivos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form & Avatar Update */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6" id="profile-form">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-3">
              <User className="w-4 h-4 text-purple-400" />
              Informações Gerais do Treinador
            </h3>

            {error && (
              <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl flex items-start gap-3 text-xs animate-shake" id="profile-save-error">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-start gap-3 text-xs" id="profile-save-success">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5 animate-bounce" />
                <span>Alterações salvas com sucesso no Firestore! Perfil sincronizado.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    id="profile-edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-slate-950/60 border border-slate-850 focus:border-purple-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Nickname */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Apelido (Nick Competitivo)</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    id="profile-edit-nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.replace(/\s+/g, ''))}
                    placeholder="Ex: SpiritsBoss"
                    className="w-full bg-slate-950/60 border border-slate-850 focus:border-purple-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-850 pt-5">
              {/* Avatar input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pokémon do Avatar (Em Inglês)</label>
                <div className="relative">
                  <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    id="profile-edit-avatar"
                    value={avatarSprite}
                    onChange={(e) => setAvatarSprite(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="Ex: pikachu, charizard, gengar"
                    className="w-full bg-slate-950/60 border border-slate-850 focus:border-purple-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">Conecta-se ao banco do Showdown para carregar o GIF animado correspondente.</p>
              </div>

              {/* Simulation Rank Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nível / Categoria de Acesso (Simulação)</label>
                <select 
                  id="profile-edit-role"
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 focus:border-purple-500/50 rounded-xl py-2.5 px-3 text-xs font-medium text-white focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="pokeball">🔴 Pokéball (Iniciante)</option>
                  <option value="greatball">🔵 Greatball (Membro Regular)</option>
                  <option value="ultraball">⚫ Ultraball (Competitivo Core)</option>
                  <option value="masterball">🟣 Masterball (Elite Pro)</option>
                  <option value="Premium ball">✨ Premium ball (Staff do Portal)</option>
                </select>
                <p className="text-[10px] text-slate-500 font-mono mt-1">Troque livremente para avaliar as permissões de acesso de cada cargo.</p>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 shrink-0 shadow-lg">
                <PokemonSprite name={avatarSprite || 'pikachu'} size="lg" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1">{getRoleBadge(role)}</div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Visualização do Avatar Ativo</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  Sprite animado para <strong className="text-purple-400">@{nickname || 'treinador'}</strong>. Caso digite um nome inválido, o sistema utilizará um Pokémon Substituto como padrão temporário.
                </p>
              </div>
            </div>

            <button
              type="submit"
              id="profile-save-btn"
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-950/30 border border-purple-500/20"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar e Atualizar Meu Perfil
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Roles Access & Perks Card */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6" id="access-level-guide">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
              <Award className="w-4.5 h-4.5 text-purple-400" />
              Níveis de Acesso por Cargo
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              O portal Spirits TCG emprega regras de cargo para delimitar recursos. Cada esfera representa um nível de progresso e privilégios competitivos:
            </p>

            <div className="space-y-4">
              {perks.map((perk) => {
                const isUnlocked = currentRankVal >= perk.minRank;
                const Icon = perk.icon;
                return (
                  <div 
                    key={perk.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                      isUnlocked 
                        ? 'bg-purple-950/10 border-purple-500/20 text-slate-100' 
                        : 'bg-slate-950/20 border-slate-850 text-slate-500'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isUnlocked ? 'bg-purple-900/30 text-purple-400' : 'bg-slate-950 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold leading-none">{perk.label}</span>
                        {isUnlocked ? (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded uppercase font-bold shrink-0">Ativo</span>
                        ) : (
                          <span className="text-[8px] bg-slate-900 text-slate-600 border border-slate-850 px-1 py-0.5 rounded uppercase font-bold shrink-0 flex items-center gap-0.5">
                            <Lock className="w-2 h-2" /> Bloqueado
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">
                        Requer: <strong className="text-slate-300">{perk.minRankLabel}</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 bg-slate-950/50 p-3.5 rounded-xl border border-slate-850 text-[10px] text-slate-400 leading-relaxed flex gap-2.5">
              <TrendingUp className="w-5 h-5 text-purple-400 shrink-0" />
              <span>
                <strong>Quer subir de rank?</strong> Você pode testar e simular todos os comportamentos de segurança do sistema trocando o cargo no formulário ao lado.
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
