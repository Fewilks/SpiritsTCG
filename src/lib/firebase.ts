import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { Member, CardItem, LoanRecord, MatchRecord, DeckRecord } from '../types';
import { db, auth } from './firebase-config';
export { db, auth };


// Collection references
export const membersCol = collection(db, 'members');
export const collectionCol = collection(db, 'collection');
export const loansCol = collection(db, 'loans');
export const matchesCol = collection(db, 'matches');
export const decksCol = collection(db, 'decks');

// Seed default data if database is empty and ensure high-quality, valid competitive items
export async function seedDatabaseIfEmpty() {
  try {
    console.log('Running database maintenance and clean up...');

    // 1. Clear mock loans from Firestore if they exist
    const loansQuery = await getDocs(loansCol);
    for (const d of loansQuery.docs) {
      const data = d.data();
      const isMock = d.id.startsWith('loan-') || 
                     (data.borrowerId && data.borrowerId.startsWith('member-')) || 
                     (data.ownerId && data.ownerId.startsWith('member-'));
      if (isMock) {
        try {
          await deleteDoc(doc(db, 'loans', d.id));
          console.log(`Deleted mock loan: ${d.id}`);
        } catch (e) {
          console.error(`Failed to delete mock loan ${d.id}:`, e);
        }
      }
    }

    // 2. Clear seeded and mock cards from Firestore if they exist
    const cardsQuery = await getDocs(collectionCol);
    for (const d of cardsQuery.docs) {
      const data = d.data();
      const isMock = d.id.startsWith('sv3-') || 
                     d.id.startsWith('sv4-') || 
                     d.id.startsWith('sv1-') || 
                     d.id.startsWith('pgo-') ||
                     d.id.startsWith('seed_') ||
                     (data.ownerId && data.ownerId.startsWith('member-'));
      if (isMock) {
        try {
          await deleteDoc(doc(db, 'collection', d.id));
          console.log(`Deleted mock card: ${d.id}`);
        } catch (e) {
          console.error(`Failed to delete mock card ${d.id}:`, e);
        }
      }
    }

    // 3. Clear mock decks from Firestore if they exist
    const decksQuery = await getDocs(decksCol);
    for (const d of decksQuery.docs) {
      const data = d.data();
      const isMock = d.id.startsWith('deck-') || 
                     (data.userId && data.userId.startsWith('member-'));
      if (isMock) {
        try {
          await deleteDoc(doc(db, 'decks', d.id));
          console.log(`Deleted mock deck: ${d.id}`);
        } catch (e) {
          console.error(`Failed to delete mock deck ${d.id}:`, e);
        }
      }
    }

    // 4. Clear seeded matches from Firestore if they exist
    const matchesQuery = await getDocs(matchesCol);
    for (const d of matchesQuery.docs) {
      const isMock = d.id.startsWith('seed_') || d.id.startsWith('match-') || d.id.startsWith('test-');
      if (isMock) {
        try {
          await deleteDoc(doc(db, 'matches', d.id));
          console.log(`Deleted mock match: ${d.id}`);
        } catch (e) {
          console.error(`Failed to delete mock match ${d.id}:`, e);
        }
      }
    }

    // 5. Clear mock members from Firestore if they exist (except currently authenticated ones if applicable)
    const membersQuery = await getDocs(membersCol);
    const mockMemberNames = [
      "Guilherme Silva",
      "Thiago Pereira",
      "Lucas Souza",
      "Matheus Santos",
      "Felipe Costa",
      "Rafael Bastazini",
      "Felipe Wilks",
      "Abner Catarino",
      "Matheus Tadiotto"
    ];
    const mockMemberNicknames = [
      "SpiritsBoss",
      "ThunderBolt",
      "DeckBuilder",
      "DrawPass",
      "FireBlast",
      "Shadow",
      "felipewilks",
      "AbnerCatarino",
      "MatheusTadiotto"
    ];

    for (const d of membersQuery.docs) {
      const data = d.data() as Member;
      const isMock = d.id.startsWith('member-') || 
                     mockMemberNames.includes(data.name) || 
                     (data.nickname && mockMemberNicknames.includes(data.nickname));
      // Only delete if it's not the currently authenticated user's ID
      if (isMock && d.id !== auth.currentUser?.uid) {
        try {
          await deleteDoc(doc(db, 'members', d.id));
          console.log(`Deleted mock member: ${data.name} (${d.id})`);
        } catch (e) {
          console.error(`Failed to delete mock member ${d.id}:`, e);
        }
      }
    }

    console.log('Database check and cleanup completed successfully!');
  } catch (error) {
    console.error('Error during database check and cleanup:', error);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
