import { initializeApp } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, deleteDoc, updateDoc, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, ChatThread, Message } from '../types';

// Robust configuration merging
const finalConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)'
};

let app;
let auth: any;
let db: any;

try {
  app = initializeApp(finalConfig);
  auth = getAuth(app);
  db = getFirestore(app, finalConfig.firestoreDatabaseId);
} catch (error) {
  console.error("Firebase failed to initialize:", error);
}

export { auth, db };

export async function guestSignIn() {
  if (!auth) return;
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error("Guest Sign-In failed:", error);
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
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Profile Service
export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  
  const profile: UserProfile = {
    uid: user.uid,
    email: user.isAnonymous ? 'Guest' : user.email,
    displayName: user.isAnonymous ? 'Guest' : user.displayName,
    photoURL: user.photoURL,
    createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date().toISOString()
  };

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      ...profile,
      createdAt: serverTimestamp()
    });
  }
  return profile;
}

// Chat Service
export async function createThread(userId: string, title: string): Promise<string> {
  try {
    const threadRef = collection(db, 'threads');
    const newThread = await addDoc(threadRef, {
      userId,
      title,
      isPinned: false,
      lastMessageAt: serverTimestamp(),
      previewText: ''
    });
    return newThread.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'threads');
    return '';
  }
}

export async function addMessage(threadId: string, message: Omit<Message, 'id' | 'timestamp'>) {
  try {
    const messageRef = collection(db, 'threads', threadId, 'messages');
    const docRef = await addDoc(messageRef, {
      ...message,
      timestamp: serverTimestamp()
    });
    
    // Update thread preview
    const threadRef = doc(db, 'threads', threadId);
    await updateDoc(threadRef, {
      lastMessageAt: serverTimestamp(),
      previewText: message.content.substring(0, 100)
    });
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `threads/${threadId}/messages`);
  }
}

export async function deleteThread(threadId: string) {
  try {
    await deleteDoc(doc(db, 'threads', threadId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `threads/${threadId}`);
  }
}

export async function deleteMessage(threadId: string, messageId: string) {
  try {
    await deleteDoc(doc(db, 'threads', threadId, 'messages', messageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `threads/${threadId}/messages/${messageId}`);
  }
}

export async function togglePinMessage(threadId: string, messageId: string, pinned: boolean) {
  try {
    await updateDoc(doc(db, 'threads', threadId, 'messages', messageId), { pinned });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `threads/${threadId}/messages/${messageId}`);
  }
}

export async function togglePin(threadId: string, isPinned: boolean) {
  try {
    await updateDoc(doc(db, 'threads', threadId), { isPinned });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `threads/${threadId}`);
  }
}
