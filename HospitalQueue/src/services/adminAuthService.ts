// src/services/adminAuthService.ts
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export interface AdminProfile {
  uid: string;
  adminNumber: string;
  fullName: string;
  email: string;
  role: 'admin';
}

/**
 * 1. Register a new Admin (Securely creates auth credentials + metadata document)
 */
export async function createAdminAccount(
  email: string, 
  pass: string, 
  adminNumber: string, 
  fullName: string
): Promise<AdminProfile> {
  // A. Create secure user credentials in Firebase Auth (Password is hashed automatically)
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = userCredential.user.uid;

  // B. Save non-sensitive admin metadata in Firestore linked to the Auth UID
  const adminData: Omit<AdminProfile, 'uid'> = {
    adminNumber,
    fullName,
    email,
    role: 'admin',
  };

  await setDoc(doc(db, 'admins', uid), {
    ...adminData,
    createdAt: serverTimestamp(),
  });

  return { uid, ...adminData };
}

/**
 * 2. Admin Login Verification (Authenticates password & checks Firestore 'admins' role)
 */
export async function loginAdmin(email: string, pass: string): Promise<AdminProfile> {
  // A. Authenticate email + password with Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const uid = userCredential.user.uid;

  // B. Retrieve metadata from Firestore admins collection
  const adminDoc = await getDoc(doc(db, 'admins', uid));

  if (!adminDoc.exists()) {
    throw new Error('Unauthorized access: Account is not an admin.');
  }

  const profile = adminDoc.data() as Omit<AdminProfile, 'uid'>;

  // C. Verify user has admin role
  if (profile.role !== 'admin') {
    throw new Error('Access denied: Insufficient privileges.');
  }

  return { uid, ...profile };
}