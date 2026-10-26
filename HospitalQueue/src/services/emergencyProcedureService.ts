import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface EmergencyProtocol {
  id: string;
  routingId: string;
  emergencyType: string;
  steps: string[];
  version: string;
}

export interface EmergencyProcedureProgress {
  protocolVersion: string;
  completedStepIds: string[];
}

function toEmergencyProtocol(id: string, data: Record<string, unknown>): EmergencyProtocol | null {
  if (
    typeof data.emergencyType !== 'string' ||
    !Array.isArray(data.steps) ||
    !data.steps.every((step) => typeof step === 'string') ||
    typeof data.version !== 'string'
  ) {
    return null;
  }

  return {
    id,
    routingId: typeof data.routingId === 'string' ? data.routingId : id,
    emergencyType: data.emergencyType,
    steps: data.steps,
    version: data.version,
  };
}

export function subscribeToEmergencyProtocols(
  callback: (protocols: EmergencyProtocol[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'emergencyProtocols'),
    (snapshot) => {
      callback(snapshot.docs.flatMap((protocolDoc) => {
        const protocol = toEmergencyProtocol(protocolDoc.id, protocolDoc.data());
        return protocol ? [protocol] : [];
      }));
    },
    onError,
  );
}

export async function saveEmergencyProtocol(
  routingId: string,
  emergencyType: string,
  steps: string[],
  updatedBy: string,
) {
  const normalizedSteps = steps.map((step) => step.trim()).filter(Boolean);
  if (!routingId.trim() || !emergencyType.trim() || normalizedSteps.length === 0) {
    throw new Error('Choose an emergency type and enter at least one approved procedure step.');
  }

  const protocolRef = doc(db, 'emergencyProtocols', routingId);
  const version = doc(collection(db, 'emergencyProtocols')).id;
  await setDoc(protocolRef, {
    routingId,
    emergencyType: emergencyType.trim(),
    steps: normalizedSteps,
    version,
    updatedBy,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToEmergencyProcedureProgress(
  patientId: string,
  routingId: string,
  callback: (progress: EmergencyProcedureProgress | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'patients', patientId, 'emergencyProcedureProgress', routingId),
    (snapshot) => {
      const data = snapshot.data();
      callback(
        snapshot.exists() &&
          typeof data?.protocolVersion === 'string' &&
          Array.isArray(data.completedStepIds) &&
          data.completedStepIds.every((stepId: unknown) => typeof stepId === 'string')
          ? {
              protocolVersion: data.protocolVersion,
              completedStepIds: data.completedStepIds,
            }
          : null,
      );
    },
    onError,
  );
}

export async function updateEmergencyProcedureStep(
  patientId: string,
  routingId: string,
  protocolVersion: string,
  stepId: string,
  isCompleted: boolean,
) {
  const progressRef = doc(db, 'patients', patientId, 'emergencyProcedureProgress', routingId);

  await runTransaction(db, async (transaction) => {
    const progressSnapshot = await transaction.get(progressRef);
    const existing = progressSnapshot.data();
    const completedStepIds = existing?.protocolVersion === protocolVersion &&
      Array.isArray(existing.completedStepIds)
      ? existing.completedStepIds.filter((value): value is string => typeof value === 'string')
      : [];
    const nextCompletedStepIds = isCompleted
      ? Array.from(new Set([...completedStepIds, stepId]))
      : completedStepIds.filter((completedStepId) => completedStepId !== stepId);

    transaction.set(progressRef, {
      protocolVersion,
      completedStepIds: nextCompletedStepIds,
      updatedAt: serverTimestamp(),
    });
  });
}
