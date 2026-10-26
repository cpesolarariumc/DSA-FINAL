import { db } from '../firebaseConfig';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export async function generateSequentialPatientId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const counterRef = doc(db, 'counters', `patient_counter_${currentYear}`);

  try {
    const newId = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let nextSequence = 1;
      if (counterDoc.exists()) {
        nextSequence = (counterDoc.data().lastSequence || 0) + 1;
      }

      transaction.set(counterRef, { 
        lastSequence: nextSequence,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const paddedSequence = String(nextSequence).padStart(4, '0');
      return `PTNT-${currentYear}-${paddedSequence}`;
    });

    return newId;
  } catch (error) {
    console.error("Error generating sequential ID:", error);
    return `PTNT-${currentYear}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }
}