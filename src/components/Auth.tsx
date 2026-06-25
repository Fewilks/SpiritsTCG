import React, { useState } from 'react';
import { 
  auth, 
  db, 
  membersCol 
} from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { Member } from '../types';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  Tag, 
  Flame, 
  ArrowRight, 
  AlertCircle,
  HelpCircle,
  Users
} from 'lucide-react';
import PokemonSprite from './PokemonSprite';

interface AuthProps {
  onAuthSuccess: () => void;
}

const AVATAR_OPTIONS = [
  { name: 'pikachu', label: 'Pikachu' },
  { name: 'charizard', label: 'Charizard' },
  { name: 'gengar-gmax', label: 'Gengar' },
  { name: 'snorlax', label: 'Snorlax' },
  { name: 'alakazam', label: 'Alakazam' },
  { name: 'mew', label: 'Mew' },
  { name: 'lucario', label: 'Lucario' },
  { name: 'gardevoir', label: 'Gardevoir' },
  { name: 'lugia', label: 'Lugia' },
  { name: 'blastoise', label: 'Blastoise' },
  { name: 'venusaur', label: 'Venusaur' }
];

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration specific state
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<'Membro' | 'Capitão' | 'Treinador' | 'Líder'>('Membro');
  const [avatarSprite, setAvatarSprite] = useState('pikachu');
  const [favoriteCard, setFavoriteCard] = useState('Charizard ex');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // Handle Email & Password Login
        await signInWithEmailAndPassword(auth, email.trim(), password);
        onAuthSuccess();
      } else {
        // Handle Registration
        if (!name.trim()) throw new Error('O campo Nome Completo é obrigatório');
        if (!nickname.trim()) throw new Error('O campo Apelido é obrigatório');

        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCred.user;

        // Create Member entry in Firestore
        const newMember: Member = {
          id: user.uid,
          name: name.trim(),
          role: role,
          nickname: nickname.trim(),
          avatarSprite: avatarSprite,
          wins: 0,
          losses: 0,
          draws: 0,
          favoriteCard: favoriteCard.trim() || 'Charizard ex',
          favoriteCardImage: 'https://images.pokemontcg.io/sv3-125_hires.png', // Default high-res Charizard ex
          joinDate: new Date().toISOString().split('T')[0]
        };

        await setDoc(doc(db, 'members', user.uid), newMember);
        
        setSuccessMsg('Cadastro realizado com sucesso! Conectando...');
        setTimeout(() => {
          onAuthSuccess();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let translatedError = 'Ocorreu um erro ao processar sua solicitação.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        translatedError = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/email-already-in-use') {
        translatedError = 'Este e-mail já está sendo utilizado.';
      } else if (err.code === 'auth/weak-password') {
        translatedError = 'A senha deve conter no mínimo 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        translatedError = 'Formato de e-mail inválido.';
      } else if (err.message) {
        translatedError = err.message;
      }
      
      setError(translatedError);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic test / demo login setup
  const loginAsDemoUser = async (demoEmail: string, demoName: string, demoNickname: string, demoRole: any, demoAvatar: string, demoFavCard: string) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      console.log(`Attempting login as demo user: ${demoEmail}`);
      // Try to sign in
      try {
        await signInWithEmailAndPassword(auth, demoEmail, 'spirits123456');
        console.log('Demo user authenticated successfully');
        onAuthSuccess();
      } catch (signInErr: any) {
        // If user doesn't exist, create them on the fly!
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          console.log(`Demo user ${demoEmail} not found, creating dynamically...`);
          const userCred = await createUserWithEmailAndPassword(auth, demoEmail, 'spirits123456');
          const uid = userCred.user.uid;

          // Register in members collection
          const demoMember: Member = {
            id: uid,
            name: demoName,
            role: demoRole,
            nickname: demoNickname,
            avatarSprite: demoAvatar,
            wins: Math.floor(Math.random() * 30) + 15,
            losses: Math.floor(Math.random() * 15) + 5,
            draws: Math.floor(Math.random() * 6),
            favoriteCard: demoFavCard,
            favoriteCardImage: 'https://images.pokemontcg.io/sv3-125_hires.png',
            joinDate: '2025-01-10'
          };

          await setDoc(doc(db, 'members', uid), demoMember);
          console.log('Demo user registered and seeded');
          onAuthSuccess();
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.error('Demo Login Error:', err);
      setError('Falha ao autenticar usuário demo: ' + (err.message || err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden" id="auth-screen">
      
      {/* Absolute Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl -z-10 animate-pulse delay-1000"></div>

      <div className="w-full max-w-xl bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-850 shadow-2xl p-6 md:p-8 relative">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-gradient-to-tr from-purple-650 to-indigo-650 rounded-2xl items-center justify-center shadow-lg shadow-purple-950/50 border border-purple-400/20 mb-4 animate-bounce">
            <span className="text-4xl">👻</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
            SPIRITS <span className="text-purple-400 font-mono">TCG</span>
          </h1>
          <p className="text-xs text-purple-350 font-bold uppercase tracking-widest mt-1">Portal de Gestão Competitiva</p>
          <div className="h-0.5 w-12 bg-purple-500/50 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Success or Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl flex items-start gap-3 text-sm animate-shake" id="auth-error-msg">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-start gap-3 text-sm" id="auth-success-msg">
            <Sparkles className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Navigation Selector */}
        <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-850/80 mb-6">
          <button 
            id="tab-login"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${isLogin ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Entrar
          </button>
          <button 
            id="tab-register"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${!isLogin ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Cadastrar-se
          </button>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* REGISTRATION ONLY FIELDS */}
          {!isLogin && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Full Name & Nickname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
                    <input 
                      type="text" 
                      id="register-name"
                      placeholder="Ex: Guilherme Silva" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Apelido (Nick)</label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
                    <input 
                      type="text" 
                      id="register-nickname"
                      placeholder="Ex: SpiritsBoss" 
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Favorite Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Cargo na Spirits</label>
                  <select 
                    id="register-role"
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2.5 px-3 text-xs font-medium text-white focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="Membro">Membro</option>
                    <option value="Treinador">Treinador</option>
                    <option value="Capitão">Capitão</option>
                    <option value="Líder">Líder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Carta Favorita</label>
                  <div className="relative">
                    <Flame className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
                    <input 
                      type="text" 
                      id="register-favcard"
                      placeholder="Ex: Charizard ex" 
                      value={favoriteCard}
                      onChange={(e) => setFavoriteCard(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Avatar/Sprite Selection */}
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Selecione seu Avatar Pokémon</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-slate-950/30 p-2 rounded-xl border border-slate-850 max-h-36 overflow-y-auto">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      id={`avatar-option-${opt.name}`}
                      onClick={() => setAvatarSprite(opt.name)}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${avatarSprite === opt.name ? 'bg-purple-600/20 border-purple-500' : 'bg-slate-950/20 border-transparent hover:border-slate-800'}`}
                    >
                      <PokemonSprite name={opt.name} size="sm" className="w-8 h-8 scale-110" />
                      <span className="text-[9px] text-slate-400 font-medium truncate mt-1 w-full text-center">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* BASIC CREDENTIALS (ALWAYS REQUIRED) */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">E-mail corporativo / pessoal</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
                <input 
                  type="email" 
                  id="auth-email"
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Senha de acesso</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
                <input 
                  type="password" 
                  id="auth-password"
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-600 hover:to-indigo-600 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-950/30 mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {isLogin ? 'Entrar no Portal' : 'Concluir Cadastro'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* DEMO / TESTING BYPASS ACCOUNTS (Extremely helpful visual helper) */}
        <div className="mt-8 border-t border-slate-850/80 pt-6">
          <div className="flex items-center gap-2 text-slate-400 mb-4 justify-center">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Acesso Rápido para Avaliação (Demo)</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              id="demo-login-guilherme"
              onClick={() => loginAsDemoUser(
                'guilherme@spirits.com', 
                'Guilherme Silva', 
                'SpiritsBoss', 
                'Líder', 
                'gengar-gmax', 
                'Charizard ex'
              )}
              className="flex items-center gap-3 bg-slate-950/40 hover:bg-slate-950 p-2.5 rounded-xl border border-slate-850/80 hover:border-purple-500/30 transition-all text-left text-xs cursor-pointer group"
            >
              <div className="w-8 h-8 bg-purple-950/30 rounded-lg flex items-center justify-center overflow-hidden border border-purple-550/20 group-hover:border-purple-500/40">
                <PokemonSprite name="gengar-gmax" size="sm" className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] text-purple-400 font-mono font-bold">LÍDER</div>
                <div className="font-extrabold text-white truncate">Guilherme Silva</div>
              </div>
            </button>

            <button
              type="button"
              id="demo-login-thiago"
              onClick={() => loginAsDemoUser(
                'thiago@spirits.com', 
                'Thiago Pereira', 
                'ThunderBolt', 
                'Capitão', 
                'pikachu', 
                'Miraidon ex'
              )}
              className="flex items-center gap-3 bg-slate-950/40 hover:bg-slate-950 p-2.5 rounded-xl border border-slate-850/80 hover:border-purple-500/30 transition-all text-left text-xs cursor-pointer group"
            >
              <div className="w-8 h-8 bg-purple-950/30 rounded-lg flex items-center justify-center overflow-hidden border border-purple-550/20 group-hover:border-purple-500/40">
                <PokemonSprite name="pikachu" size="sm" className="w-6 h-6 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] text-purple-400 font-mono font-bold">CAPITÃO</div>
                <div className="font-extrabold text-white truncate">Thiago Pereira</div>
              </div>
            </button>
          </div>
          
          <p className="text-[10px] text-slate-500 text-center mt-3.5">
            Ao clicar nos botões de demo, o sistema cria e configura automaticamente as contas oficiais de simulação utilizando o Firebase Auth e Firestore.
          </p>
        </div>

      </div>
    </div>
  );
}
