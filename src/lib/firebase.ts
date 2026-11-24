import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { ServiceModelDoc, ServiceSection } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (
  typeof window === 'undefined' ||
  (window.location.protocol !== 'file:' &&
    !(window as unknown as { __MAGDANA_OFFLINE__?: boolean }).__MAGDANA_OFFLINE__)
) {
  void testConnection();
}

export async function signInMasterWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutMaster(): Promise<void> {
  await signOut(auth);
}

const SECTION_STORAGE_META: Record<
  ServiceSection,
  { collectionName: string; idField: 'techniqueId' | 'haircutId' | 'careId' | 'stylingId' }
> = {
  coloring: { collectionName: 'coloring_models', idField: 'techniqueId' },
  haircuts: { collectionName: 'haircut_models', idField: 'haircutId' },
  care: { collectionName: 'care_models', idField: 'careId' },
  styling: { collectionName: 'styling_models', idField: 'stylingId' },
};

const MAX_IMAGE_DATA_URL_LENGTH = 440000;
const ITEM_ID_REGEX = /^[a-z0-9-]+$/;

export function subscribePublishedModels(
  section: ServiceSection,
  onData: (models: Record<string, ServiceModelDoc>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const { collectionName, idField } = SECTION_STORAGE_META[section];
  const q = query(
    collection(db, collectionName),
    where('isPublished', '==', true)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const next: Record<string, ServiceModelDoc> = {};
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        const ts = raw.updatedAt as Timestamp | undefined;
        const resolvedId = typeof raw[idField] === 'string' ? raw[idField] : docSnap.id;
        next[docSnap.id] = {
          itemId: resolvedId,
          techniqueId: section === 'coloring' ? resolvedId : undefined,
          haircutId: section === 'haircuts' ? resolvedId : undefined,
          careId: section === 'care' ? resolvedId : undefined,
          stylingId: section === 'styling' ? resolvedId : undefined,
          imageDataUrl: typeof raw.imageDataUrl === 'string' ? raw.imageDataUrl : '',
          promptUsed: typeof raw.promptUsed === 'string' ? raw.promptUsed : '',
          source: raw.source === 'upload' ? 'upload' : 'ai',
          isPublished: raw.isPublished === true,
          approvedBy: typeof raw.approvedBy === 'string' ? raw.approvedBy : '',
          updatedAt: ts && typeof ts.toDate === 'function' ? ts.toDate() : null,
        };
      });
      onData(next);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

/**
 * Compresses any data URL (AI output or uploaded photo) into a crisp 3:4 portrait JPEG
 * well below the 450KB Firestore document validation limit.
 */
export async function compressImageDataUrl(rawDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const targetMaxWidth = 720;
      const scale = img.width > targetMaxWidth ? targetMaxWidth / img.width : 1;
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Не удалось инициализировать обработку изображения.'));
        return;
      }
      ctx.fillStyle = '#141211';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.82;
      let output = canvas.toDataURL('image/jpeg', quality);
      while (output.length > MAX_IMAGE_DATA_URL_LENGTH && quality > 0.35) {
        quality -= 0.1;
        output = canvas.toDataURL('image/jpeg', quality);
      }

      if (output.length > MAX_IMAGE_DATA_URL_LENGTH) {
        const smaller = document.createElement('canvas');
        smaller.width = Math.round(width * 0.72);
        smaller.height = Math.round(height * 0.72);
        const sctx = smaller.getContext('2d');
        if (sctx) {
          sctx.drawImage(canvas, 0, 0, smaller.width, smaller.height);
          output = smaller.toDataURL('image/jpeg', 0.72);
        }
      }

      if (output.length > MAX_IMAGE_DATA_URL_LENGTH) {
        reject(new Error('Изображение превышает допустимый размер для публикации.'));
        return;
      }
      resolve(output);
    };
    img.onerror = () => reject(new Error('Не удалось загрузить изображение для сжатия.'));
    img.src = rawDataUrl;
  });
}

export async function publishServiceModel(
  section: ServiceSection,
  params: {
    itemId: string;
    imageDataUrl: string;
    promptUsed: string;
    source: 'ai' | 'upload';
  }
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Требуется вход в аккаунт мастера (Google), чтобы публиковать фото в облако.');
  }

  const itemId = params.itemId.trim();
  if (!ITEM_ID_REGEX.test(itemId) || itemId.length < 2 || itemId.length > 64) {
    throw new Error('Некорректный идентификатор услуги.');
  }

  const { collectionName, idField } = SECTION_STORAGE_META[section];
  const compressedUrl = await compressImageDataUrl(params.imageDataUrl);
  const cleanPrompt = (params.promptUsed || itemId).trim().slice(0, 800) || itemId;
  const docPath = `${collectionName}/${itemId}`;
  const docRef = doc(db, collectionName, itemId);

  try {
    const existingSnap = await getDoc(docRef);
    const createdAtValue =
      existingSnap.exists() && existingSnap.data().createdAt
        ? existingSnap.data().createdAt
        : serverTimestamp();

    await setDoc(docRef, {
      [idField]: itemId,
      imageDataUrl: compressedUrl,
      promptUsed: cleanPrompt,
      source: params.source,
      isPublished: true,
      approvedBy: user.uid,
      createdAt: createdAtValue,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function removeServiceModel(
  section: ServiceSection,
  itemId: string
): Promise<void> {
  const { collectionName } = SECTION_STORAGE_META[section];
  const docPath = `${collectionName}/${itemId}`;
  try {
    await deleteDoc(doc(db, collectionName, itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
