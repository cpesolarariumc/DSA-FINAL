import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export interface DoctorAccount {
  uid: string;
  fullName: string;
  email: string;
  specialization: string;
  role: 'doctor';
  createdAt?: Timestamp | null;
}

/**
 * Creates a doctor account securely in Firebase Auth and stores metadata in Firestore.
 */
export async function createDoctorAccount(
  email: string,
  pass: string,
  fullName: string,
  specialization: string
): Promise<void> {
  // 1. Create account in Firebase Auth so the password is securely stored and hashed
  const userCred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = userCred.user.uid;

  // 2. Save doctor profile record in Firestore under /doctors/{uid}
  const doctorRef = doc(db, 'doctors', uid);
  await setDoc(doctorRef, {
    uid,
    fullName,
    email,
    specialization,
    role: 'doctor',
    createdAt: serverTimestamp(),
  });
}

/**
 * Adds a UID-keyed doctor document for legacy doctor profiles stored under
 * generated document IDs, so Firestore rules can identify the signed-in doctor.
 */
export async function ensureDoctorProfileAtAuthUid(
  uid: string,
  email: string,
  profile: Record<string, unknown>,
): Promise<void> {
  const doctorRef = doc(db, 'doctors', uid);
  const doctorSnapshot = await getDoc(doctorRef);
  if (doctorSnapshot.exists()) return;

  await setDoc(doctorRef, {
    uid,
    email,
    fullName: typeof profile.fullName === 'string' ? profile.fullName : 'Doctor',
    specialization: typeof profile.specialization === 'string'
      ? profile.specialization
      : typeof profile.specialty === 'string'
        ? profile.specialty
        : '',
    role: 'doctor',
    createdAt: serverTimestamp(),
  });
}