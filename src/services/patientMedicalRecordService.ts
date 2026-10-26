import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface PatientDirectoryEntry {
  id: string;
  accountNo: string;
  fullName: string;
  email: string;
  sex: string;
  age: string;
  birthday: string;
  contact: string;
  address: string;
  allergies: string;
  temporary?: boolean;
}

export interface PatientMedicalRecord {
  id: string;
  title: string;
  details: string;
  doctorName: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export function subscribeToPatientDirectory(
  callback: (patients: PatientDirectoryEntry[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, 'patients'),
    (snapshot) => {
      const patients = snapshot.docs.map((patientDoc) => {
        const data = patientDoc.data();
        return {
          id: patientDoc.id,
          accountNo: typeof data.accountNo === 'string' ? data.accountNo : patientDoc.id,
          fullName: typeof data.fullName === 'string' ? data.fullName : 'Unnamed patient',
          email: typeof data.email === 'string' ? data.email : '',
          sex: typeof data.sex === 'string' ? data.sex : '',
          age: typeof data.age === 'string' ? data.age : '',
          birthday: typeof data.birthday === 'string' ? data.birthday : '',
          contact: typeof data.contact === 'string' ? data.contact : '',
          address: typeof data.address === 'string' ? data.address : '',
          allergies: typeof data.allergies === 'string' ? data.allergies : '',
          temporary: data.temporary === true,
        };
      });
      callback(patients);
    },
    onError,
  );
}

export async function findPatientByAccountNo(accountNo: string): Promise<PatientDirectoryEntry | null> {
  const patientQuery = query(
    collection(db, 'patients'),
    where('accountNo', '==', accountNo.trim()),
  );
  const snapshot = await getDocs(patientQuery);
  const patientDoc = snapshot.docs[0];

  if (!patientDoc) {
    return null;
  }

  return patientDirectoryEntry(patientDoc.id, patientDoc.data());
}

export async function findPatientById(patientId: string): Promise<PatientDirectoryEntry | null> {
  const patientSnapshot = await getDoc(doc(db, 'patients', patientId));
  if (!patientSnapshot.exists()) return null;
  return patientDirectoryEntry(patientSnapshot.id, patientSnapshot.data());
}

function patientDirectoryEntry(id: string, data: Record<string, unknown>): PatientDirectoryEntry {
  return {
    id,
    accountNo: typeof data.accountNo === 'string' ? data.accountNo : id,
    fullName: typeof data.fullName === 'string' ? data.fullName : 'Unnamed patient',
    email: typeof data.email === 'string' ? data.email : '',
    sex: typeof data.sex === 'string' ? data.sex : '',
    age: typeof data.age === 'string' ? data.age : '',
    birthday: typeof data.birthday === 'string' ? data.birthday : '',
    contact: typeof data.contact === 'string' ? data.contact : '',
    address: typeof data.address === 'string' ? data.address : '',
    allergies: typeof data.allergies === 'string' ? data.allergies : '',
    temporary: data.temporary === true,
  };
}

export function subscribeToPatientMedicalRecords(
  patientId: string,
  callback: (records: PatientMedicalRecord[]) => void,
  onError: (error: Error) => void,
) {
  const recordsQuery = query(
    collection(db, 'patients', patientId, 'medicalRecords'),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    recordsQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((recordDoc) => {
          const data = recordDoc.data();
          return {
            id: recordDoc.id,
            title: typeof data.title === 'string' ? data.title : '',
            details: typeof data.details === 'string' ? data.details : '',
            doctorName: typeof data.doctorName === 'string' ? data.doctorName : '',
            createdAt: data.createdAt ?? null,
            updatedAt: data.updatedAt ?? null,
          };
        }),
      );
    },
    onError,
  );
}

export async function updatePatientAllergies(patientId: string, allergies: string) {
  await updateDoc(doc(db, 'patients', patientId), {
    allergies: allergies.trim() || 'None recorded',
    updatedAt: serverTimestamp(),
  });
}

export async function addPatientMedicalRecord(
  patientId: string,
  title: string,
  details: string,
  doctorName: string,
  doctorId: string,
) {
  await addDoc(collection(db, 'patients', patientId, 'medicalRecords'), {
    title: title.trim(),
    details: details.trim(),
    doctorName,
    doctorId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function editPatientMedicalRecord(
  patientId: string,
  recordId: string,
  title: string,
  details: string,
  doctorName: string,
  doctorId: string,
) {
  await updateDoc(doc(db, 'patients', patientId, 'medicalRecords', recordId), {
    title: title.trim(),
    details: details.trim(),
    doctorName,
    doctorId,
    updatedAt: serverTimestamp(),
  });
}
