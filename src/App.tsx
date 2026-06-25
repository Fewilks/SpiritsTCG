import React, { useState, useEffect } from 'react';
import { Member } from './types';
import { db, seedDatabaseIfEmpty, membersCol, auth } from './lib/firebase';
import { getDocs, getDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Collection from './components/Collection';
import Loans from './components/Loans';
import Matches from './components/Matches';
import Decks from './components/Decks';
import TeamMembers from './components/TeamMembers';
import { 
  Trophy, 
  Swords, 
  ArrowLeftRight, 
  Layers, 
  Users, 
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  HelpCircle
} from 'lucide-react';
import PokemonSprite from './components/PokemonSprite';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  // Bootstrap Firebase Firestore and retrieve members list on load
  const loadPortalData = async (userUid?: string) => {
    try {
      // Seed Firestore with rich demo data if empty
      await seedDatabaseIfEmpty();

      // Retrieve Spirits roster
      const snap = await getDocs(membersCol);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      setMembers(list);

      // Match the logged in user's ID
      if (userUid) {
        const matched = list.find(m => m.id === userUid);
        if (matched) {
          setCurrentMember(matched);
        } else {
          // Fallback: If no matched record yet, read the individual doc
          const docRef = doc(db, 'members', userUid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const extraMember = { id: docSnap.id, ...docSnap.data() } as Member;
            setCurrentMember(extraMember);
            setMembers(prev => {
              if (!prev.find(m => m.id === userUid)) {
                return [...prev, extraMember];
              }
              return prev;
            });
          } else {
            // Ultimate fallback
            setCurrentMember(list[0] || null);
          }
        }
      } else {
        const defaultUser = list.find(m => m.id === 'member-1') || list[0] || null;
        setCurrentMember(defaultUser);
      }
    } catch (err) {
      console.error('Error bootstrapping Spirits portal:', err);
    }
  };

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      try {
        if (user) {
          setCurrentUser(user);
          await loadPortalData(user.uid);
        } else {
          setCurrentUser(null);
          setCurrentMember(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSwitchProfile = (memberId: string) => {
    const selected = members.find(m => m.id === memberId);
    if (selected) {
      setCurrentMember(selected);
      setShowProfileSwitcher(false);
      // Trigger short reload of dashboard/collection to match selected member
      const active = activeTab;
      setActiveTab('dashboard');
      setTimeout(() => setActiveTab(active), 10);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-4">
        {/* Stylized spectral loading circle */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center border border-purple-500/30">
            <span className="text-3xl animate-pulse">🔮</span>
          </div>
        </div>
        <h2 className="text-white font-extrabold text-xl mt-6 tracking-tight">Canalizando Spirits Portal...</h2>
        <p className="text-slate-550 text-xs mt-2 font-mono">Conectando ao Firebase Firestore e APIs de metagame...</p>
      </div>
    );
  }

  // If no authenticated user, render the Login / Signup screen
  if (!currentUser) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'colecao', label: 'Minha Coleção', icon: Layers },
    { id: 'emprestimos', label: 'Empréstimos', icon: ArrowLeftRight },
    { id: 'partidas', label: 'Partidas', icon: Swords },
    { id: 'decks', label: 'Meus Decks', icon: Trophy },
    { id: 'time', label: 'Time Spirits', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row" id="app-shell">
      
      {/* 1. LEFT SIDEBAR PANEL */}
      <aside className="w-full md:w-64 bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-850/80 shrink-0 flex flex-col justify-between p-5 relative z-40 backdrop-blur-md">
        
        <div className="space-y-6">
          {/* Spirits Team Branding Brand Header */}
          <div className="flex items-center gap-3 border-b border-slate-850/60 pb-5">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-650 to-indigo-650 rounded-xl flex items-center justify-center shadow-lg shadow-purple-950/50 border border-purple-400/20 shrink-0 animate-pulse">
              <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">👻</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                SPIRITS <span className="text-purple-400 text-xs font-mono">TCG</span>
              </h1>
              <p className="text-[10px] text-purple-350 font-extrabold uppercase tracking-widest">Competitive Team</p>
            </div>
          </div>

          {/* Active Player Context profile indicator */}
          {currentMember && (
            <div className="relative">
              <div 
                id="active-profile-trigger"
                onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
                className="bg-slate-950/40 hover:bg-slate-950/80 p-3 rounded-xl border border-slate-850/80 hover:border-purple-500/30 transition-all cursor-pointer flex items-center justify-between shadow-inner"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 bg-slate-900/80 rounded-lg border border-slate-800 shrink-0 flex items-center justify-center overflow-hidden">
                    <PokemonSprite name={currentMember.avatarSprite} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] text-purple-400 font-mono font-bold uppercase tracking-wider">{currentMember.role}</div>
                    <div className="text-white font-black text-xs truncate">{currentMember.nickname || currentMember.name}</div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showProfileSwitcher ? 'rotate-180' : ''}`} />
              </div>

              {/* Profile selector dropdown options */}
              {showProfileSwitcher && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden divide-y divide-slate-850 max-h-56 overflow-y-auto backdrop-blur-md">
                  <div className="px-3 py-1 text-[9px] text-slate-500 font-bold uppercase">Simular outro Membro:</div>
                  {members.map(mem => (
                    <button
                      key={mem.id}
                      id={`switch-to-${mem.id}`}
                      onClick={() => handleSwitchProfile(mem.id)}
                      className={`w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-950 flex items-center gap-2 ${
                        mem.id === currentMember.id ? 'text-purple-400 bg-slate-950/50' : 'text-slate-300'
                      } cursor-pointer`}
                    >
                      <PokemonSprite name={mem.avatarSprite} size="sm" className="w-5 h-5 shrink-0" />
                      <span className="truncate">{mem.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1" id="nav-menu">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowProfileSwitcher(false);
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer group ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-950/40 to-indigo-950/10 text-purple-350 border-l-4 border-purple-500 font-extrabold shadow-md shadow-purple-950/20' 
                      : 'text-slate-400 hover:bg-slate-850/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Button and Footer info brand */}
        <div className="space-y-4 mt-auto pt-4 border-t border-slate-850/60">
          <button
            id="sidebar-logout-btn"
            onClick={() => signOut(auth)}
            className="w-full px-4 py-2 bg-slate-950/40 hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-slate-850 hover:border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md group"
          >
            <span>Sair do Portal</span>
          </button>

          <div className="text-center text-[10px] text-slate-500 font-mono space-y-1">
            <div>Spirits competitive v1.2</div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-emerald-400 font-bold">Firestore Sincronizado</span>
            </div>
          </div>
        </div>

      </aside>

      {/* 2. MAIN CORE STAGE SHEET */}
      <main className="flex-1 bg-slate-950 p-6 md:p-8 overflow-y-auto max-h-screen" id="main-stage">
        {currentMember ? (
          <div>
            {activeTab === 'dashboard' && <Dashboard currentMember={currentMember} setActiveTab={setActiveTab} />}
            {activeTab === 'colecao' && <Collection currentMember={currentMember} />}
            {activeTab === 'emprestimos' && <Loans currentMember={currentMember} />}
            {activeTab === 'partidas' && <Matches currentMember={currentMember} />}
            {activeTab === 'decks' && <Decks currentMember={currentMember} />}
            {activeTab === 'time' && <TeamMembers currentMember={currentMember} setCurrentMember={setCurrentMember} onMemberUpdated={loadPortalData} />}
          </div>
        ) : (
          <div className="text-center py-20">
            <PokemonSprite name="substitute" size="lg" className="mx-auto animate-bounce" />
            <h2 className="text-xl font-bold text-white mt-4">Nenhum membro do time selecionado</h2>
            <p className="text-xs text-slate-400 mt-2">Escolha ou crie um membro do Spirits na aba correspondente para continuar.</p>
          </div>
        )}
      </main>

    </div>
  );
}
