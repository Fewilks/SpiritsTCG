import React, { useState, useEffect } from 'react';
import { Member } from './types';
import { db, seedDatabaseIfEmpty, membersCol, auth } from './lib/firebase';
import { getDocs, getDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Auth from './components/Auth';
import SpiritsLogo from './components/SpiritsLogo';
import Dashboard from './components/Dashboard';
import Collection from './components/Collection';
import Loans from './components/Loans';
import Matches from './components/Matches';
import Decks from './components/Decks';
import TeamMembers from './components/TeamMembers';
import MyProfile from './components/MyProfile';
import RoleLock from './components/RoleLock';
import { 
  Trophy, 
  Swords, 
  ArrowLeftRight, 
  Layers, 
  Users, 
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  HelpCircle,
  User,
  Lock
} from 'lucide-react';
import PokemonSprite from './components/PokemonSprite';
import { getRoleBadge } from './utils';

export function getRoleRankValue(role: string): number {
  const normalized = (role || '').toLowerCase().replace(/\s+/g, '');
  if (normalized === 'pokeball') return 1;
  if (normalized === 'greatball') return 2;
  if (normalized === 'ultraball') return 3;
  if (normalized === 'masterball') return 4;
  if (normalized === 'premiumball') return 5;
  return 1;
}

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
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));

      const activeUid = userUid || auth.currentUser?.uid;

      // Define admin emails that must be Premium ball and have admin rights
      const adminEmails = [
        'felipewilks@gmail.com',
        'abner.catarino09@gmail.com',
        'matheustadiottoa@gmail.com'
      ];

      // Match the logged in user's ID
      if (activeUid) {
        const currentUserEmail = auth.currentUser?.email?.toLowerCase().trim() || '';
        const isAdminEmail = adminEmails.includes(currentUserEmail);
        let matched = list.find(m => m.id === activeUid);

        // If no direct UID match, try matching by demo emails to merge accounts
        if (!matched) {
          if (currentUserEmail.includes('felipe') || currentUserEmail.includes('wilks')) {
            matched = list.find(m => m.id === 'member-felipe' || m.nickname === 'felipewilks' || (m.name || '').toLowerCase().includes('felipe'));
          } else {
            // General match by name/email handle
            const localPart = currentUserEmail.split('@')[0];
            matched = list.find(m => (m.name || '').toLowerCase().includes(localPart) || m.nickname?.toLowerCase() === localPart);
          }
        }

        if (matched) {
          // If we mapped to a default seeded member (e.g. 'member-1'), migrate their document ID in Firestore
          if (matched.id !== activeUid) {
            console.log(`Migrating/mapping seeded member ${matched.name} (${matched.id}) to auth UID ${activeUid}`);
            const migratedMember = { ...matched, id: activeUid };
            await setDoc(doc(db, 'members', activeUid), migratedMember);
            
            // If the old document was the seed ID, delete the old document
            if (matched.id.startsWith('member-')) {
              try {
                await deleteDoc(doc(db, 'members', matched.id));
              } catch (e) {
                console.error('Error cleaning up old seed member doc:', e);
              }
            }
            
            matched = migratedMember;
          }

          // Force admin role and ensure email is stored
          const finalRole = isAdminEmail ? 'Premium ball' : (matched.role || 'pokeball');
          if (matched.role !== finalRole || matched.email !== currentUserEmail) {
            matched.role = finalRole as any;
            matched.email = currentUserEmail;
            await setDoc(doc(db, 'members', activeUid), { ...matched, role: finalRole, email: currentUserEmail });
          }

          setCurrentMember(matched);
        } else {
          // Fallback: If no matched record yet, read individual doc or create one on the fly
          const docRef = doc(db, 'members', activeUid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const extraMember = { id: docSnap.id, ...docSnap.data() } as Member;
            const finalRole = isAdminEmail ? 'Premium ball' : (extraMember.role || 'pokeball');
            if (extraMember.role !== finalRole || extraMember.email !== currentUserEmail) {
              extraMember.role = finalRole as any;
              extraMember.email = currentUserEmail;
              await setDoc(docRef, { ...extraMember, role: finalRole, email: currentUserEmail });
            }
            setCurrentMember(extraMember);
          } else {
            // Create a dynamic member document for this registered/authenticated user
            const email = auth.currentUser?.email || '';
            const defaultName = auth.currentUser?.displayName || email.split('@')[0] || 'Novo Treinador';
            const assignedRole = isAdminEmail ? 'Premium ball' : 'pokeball';

            const newMember: Member = {
              id: activeUid,
              name: defaultName,
              role: assignedRole,
              nickname: defaultName.toLowerCase().replace(/\s+/g, ''),
              avatarSprite: 'pikachu',
              wins: 0,
              losses: 0,
              draws: 0,
              email: email.toLowerCase().trim(),
              joinDate: new Date().toISOString().split('T')[0]
            };
            await setDoc(docRef, newMember);
            setCurrentMember(newMember);
          }
        }
      }

      // Re-fetch clean members list and force admin roles for any matching email
      const finalSnap = await getDocs(membersCol);
      const finalList = finalSnap.docs.map(d => {
        const m = { id: d.id, ...d.data() } as Member;
        if (m.email && adminEmails.includes(m.email.toLowerCase().trim()) && m.role !== 'Premium ball') {
          m.role = 'Premium ball';
          setDoc(doc(db, 'members', m.id), m);
        }
        return m;
      });
      setMembers(finalList);

      if (!activeUid) {
        const defaultUser = finalList.find(m => m.id === 'member-felipe') || finalList[0] || null;
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, minRank: 1 },
    { id: 'colecao', label: 'Minha Coleção', icon: Layers, minRank: 2 },
    { id: 'emprestimos', label: 'Empréstimos', icon: ArrowLeftRight, minRank: 3 },
    { id: 'partidas', label: 'Partidas', icon: Swords, minRank: 3 },
    { id: 'decks', label: 'Meus Decks', icon: Trophy, minRank: 1 },
    { id: 'perfil', label: 'Meu Perfil', icon: User, minRank: 1 },
    { id: 'time', label: 'Time Spirits', icon: Users, minRank: 1 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row" id="app-shell">
      
      {/* 1. LEFT SIDEBAR PANEL */}
      <aside className="w-full md:w-64 bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-850/80 shrink-0 flex flex-col justify-between p-5 relative z-40 backdrop-blur-md">
        
        <div className="space-y-6">
          {/* Spirits Team Branding Brand Header */}
          <div className="flex items-center gap-3 border-b border-slate-850/60 pb-5">
            <div className="w-10 h-10 shrink-0 overflow-hidden relative" id="spirits-logo-container">
              <SpiritsLogo className="w-full h-full" />
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
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850/80 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 bg-slate-900/80 rounded-lg border border-slate-800 shrink-0 flex items-center justify-center overflow-hidden">
                  <PokemonSprite name={currentMember.avatarSprite} size="sm" />
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5">{getRoleBadge(currentMember.role)}</div>
                  <div className="text-white font-black text-xs truncate">{currentMember.nickname || currentMember.name}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1" id="nav-menu">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLocked = false;

              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer group ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-950/40 to-indigo-950/10 text-purple-350 border-l-4 border-purple-500 font-extrabold shadow-md shadow-purple-950/20' 
                      : 'text-slate-400 hover:bg-slate-850/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-purple-400' : 'text-slate-550'}`} />
                    <span>{item.label}</span>
                  </div>
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
            {activeTab === 'dashboard' && (
              <Dashboard 
                currentMember={currentMember} 
                setActiveTab={setActiveTab} 
                onStatsHealed={() => loadPortalData(currentUser?.uid)} 
              />
            )}
            
            {activeTab === 'colecao' && <Collection currentMember={currentMember} />}
            
            {activeTab === 'emprestimos' && <Loans currentMember={currentMember} />}
            
            {activeTab === 'partidas' && <Matches currentMember={currentMember} />}
            
            {activeTab === 'decks' && <Decks currentMember={currentMember} />}
            
            {activeTab === 'perfil' && (
              <MyProfile 
                currentMember={currentMember} 
                setCurrentMember={setCurrentMember} 
                onMemberUpdated={loadPortalData} 
              />
            )}
            
            {activeTab === 'time' && (
              <TeamMembers 
                currentMember={currentMember} 
                setCurrentMember={setCurrentMember} 
                onMemberUpdated={loadPortalData} 
                currentUserEmail={currentUser?.email || ''} 
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
              <div className="w-10 h-10 bg-purple-900/30 rounded-full flex items-center justify-center border border-purple-500/30">
                <span className="text-xl animate-pulse">🔮</span>
              </div>
            </div>
            <h3 className="text-white font-bold text-sm mt-6">Carregando perfil de treinador...</h3>
          </div>
        )}
      </main>

    </div>
  );
}
