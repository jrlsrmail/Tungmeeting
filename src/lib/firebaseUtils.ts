import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Meeting, AppSettings } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Transform Firestore Date to JS Date
const fromFirestoreMeeting = (doc: any): Meeting => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
  };
};

export const subscribeMeetings = (onUpdate: (meetings: Meeting[]) => void) => {
  const path = 'meetings';
  const q = collection(db, path);
  return onSnapshot(q, (snapshot) => {
    const meetings = snapshot.docs.map(fromFirestoreMeeting);
    onUpdate(meetings);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const saveMeetings = async (meetings: Meeting[]) => {
  const path = 'meetings';
  try {
    const batch = writeBatch(db);
    meetings.forEach(m => {
      const docRef = doc(db, path, m.id);
      batch.set(docRef, {
        ...m,
        date: Timestamp.fromDate(m.date),
        updatedAt: Timestamp.now()
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updateMeeting = async (meeting: Meeting) => {
  const path = `meetings/${meeting.id}`;
  try {
    await setDoc(doc(db, 'meetings', meeting.id), {
      ...meeting,
      date: Timestamp.fromDate(meeting.date),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteMeeting = async (id: string) => {
  const path = `meetings/${id}`;
  try {
    await deleteDoc(doc(db, 'meetings', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const deleteSeries = async (groupId: string) => {
  const path = 'meetings';
  try {
    const q = query(collection(db, path), where('groupId', '==', groupId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const getSettings = async (): Promise<AppSettings | null> => {
  const path = 'settings/config';
  try {
    const docRef = doc(db, 'settings', 'config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const saveSettings = async (settings: AppSettings) => {
  const path = 'settings/config';
  try {
    await setDoc(doc(db, 'settings', 'config'), {
      ...settings,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
