import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../firebaseConfig';

const roomAccountApp = initializeApp(firebaseConfig, 'room-account-creator');
const roomAccountAuth = getAuth(roomAccountApp);

export interface RoomAccount {
  uid: string;
  fullName: string;
  roomName: string;
  email: string;
  role: 'room';
}

export const roomDestinations = [
  { name: 'Resuscitation Room', emergency: true },
  { name: 'Trauma Operating Room', emergency: true },
  { name: 'Major Trauma Bay', emergency: true },
  { name: 'Trauma Bay / CT Scan', emergency: true },
  { name: 'Trauma Room', emergency: true },
  { name: 'Trauma / Burn Resuscitation Unit', emergency: true },
  { name: 'Acute Stroke Unit / ER Resuscitation', emergency: true },
  { name: 'Orthopedic Trauma Room', emergency: true },
  { name: 'Minor Trauma / Procedure Room', emergency: true },
  { name: 'Respiratory Care Bay', emergency: true },
  { name: 'OB-GYN Emergency / ER Operating Room', emergency: true },
  { name: 'ER Surgical Evaluation Bay', emergency: true },
  { name: 'Emergency Department Triage / Manual Assignment', emergency: true },
  { name: 'Internal Medicine Clinic', emergency: false },
  { name: 'Endocrinology Clinic', emergency: false },
  { name: 'Pediatrics Clinic', emergency: false },
  { name: 'Obstetrics & Gynecology (OB-GYN) Clinic', emergency: false },
  { name: 'Orthopedics Clinic', emergency: false },
  { name: 'Dermatology Clinic', emergency: false },
  { name: 'Cardiology Clinic', emergency: false },
  { name: 'Pulmonology Clinic', emergency: false },
  { name: 'Medical Intensive Care Unit (MICU)', emergency: false },
  { name: 'Surgical Intensive Care Unit (SICU)', emergency: false },
  { name: 'Coronary Care Unit (CCU) / Cardiac ICU', emergency: false },
  { name: 'Pediatric Intensive Care Unit (PICU)', emergency: false },
  { name: 'Neonatal Intensive Care Unit (NICU)', emergency: false },
  { name: 'General Medical Ward', emergency: false },
  { name: 'General Surgical Ward', emergency: false },
  { name: 'Isolation / Infectious Disease Ward', emergency: false },
] as const;

export async function createRoomAccount(
  email: string,
  password: string,
  roomName: string,
): Promise<RoomAccount> {
  const adminUser = auth.currentUser;
  if (!adminUser) {
    throw new Error('Your administrator session has expired. Sign in again before creating a Room account.');
  }

  let adminProfile;
  try {
    adminProfile = await getDoc(doc(db, 'admins', adminUser.uid));
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';
    if (code === 'permission-denied') {
      throw new Error(
        `Firestore could not verify your administrator profile at /admins/${adminUser.uid}. ` +
        'Ensure this document exists with role "admin", and that the published Firestore rules match firebaseRuling.txt.',
        { cause: error },
      );
    }
    throw error;
  }

  if (!adminProfile.exists() || adminProfile.data().role !== 'admin') {
    throw new Error(
      `Your account is not registered as an administrator at /admins/${adminUser.uid}. ` +
      'Create or correct that profile in Firestore before creating Room accounts.',
    );
  }

  let user: { uid: string; email: string | null };
  try {
    const credentials = await createUserWithEmailAndPassword(roomAccountAuth, email.trim(), password);
    user = credentials.user;
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';
    if (code !== 'auth/email-already-in-use') throw error;

    const credentials = await signInWithEmailAndPassword(roomAccountAuth, email.trim(), password);
    user = credentials.user;
  }

  const roomAccount: RoomAccount = {
    uid: user.uid,
    fullName: roomName.trim(),
    roomName: roomName.trim(),
    email: user.email || email.trim(),
    role: 'room',
  };

  try {
    const roomRef = doc(db, 'rooms', roomAccount.uid);
    const existingRoom = await getDoc(roomRef);
    if (existingRoom.exists()) {
      const existingData = existingRoom.data();
      const existingName = typeof existingData.roomName === 'string'
        ? existingData.roomName
        : existingData.fullName;
      if (existingData.role !== 'room' || existingName !== roomAccount.roomName) {
        throw new Error('This email already belongs to a different staff role or Room. Select the correct account or contact an administrator.');
      }
      return roomAccount;
    }

    const [doctorProfile, adminProfile] = await Promise.all([
      getDoc(doc(db, 'doctors', roomAccount.uid)),
      getDoc(doc(db, 'admins', roomAccount.uid)),
    ]);
    if (doctorProfile.exists() || adminProfile.exists()) {
      throw new Error('This email is already linked to a doctor or administrator account and cannot be registered as Room staff.');
    }

    try {
      await setDoc(roomRef, {
        ...roomAccount,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';
      if (code === 'permission-denied') {
        throw new Error(
          `Firestore denied creating /rooms/${roomAccount.uid}. ` +
          'Confirm the published rules allow Room creation by an authenticated admin and that they use the same Firebase project as the app. ' +
          'If this is a new Room email, its Firebase Auth account may already have been created; retry with the same credentials after fixing the rules.',
          { cause: error },
        );
      }
      throw error;
    }
    return roomAccount;
  } finally {
    await signOut(roomAccountAuth);
  }
}
